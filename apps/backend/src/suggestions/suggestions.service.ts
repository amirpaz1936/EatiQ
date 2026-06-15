import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import {
  MealFeedback,
  MealFeedbackDocument,
  Profile,
  ProfileDocument,
  UserMeal,
  UserMealDocument,
} from "@eatiq/db";
import { Model, Types } from "mongoose";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import { OpenAISuggestionsClient } from "./openai-suggestions.client";
import type { SuggestionsResult } from "./schema";
import {
  isValidTimeZone,
  resolveMealSlot,
  startOfDayInTimeZone,
} from "./meal-slot.util";

const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const DEFAULT_LANGUAGE = "en";

@Injectable()
export class SuggestionsService implements OnModuleInit {
  private readonly logger = new Logger(SuggestionsService.name);
  private client!: OpenAISuggestionsClient;

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
    @InjectModel(MealFeedback.name)
    private readonly feedbackModel: Model<MealFeedbackDocument>,
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
      await this.cacheDel(cacheKey);
      this.logger.log(`cache invalidated ${cacheKey} — refreshing`);
    } else {
      const cached = await this.cacheGet(cacheKey);
      if (cached) {
        this.logger.log(`cache hit ${cacheKey}`);
        return cached;
      }
    }

    this.logger.log(`cache miss ${cacheKey} — generating`);
    const objectId = new Types.ObjectId(userId);
    const [profile, consumedCaloriesToday, recentFeedback] = await Promise.all([
      this.profileModel.findOne({ userId: objectId }).lean().exec(),
      this.sumCaloriesSince(objectId, startOfDayInTimeZone(tz)),
      this.recentFeedback(objectId),
    ]);

    const result = await this.client.suggest({
      mealSlot: slot,
      language: lang,
      profile: {
        goal: profile?.goal ?? null,
        dietType: profile?.dietType ?? null,
        avoid: profile?.avoid ?? "",
        notes: profile?.notes ?? "",
        targetCaloriesDaily: profile?.targetCaloriesDaily ?? null,
        heightCm: profile?.heightCm ?? null,
        weightKg: profile?.weightKg ?? null,
      },
      consumedCaloriesToday,
      recentFeedback,
    });

    await this.cacheSet(cacheKey, result);
    return result;
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

  private async recentFeedback(userId: Types.ObjectId): Promise<string[]> {
    const docs = await this.feedbackModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()
      .exec();
    return docs
      .map((f) =>
        [f.feeling, f.sentiment, f.symptoms]
          .filter((v) => v && String(v).trim())
          .join(" / "),
      )
      .filter((s) => s.length > 0);
  }

  private async cacheGet(key: string): Promise<SuggestionsResult | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as SuggestionsResult) : null;
    } catch (err) {
      this.logger.warn(`Redis GET failed for ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  private async cacheSet(key: string, value: SuggestionsResult): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Redis SET failed for ${key}: ${(err as Error).message}`);
    }
  }

  private async cacheDel(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed for ${key}: ${(err as Error).message}`);
    }
  }
}
