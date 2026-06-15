import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
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
import { OpenAIInsightsClient } from "./openai-insights.client";
import type { Insights } from "./insights-schema";
import type { FeedbackEntry } from "./insights-prompt";

// How many recent raw feedbacks we re-feed alongside the running summary on every
// update. Re-anchoring on the recent window keeps incremental summarization from
// drifting away from ground truth without a periodic full rebuild.
const RECENT_WINDOW = 10;
const MAX_LIST = 20;

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
      this.config.get<string>("OPENAI_INSIGHTS_MODEL") ??
      this.config.get<string>("OPENAI_SUGGESTIONS_MODEL") ??
      "gpt-4o-mini";
    this.client = new OpenAIInsightsClient(apiKey, model);
  }

  // Re-summarize a user's feedback into Profile.feedbackInsights. Intended to be
  // called fire-and-forget after a feedback write — it must never throw into the
  // request path, so all failures are caught and logged.
  async refresh(userId: string): Promise<void> {
    try {
      const objectId = new Types.ObjectId(userId);

      const feedbacks = await this.feedbackModel
        .find({ userId: objectId })
        .sort({ createdAt: -1 })
        .limit(RECENT_WINDOW)
        .lean()
        .exec();

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

      const current = this.normalize(profile?.feedbackInsights ?? EMPTY_INSIGHTS);
      const updated = this.normalize(
        await this.client.summarize({ current, recent }),
      );

      await this.profileModel
        .updateOne(
          { userId: objectId },
          { $set: { feedbackInsights: { ...updated, feedbackCount: totalCount } } },
          { upsert: true },
        )
        .exec();

      this.logger.log(
        `insights updated user=${userId} count=${totalCount} avoid=${updated.avoid.length} reduce=${updated.reduce.length} enjoyed=${updated.enjoyed.length}`,
      );

      await this.invalidateSuggestions(userId);
    } catch (err) {
      this.logger.warn(
        `insights refresh failed user=${userId}: ${(err as Error).message}`,
      );
    }
  }

  // Defensive: dedupe, lowercase, trim and cap the lists in case the model
  // overshoots its instructions.
  private normalize(raw: Partial<Insights>): Insights {
    const clean = (arr: string[] | undefined): string[] => {
      const seen = new Set<string>();
      for (const item of arr ?? []) {
        const v = item.trim().toLowerCase();
        if (v) seen.add(v);
      }
      return [...seen].slice(0, MAX_LIST);
    };
    return {
      avoid: clean(raw.avoid),
      reduce: clean(raw.reduce),
      enjoyed: clean(raw.enjoyed),
      notes: (raw.notes ?? "").trim(),
    };
  }

  // Drop every cached suggestion for this user (all slots/languages) so the next
  // request regenerates with the fresh insights instead of waiting on the TTL.
  private async invalidateSuggestions(userId: string): Promise<void> {
    const pattern = `suggestions:${userId}:*`;
    try {
      const keys: string[] = [];
      for await (const batch of this.redis.scanStream({
        match: pattern,
        count: 100,
      })) {
        keys.push(...(batch as string[]));
      }
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`invalidated ${keys.length} suggestion cache key(s) for ${userId}`);
      }
    } catch (err) {
      this.logger.warn(
        `suggestion cache invalidation failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
