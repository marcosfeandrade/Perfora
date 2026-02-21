import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveCardDto {
  @IsOptional()
  @IsString()
  targetColumnId?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number;
}
