import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { DIET_TYPES, GOALS, type DietType, type Goal } from "@eatiq/db";

export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(GOALS)
  goal?: Goal;

  @IsOptional()
  @IsInt()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetCaloriesDaily?: number;

  @IsOptional()
  @IsEnum(DIET_TYPES)
  dietType?: DietType;

  @IsOptional()
  @IsString()
  avoid?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
