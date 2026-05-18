import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { MealItemDto } from "./meal-item.dto";
import { NutritionDto } from "./nutrition.dto";

export class CreateMealDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imageUrl?: string | null;

  @ValidateNested()
  @Type(() => NutritionDto)
  totals!: NutritionDto;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MealItemDto)
  items!: MealItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
