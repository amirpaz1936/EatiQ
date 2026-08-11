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
import { OpenAIReviewClient } from "./openai-review.client";
import type { MealReview } from "./review-schema";
import type { ReviewMealDto } from "./dto/review-meal.dto";
import {
  findViolations,
  mentionsTerm,
  parseAvoidTerms,
} from "../suggestions/avoid-terms.util";

const DEFAULT_LANGUAGE = "en";

@Injectable()
export class MealReviewService implements OnModuleInit {
  private readonly logger = new Logger(MealReviewService.name);
  private client!: OpenAIReviewClient;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
  ) {}

  onModuleInit(): void {
    const apiKey = this.config.getOrThrow<string>("OPENAI_API_KEY");
    const model =
      this.config.get<string>("OPENAI_REVIEW_MODEL") ??
      this.config.get<string>("OPENAI_SUGGESTIONS_MODEL") ??
      "gpt-4o-mini";
    this.client = new OpenAIReviewClient(apiKey, model);
  }

  async review(userId: string, dto: ReviewMealDto): Promise<MealReview> {
    const objectId = new Types.ObjectId(userId);
    const [profile, consumedCaloriesToday] = await Promise.all([
      this.profileModel.findOne({ userId: objectId }).lean().exec(),
      this.sumCaloriesToday(objectId),
    ]);

    const insights = profile?.feedbackInsights;

    const result = await this.client.review({
      language: dto.language?.trim() || DEFAULT_LANGUAGE,
      mealName: dto.name,
      items: dto.items.map((item) => ({
        name: item.name,
        estimatedWeightGrams: item.estimatedWeightGrams,
        calories: item.nutrition.calories,
      })),
      totals: {
        calories: dto.totals.calories,
        proteinGrams: dto.totals.proteinGrams,
        carbsGrams: dto.totals.carbsGrams,
        fatGrams: dto.totals.fatGrams,
      },
      profile: {
        goal: profile?.goal ?? null,
        dietType: profile?.dietType ?? null,
        avoid: profile?.avoid ?? "",
        notes: profile?.notes ?? "",
        targetCaloriesDaily: profile?.targetCaloriesDaily ?? null,
      },
      consumedCaloriesToday,
      feedbackInsights: {
        avoid: insights?.avoid ?? [],
        reduce: insights?.reduce ?? [],
        enjoyed: insights?.enjoyed ?? [],
        notes: insights?.notes ?? "",
      },
    });

    const avoidTerms = parseAvoidTerms(
      profile?.avoid ?? "",
      insights?.avoid ?? [],
    );
    const guarded = this.enforceAvoidList(result, dto, avoidTerms);

    this.logger.log(
      `meal reviewed user=${userId} verdict=${guarded.verdict} warnings=${guarded.warnings.length}`,
    );

    return guarded;
  }

  private enforceAvoidList(
    review: MealReview,
    dto: ReviewMealDto,
    avoidTerms: string[],
  ): MealReview {
    if (avoidTerms.length === 0) return review;

    const alreadyWarned = (term: string) =>
      review.warnings.some(
        (w) => mentionsTerm(w.ingredient, term) || mentionsTerm(w.reason, term),
      );

    const missed = dto.items.flatMap((item) => {
      const hits = findViolations([item.name], avoidTerms).filter(
        (term) => !alreadyWarned(term),
      );
      return hits.map((term) => ({
        ingredient: item.name,
        reason: `"${term}" is on your avoid list.`,
        severity: "blocking" as const,
      }));
    });

    if (missed.length === 0) {
      return review.warnings.some((w) => w.severity === "blocking")
        ? { ...review, verdict: "avoid" }
        : review;
    }

    this.logger.warn(
      `review missed ${missed.length} avoid-list violation(s): ${missed.map((m) => m.ingredient).join(", ")}`,
    );

    return {
      ...review,
      verdict: "avoid",
      headline:
        review.verdict === "avoid"
          ? review.headline
          : "This meal contains something on your avoid list.",
      warnings: [...review.warnings, ...missed],
    };
  }

  private async sumCaloriesToday(userId: Types.ObjectId): Promise<number> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const meals = await this.userMealModel
      .find({ userId, eatenAt: { $gte: start } }, { "totals.calories": 1 })
      .lean()
      .exec();
    return meals.reduce((sum, m) => sum + (m.totals?.calories ?? 0), 0);
  }
}
