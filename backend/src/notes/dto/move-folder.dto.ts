import { IsString, IsOptional } from 'class-validator';

export class MoveFolderDto {
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  order?: number;
}
