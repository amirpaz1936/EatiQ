import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  MealFeedback,
  MealFeedbackSchema,
  UserMeal,
  UserMealSchema,
} from "@eatiq/db";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MealFeedback.name, schema: MealFeedbackSchema },
      { name: UserMeal.name, schema: UserMealSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
