import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  MealFeedback,
  MealFeedbackDocument,
  UserMeal,
  UserMealDocument,
} from "@eatiq/db";
import { Model, Types } from "mongoose";
import type { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackInsightsService } from "../feedback-insights/feedback-insights.service";

@Injectable()
export class FeedbackService implements OnModuleInit {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectModel(MealFeedback.name)
    private readonly feedbackModel: Model<MealFeedbackDocument>,
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
    private readonly insights: FeedbackInsightsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.collapseDuplicateFeedback();
  }

  async save(
    userId: string,
    dto: CreateFeedbackDto,
  ): Promise<MealFeedbackDocument> {
    const meal = await this.userMealModel.findById(dto.mealId).exec();
    if (!meal) {
      throw new NotFoundException("Meal not found");
    }
    if (!meal.userId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException("Meal does not belong to this user");
    }

    const feedback = await this.feedbackModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId), mealId: meal._id },
        {
          $set: {
            feeling: dto.feeling?.trim() ?? "",
            sentiment: dto.sentiment ?? null,
            symptoms: dto.symptoms?.trim() ?? "",
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    // Fold this feedback into the user's rolling insights summary in the
    // background — never block or fail the write on the summarizer LLM.
    void this.insights.refresh(userId);

    return feedback;
  }

  async listForMeals(
    userId: string,
    mealIds: string[],
  ): Promise<MealFeedbackDocument[]> {
    if (mealIds.length === 0) return [];
    const objectIds = mealIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    return this.feedbackModel
      .find({
        userId: new Types.ObjectId(userId),
        mealId: { $in: objectIds },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private async collapseDuplicateFeedback(): Promise<void> {
    try {
      const duplicates = await this.feedbackModel
        .aggregate<{ _id: { userId: Types.ObjectId; mealId: Types.ObjectId }; stale: Types.ObjectId[] }>([
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: { userId: "$userId", mealId: "$mealId" },
              ids: { $push: "$_id" },
            },
          },
          { $match: { "ids.1": { $exists: true } } },
          { $project: { stale: { $slice: ["$ids", 1, { $size: "$ids" }] } } },
        ])
        .exec();

      const staleIds = duplicates.flatMap((d) => d.stale);
      if (staleIds.length > 0) {
        await this.feedbackModel.deleteMany({ _id: { $in: staleIds } }).exec();
        this.logger.log(
          `collapsed ${staleIds.length} superseded feedback row(s) across ${duplicates.length} meal(s)`,
        );
      }

      await this.feedbackModel.syncIndexes();
    } catch (err) {
      this.logger.warn(
        `feedback duplicate cleanup failed: ${(err as Error).message}`,
      );
    }
  }
}
