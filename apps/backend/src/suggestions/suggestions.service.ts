import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import {
  Profile,
  ProfileDocument,
  UserMeal,
  UserMealDocument,
} from "@eatiq/db";
import { Model, Types } from "mongoose";
import { OpenAISuggestionsClient } from "./openai-suggestions.client";
import type { SuggestionsResult } from "./schema";
import { SuggestionsCacheService } from "./suggestions-cache.service";
import {
  findViolations,
  parseAvoidTerms,
  withoutAvoided,
} from "./avoid-terms.util";
import {
  isValidTimeZone,
  resolveMealSlot,
  startOfDayInTimeZone,
} from "./meal-slot.util";

const DEFAULT_LANGUAGE = "en";

@Injectable()
export class SuggestionsService implements OnModuleInit {
  private readonly logger = new Logger(SuggestionsService.name);
  private client!: OpenAISuggestionsClient;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: SuggestionsCacheService,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
  ) {}

  onModuleInit(): void {
    const apiKey = this.config.getOrThrow<string>("OPENAI_API_KEY");
    const model =
      this.config.get<string>("OPENAI_SUGGESTIONS_MODEL") ?? "gpt-4o-mini";
    this.client = new OpenAISuggestionsClient(apiKey, model);
  }

  async getSuggestions(
    userId: string,
    timeZone: string,
    language?: string,
    refresh = false,
  ): Promise<SuggestionsResult> {
    const tz = isValidTimeZone(timeZone) ? timeZone : "UTC";
    const lang = (language ?? DEFAULT_LANGUAGE).trim() || DEFAULT_LANGUAGE;
    const slot = resolveMealSlot(tz);
    const cacheKey = `suggestions:${userId}:${slot}:${lang}`;

    if (refresh) {
      await this.cache.del(cacheKey);
      this.logger.log(`cache invalidated ${cacheKey} — refreshing`);
    } else {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.log(`cache hit ${cacheKey}`);
        return cached;
      }
    }

    this.logger.log(`cache miss ${cacheKey} — generating`);
    const objectId = new Types.ObjectId(userId);
    const [profile, consumedCaloriesToday] = await Promise.all([
      this.profileModel.findOne({ userId: objectId }).lean().exec(),
      this.sumCaloriesSince(objectId, startOfDayInTimeZone(tz)),
    ]);

    const insights = profile?.feedbackInsights;
    const profileAvoid = profile?.avoid ?? "";
    const insightsAvoid = insights?.avoid ?? [];

    const avoidTerms = parseAvoidTerms(profileAvoid, insightsAvoid);

    const ctx = {
      mealSlot: slot,
      language: lang,
      profile: {
        goal: profile?.goal ?? null,
        dietType: profile?.dietType ?? null,
        avoid: profileAvoid,
        notes: profile?.notes ?? "",
        targetCaloriesDaily: profile?.targetCaloriesDaily ?? null,
        heightCm: profile?.heightCm ?? null,
        weightKg: profile?.weightKg ?? null,
      },
      consumedCaloriesToday,
      feedbackInsights: {
        avoid: insightsAvoid,
        reduce: withoutAvoided(insights?.reduce ?? [], avoidTerms),
        enjoyed: withoutAvoided(insights?.enjoyed ?? [], avoidTerms),
        notes: insights?.notes ?? "",
      },
    };

    const result = await this.generateRespectingAvoidList(ctx, avoidTerms);

    await this.cache.set(cacheKey, result);
    return result;
  }

  private async generateRespectingAvoidList(
    ctx: Parameters<OpenAISuggestionsClient["suggest"]>[0],
    avoidTerms: string[],
  ): Promise<SuggestionsResult> {
    const result = await this.client.suggest(ctx);
    if (avoidTerms.length === 0) return result;

    const offenders = this.violatingSuggestions(result, avoidTerms);
    if (offenders.length === 0) return result;

    this.logger.warn(
      `suggestions violated avoid-list (${offenders.join("; ")}) — regenerating once`,
    );

    const retry = await this.client.suggest({
      ...ctx,
      retryViolations: offenders,
    });

    const stillOffending = this.violatingSuggestions(retry, avoidTerms);
    if (stillOffending.length === 0) return retry;

    const kept = retry.suggestions.filter(
      (s) =>
        findViolations([s.name, s.description, s.reason], avoidTerms).length === 0,
    );
    this.logger.warn(
      `dropping ${retry.suggestions.length - kept.length} suggestion(s) that still violated the avoid-list`,
    );
    return { ...retry, suggestions: kept };
  }

  private violatingSuggestions(
    result: SuggestionsResult,
    avoidTerms: string[],
  ): string[] {
    return result.suggestions.flatMap((s) => {
      const hits = findViolations([s.name, s.description, s.reason], avoidTerms);
      return hits.length > 0 ? [`"${s.name}" contains ${hits.join(", ")}`] : [];
    });
  }

  private async sumCaloriesSince(
    userId: Types.ObjectId,
    from: Date,
  ): Promise<number> {
    const meals = await this.userMealModel
      .find({ userId, eatenAt: { $gte: from } }, { "totals.calories": 1 })
      .lean()
      .exec();
    return meals.reduce((sum, m) => sum + (m.totals?.calories ?? 0), 0);
  }
}
