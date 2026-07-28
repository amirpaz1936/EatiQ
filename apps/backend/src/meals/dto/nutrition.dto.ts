import { IsNumber, IsOptional, Min } from "class-validator";

export class NutritionDto {
  @IsNumber()
  @Min(0)
  calories!: number;

  @IsNumber()
  @Min(0)
  proteinGrams!: number;

  @IsNumber()
  @Min(0)
  carbsGrams!: number;

  @IsNumber()
  @Min(0)
  fatGrams!: number;

  @IsNumber()
  @Min(0)
  fiberGrams!: number;

  @IsNumber()
  @Min(0)
  sugarGrams!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFatGrams?: number;
}
