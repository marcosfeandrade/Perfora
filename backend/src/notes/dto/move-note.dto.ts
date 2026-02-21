import { IsString, IsOptional } from 'class-validator';

export class MoveNoteDto {
  @IsOptional()
  @IsString()
  folderId?: string | null;

  @IsOptional()
  order?: number;
}
