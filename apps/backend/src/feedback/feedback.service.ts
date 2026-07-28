import {
  ForbiddenException,
  Injectable,
  NotFoundException,
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
export class FeedbackService {
  constructor(
    @InjectModel(MealFeedback.name)
    private readonly feedbackModel: Model<MealFeedbackDocument>,
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
    private readonly insights: FeedbackInsightsService,
  ) {}

  async create(
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

    const feedback = await this.feedbackModel.create({
      userId: new Types.ObjectId(userId),
      mealId: meal._id,
      feeling: dto.feeling?.trim() ?? "",
      sentiment: dto.sentiment ?? null,
      symptoms: dto.symptoms?.trim() ?? "",
    });

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
}
