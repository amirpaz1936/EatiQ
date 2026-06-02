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
import { SuggestionsController } from "./suggestions.controller";
import { SuggestionsService } from "./suggestions.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: UserMeal.name, schema: UserMealSchema },
      { name: MealFeedback.name, schema: MealFeedbackSchema },
    ]),
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
})
export class SuggestionsModule {}
