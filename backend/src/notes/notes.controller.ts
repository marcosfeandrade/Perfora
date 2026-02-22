import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { UpdateFolderDto } from './dto/update-folder.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { MoveNoteDto } from './dto/move-note.dto.js';
import { MoveFolderDto } from './dto/move-folder.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/user.decorator.js';
import { WorkspaceMemberGuard } from '../workspace/workspace-member.guard.js';

type AuthUser = { id: string; email: string; name: string | null };

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('workspaces/:workspaceId/folders')
  @UseGuards(WorkspaceMemberGuard)
  getFolderTree(
    @Param('workspaceId') workspaceId: string,
    @User() user: AuthUser,
  ) {
    return this.notesService.getFolderTree(workspaceId, user.id);
  }

  @Post('workspaces/:workspaceId/folders')
  @UseGuards(WorkspaceMemberGuard)
  createFolder(
    @Param('workspaceId') workspaceId: string,
    @User() user: AuthUser,
    @Body() dto: Omit<CreateFolderDto, 'workspaceId'>,
  ) {
    return this.notesService.createFolder(user.id, { ...dto, workspaceId });
  }

  @Patch('folders/:id')
  updateFolder(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.notesService.updateFolder(id, user.id, dto);
  }

  @Patch('folders/:id/move')
  moveFolder(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: MoveFolderDto,
  ) {
    return this.notesService.moveFolder(id, user.id, dto);
  }

  @Delete('folders/:id')
  deleteFolder(@Param('id') id: string, @User() user: AuthUser) {
    return this.notesService.deleteFolder(id, user.id);
  }

  @Get('workspaces/:workspaceId/notes/search')
  @UseGuards(WorkspaceMemberGuard)
  searchNotes(
    @Param('workspaceId') workspaceId: string,
    @Query('q') query: string,
    @User() user: AuthUser,
  ) {
    return this.notesService.searchNotes(workspaceId, query ?? '', user.id);
  }

  @Get('workspaces/:workspaceId/notes')
  @UseGuards(WorkspaceMemberGuard)
  getNotes(
    @Param('workspaceId') workspaceId: string,
    @User() user: AuthUser,
  ) {
    return this.notesService.getNotes(workspaceId, user.id);
  }

  @Get('notes/:id')
  getNote(@Param('id') id: string, @User() user: AuthUser) {
    return this.notesService.getNote(id, user.id);
  }

  @Get('notes/:id/backlinks')
  getBacklinks(@Param('id') id: string, @User() user: AuthUser) {
    return this.notesService.getBacklinks(id, user.id);
  }

  @Post('workspaces/:workspaceId/notes')
  @UseGuards(WorkspaceMemberGuard)
  createNote(
    @Param('workspaceId') workspaceId: string,
    @User() user: AuthUser,
    @Body() dto: Omit<CreateNoteDto, 'workspaceId'>,
  ) {
    return this.notesService.createNote(user.id, { ...dto, workspaceId });
  }

  @Patch('notes/:id')
  updateNote(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(id, user.id, dto);
  }

  @Patch('notes/:id/move')
  moveNote(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: MoveNoteDto,
  ) {
    return this.notesService.moveNote(id, user.id, dto);
  }

  @Delete('notes/:id')
  deleteNote(@Param('id') id: string, @User() user: AuthUser) {
    return this.notesService.deleteNote(id, user.id);
  }
}
