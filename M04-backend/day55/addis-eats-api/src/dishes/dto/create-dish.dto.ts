import { IsString, Length, IsInt, Min } from 'class-validator';

export class CreateDishDto {
  @IsInt()
  @Min(1)
  restaurantId!: number;

  @IsString()
  @Length(2, 80)
  name!: string;

  @IsInt()
  @Min(1)
  priceSantim!: number;
}
