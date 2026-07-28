import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  MealFeedback,
  MealFeedbackSchema,
  Profile,
  ProfileSchema,
  UserMeal,
  UserMealSchema,
} from "@eatiq/db";
import { FeedbackInsightsService } from "./feedback-insights.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: UserMeal.name, schema: UserMealSchema },
      { name: MealFeedback.name, schema: MealFeedbackSchema },
    ]),
  ],
  providers: [FeedbackInsightsService],
  exports: [FeedbackInsightsService],
})
export class FeedbackInsightsModule {}
