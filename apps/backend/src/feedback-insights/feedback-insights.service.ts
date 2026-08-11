import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
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
import { SuggestionsCacheService } from "../suggestions/suggestions-cache.service";
import { OpenAIInsightsClient } from "./openai-insights.client";
import type { Insights } from "./insights-schema";
import type { FeedbackEntry } from "./insights-prompt";
import {
  applyManualOverrides,
  deriveOverrides,
  normalizeInsights,
  normalizeOverrides,
  type ManualOverrides,
} from "./manual-overrides";

// How many recent raw feedbacks we re-feed alongside the running summary on every
// update. Re-anchoring on the recent window keeps incremental summarization from
// drifting away from ground truth without a periodic full rebuild.
const RECENT_WINDOW = 10;

const EMPTY_INSIGHTS: Insights = {
  avoid: [],
  reduce: [],
  enjoyed: [],
  notes: "",
};

@Injectable()
export class FeedbackInsightsService implements OnModuleInit {
  private readonly logger = new Logger(FeedbackInsightsService.name);
  private client!: OpenAIInsightsClient;

  constructor(
    private readonly config: ConfigService,
    private readonly suggestionsCache: SuggestionsCacheService,
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
      this.config.get<string>("OPENAI_INSIGHTS_MODEL") ??
      this.config.get<string>("OPENAI_SUGGESTIONS_MODEL") ??
      "gpt-4o-mini";
    this.client = new OpenAIInsightsClient(apiKey, model);
  }

  async refresh(userId: string): Promise<void> {
    try {
      const objectId = new Types.ObjectId(userId);

      // Dedupe by meal before taking the window. A meal whose feedback was edited
      // must contribute its *latest* opinion once — pulling raw rows would let a
      // correction and the thing it corrected both feed the summary.
      const feedbacks = await this.feedbackModel
        .find({ userId: objectId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean()
        .exec()
        .then((rows) => {
          const newestPerMeal = new Map<string, (typeof rows)[number]>();
          for (const row of rows) {
            const key = String(row.mealId);
            if (!newestPerMeal.has(key)) newestPerMeal.set(key, row);
          }
          return [...newestPerMeal.values()].slice(0, RECENT_WINDOW);
        });

      if (feedbacks.length === 0) return;

      const [meals, profile, totalCount] = await Promise.all([
        this.userMealModel
          .find(
            { _id: { $in: feedbacks.map((f) => f.mealId) } },
            { name: 1, "items.name": 1 },
          )
          .lean()
          .exec(),
        this.profileModel
          .findOne({ userId: objectId }, { feedbackInsights: 1 })
          .lean()
          .exec(),
        this.feedbackModel.countDocuments({ userId: objectId }).exec(),
      ]);

      const mealById = new Map(meals.map((m) => [String(m._id), m]));
      const recent: FeedbackEntry[] = feedbacks.map((f) => {
        const meal = mealById.get(String(f.mealId));
        return {
          mealName: meal?.name ?? "(unknown meal)",
          ingredients: (meal?.items ?? []).map((i) => i.name),
          sentiment: f.sentiment ?? null,
          feeling: f.feeling ?? "",
          symptoms: f.symptoms ?? "",
        };
      });

      const manual = normalizeOverrides(profile?.feedbackInsights?.manual);
      const current = normalizeInsights(
        profile?.feedbackInsights ?? EMPTY_INSIGHTS,
      );
      const generated = normalizeInsights(
        await this.client.summarize({ current, recent }),
      );

      // The user's own corrections outrank anything the summarizer produced.
      const updated = applyManualOverrides(generated, manual);

      await this.profileModel
        .updateOne(
          { userId: objectId },
          {
            $set: {
              feedbackInsights: {
                ...updated,
                feedbackCount: totalCount,
                manual,
              },
            },
          },
          { upsert: true },
        )
        .exec();

      this.logger.log(
        `insights updated user=${userId} count=${totalCount} avoid=${updated.avoid.length} reduce=${updated.reduce.length} enjoyed=${updated.enjoyed.length}`,
      );

      await this.suggestionsCache.invalidateForUser(userId);
    } catch (err) {
      this.logger.warn(
        `insights refresh failed user=${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Applies a user's hand-edit of the insights.
   *
   * `desired` is the full state the user wants to see. The difference against what
   * is currently stored becomes a durable set of overrides, so the next automatic
   * refresh re-applies the edit instead of undoing it.
   */
  async saveManualEdit(
    userId: string,
    desired: Partial<Insights>,
  ): Promise<Insights & { feedbackCount: number; manual: ManualOverrides }> {
    const objectId = new Types.ObjectId(userId);

    const profile = await this.profileModel
      .findOne({ userId: objectId }, { feedbackInsights: 1 })
      .lean()
      .exec();

    const current = normalizeInsights(
      profile?.feedbackInsights ?? EMPTY_INSIGHTS,
    );
    const next = normalizeInsights(desired);
    const manual = deriveOverrides(
      current,
      next,
      normalizeOverrides(profile?.feedbackInsights?.manual),
    );

    // Re-apply the derived overrides so precedence rules (avoid beats enjoyed) hold
    // for the saved state too, not just for regenerated ones.
    const effective = applyManualOverrides(next, manual);
    const feedbackCount = profile?.feedbackInsights?.feedbackCount ?? 0;

    await this.profileModel
      .updateOne(
        { userId: objectId },
        {
          $set: {
            feedbackInsights: { ...effective, feedbackCount, manual },
          },
          $setOnInsert: { userId: objectId },
        },
        { upsert: true },
      )
      .exec();

    this.logger.log(
      `insights manually edited user=${userId} pinned=${manual.avoid.length + manual.reduce.length + manual.enjoyed.length} removed=${manual.removed.length}`,
    );

    // The edit changes what may be suggested, so cached suggestions are now stale.
    await this.suggestionsCache.invalidateForUser(userId);

    return { ...effective, feedbackCount, manual };
  }
}
