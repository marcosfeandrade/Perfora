import { IsString, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  folderId?: string | null;

  @IsOptional()
  workspaceId?: string;

  @IsOptional()
  order?: number;
}
