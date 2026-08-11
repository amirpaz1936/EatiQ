import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { MealReviewService } from "./meal-review.service";
import { ReviewMealDto } from "./dto/review-meal.dto";

@Controller("meal-review")
export class MealReviewController {
  constructor(private readonly mealReviewService: MealReviewService) {}

  @Post()
  async review(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: ReviewMealDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.mealReviewService.review(userId, dto);
  }
}
