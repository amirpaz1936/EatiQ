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
import { FeedbackInsightsModule } from "../feedback-insights/feedback-insights.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MealFeedback.name, schema: MealFeedbackSchema },
      { name: UserMeal.name, schema: UserMealSchema },
    ]),
    FeedbackInsightsModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
