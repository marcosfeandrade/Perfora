import { IsString, IsOptional, IsInt, Min, MaxLength, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;

  @ValidateIf((_, v) => v != null && v !== '')
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) =>
    value === null ? null : value === undefined || value === '' ? undefined : Number(value)
  )
  wipLimit?: number | null;
}
