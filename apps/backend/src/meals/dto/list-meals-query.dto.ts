import { IsDateString } from "class-validator";

export class ListMealsQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
