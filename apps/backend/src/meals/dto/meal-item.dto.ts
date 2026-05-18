import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { NutritionDto } from "./nutrition.dto";

export class MealItemDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsNumber()
  @Min(0)
  estimatedWeightGrams!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  relativeAreaPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ValidateNested()
  @Type(() => NutritionDto)
  nutrition!: NutritionDto;
}
