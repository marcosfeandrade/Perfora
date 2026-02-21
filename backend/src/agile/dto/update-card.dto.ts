import { IsString, IsOptional, IsInt, Min, MaxLength, IsArray, IsDateString, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @ValidateIf((v) => v != null && v !== '')
  @IsString()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: string | null;
}
