import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveCardDto {
  @IsString()
  @IsNotEmpty()
  targetColumnId: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number;
}
