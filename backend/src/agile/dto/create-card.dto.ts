import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  order: number;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
