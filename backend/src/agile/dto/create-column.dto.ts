import { IsString, IsNotEmpty, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number;

  @IsString()
  @IsNotEmpty()
  boardId: string;
}
