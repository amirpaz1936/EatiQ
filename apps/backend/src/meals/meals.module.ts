import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserMeal, UserMealSchema } from "@eatiq/db";
import { MealsController } from "./meals.controller";
import { MealsService } from "./meals.service";
import { ImageRecognitionModule } from "../image-recognition/image-recognition.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserMeal.name, schema: UserMealSchema },
    ]),
    // For S3ClientProvider — meal photos are re-signed on read.
    ImageRecognitionModule,
  ],
  controllers: [MealsController],
  providers: [MealsService],
})
export class MealsModule {}
