import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  plannerTaskPrefix?: string;

  @IsOptional()
  @IsObject()
  notesSettings?: Record<string, unknown>;
}
