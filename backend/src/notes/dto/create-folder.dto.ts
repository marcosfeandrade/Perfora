import { IsString, IsOptional } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  workspaceId?: string;

  @IsOptional()
  order?: number;
}
