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

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(MealFeedback.name)
    private readonly feedbackModel: Model<MealFeedbackDocument>,
    @InjectModel(UserMeal.name)
    private readonly userMealModel: Model<UserMealDocument>,
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

    return this.feedbackModel.create({
      userId: new Types.ObjectId(userId),
      mealId: meal._id,
      feeling: dto.feeling?.trim() ?? "",
      sentiment: dto.sentiment ?? null,
      symptoms: dto.symptoms?.trim() ?? "",
    });
  }
}
