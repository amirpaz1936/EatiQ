import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserMeal, UserMealSchema } from "@eatiq/db";
import { MealsController } from "./meals.controller";
import { MealsService } from "./meals.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserMeal.name, schema: UserMealSchema },
    ]),
  ],
  controllers: [MealsController],
  providers: [MealsService],
})
export class MealsModule {}
