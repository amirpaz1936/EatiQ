import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { MealsService } from "./meals.service";
import { CreateMealDto } from "./dto/create-meal.dto";
import { ListMealsQueryDto } from "./dto/list-meals-query.dto";

@Controller("meals")
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  async create(
    @Headers("x-user-id") userId: string | undefined,
    @Body() dto: CreateMealDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.mealsService.create(userId, dto);
  }

  @Get()
  async list(
    @Headers("x-user-id") userId: string | undefined,
    @Query() query: ListMealsQueryDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.mealsService.findInRange(userId, query.from, query.to);
  }

  @Get(":id/image")
  async image(
    @Headers("x-user-id") userId: string | undefined,
    @Param("id") id: string,
  ) {
    if (!userId) throw new UnauthorizedException();
    return { url: await this.mealsService.presignImage(userId, id) };
  }
}
