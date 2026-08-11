import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { MealItemDto } from "../../meals/dto/meal-item.dto";
import { NutritionDto } from "../../meals/dto/nutrition.dto";

export class ReviewMealDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @ValidateNested()
  @Type(() => NutritionDto)
  totals!: NutritionDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MealItemDto)
  items!: MealItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
