import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { UpdateFolderDto } from './dto/update-folder.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { MoveNoteDto } from './dto/move-note.dto.js';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('workspaces/:workspaceId/folders')
  getFolderTree(@Param('workspaceId') workspaceId: string) {
    return this.notesService.getFolderTree(workspaceId);
  }

  @Post('workspaces/:workspaceId/folders')
  createFolder(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: Omit<CreateFolderDto, 'workspaceId'>,
  ) {
    return this.notesService.createFolder({ ...dto, workspaceId });
  }

  @Patch('folders/:id')
  updateFolder(@Param('id') id: string, @Body() dto: UpdateFolderDto) {
    return this.notesService.updateFolder(id, dto);
  }

  @Delete('folders/:id')
  deleteFolder(@Param('id') id: string) {
    return this.notesService.deleteFolder(id);
  }

  @Get('workspaces/:workspaceId/notes/search')
  searchNotes(
    @Param('workspaceId') workspaceId: string,
    @Query('q') query: string,
  ) {
    return this.notesService.searchNotes(workspaceId, query ?? '');
  }

  @Get('workspaces/:workspaceId/notes')
  getNotes(@Param('workspaceId') workspaceId: string) {
    return this.notesService.getNotes(workspaceId);
  }

  @Get('notes/:id')
  getNote(@Param('id') id: string) {
    return this.notesService.getNote(id);
  }

  @Get('notes/:id/backlinks')
  getBacklinks(@Param('id') id: string) {
    return this.notesService.getBacklinks(id);
  }

  @Post('workspaces/:workspaceId/notes')
  createNote(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: Omit<CreateNoteDto, 'workspaceId'>,
  ) {
    return this.notesService.createNote({ ...dto, workspaceId });
  }

  @Patch('notes/:id')
  updateNote(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notesService.updateNote(id, dto);
  }

  @Patch('notes/:id/move')
  moveNote(@Param('id') id: string, @Body() dto: MoveNoteDto) {
    return this.notesService.moveNote(id, dto);
  }

  @Delete('notes/:id')
  deleteNote(@Param('id') id: string) {
    return this.notesService.deleteNote(id);
  }
}
