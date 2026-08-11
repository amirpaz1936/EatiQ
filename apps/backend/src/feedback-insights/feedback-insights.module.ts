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
import { SuggestionsCacheModule } from "../suggestions/suggestions-cache.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: UserMeal.name, schema: UserMealSchema },
      { name: MealFeedback.name, schema: MealFeedbackSchema },
    ]),
    SuggestionsCacheModule,
  ],
  providers: [FeedbackInsightsService],
  exports: [FeedbackInsightsService],
})
export class FeedbackInsightsModule {}
