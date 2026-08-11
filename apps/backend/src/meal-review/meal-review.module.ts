import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Profile,
  ProfileSchema,
  UserMeal,
  UserMealSchema,
} from "@eatiq/db";
import { MealReviewController } from "./meal-review.controller";
import { MealReviewService } from "./meal-review.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: UserMeal.name, schema: UserMealSchema },
    ]),
  ],
  controllers: [MealReviewController],
  providers: [MealReviewService],
})
export class MealReviewModule {}
