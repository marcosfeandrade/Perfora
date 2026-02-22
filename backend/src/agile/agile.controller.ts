import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AgileService } from './agile.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';
import { CreateCardDto } from './dto/create-card.dto.js';
import { UpdateCardDto } from './dto/update-card.dto.js';
import { MoveCardDto } from './dto/move-card.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/user.decorator.js';
import { WorkspaceMemberGuard } from '../workspace/workspace-member.guard.js';

type AuthUser = { id: string; email: string; name: string | null };

@Controller('agile')
@UseGuards(JwtAuthGuard)
export class AgileController {
  constructor(private readonly agileService: AgileService) {}

  @Post('boards')
  createBoard(@User() user: AuthUser, @Body() dto: CreateBoardDto) {
    return this.agileService.createBoard(user.id, dto);
  }

  @Get('workspaces/:workspaceId/boards')
  @UseGuards(WorkspaceMemberGuard)
  findBoardsByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @User() user: AuthUser,
  ) {
    return this.agileService.findBoardsByWorkspace(workspaceId, user.id);
  }

  @Get('workspaces/:workspaceId/backlog')
  @UseGuards(WorkspaceMemberGuard)
  findBacklogCards(
    @Param('workspaceId') workspaceId: string,
    @User() user: AuthUser,
  ) {
    return this.agileService.findBacklogCards(workspaceId, user.id);
  }

  @Get('boards/:id')
  findBoard(@Param('id') id: string, @User() user: AuthUser) {
    return this.agileService.findBoard(id, user.id);
  }

  @Patch('boards/:id')
  updateBoard(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.agileService.updateBoard(id, user.id, dto);
  }

  @Delete('boards/:id')
  removeBoard(@Param('id') id: string, @User() user: AuthUser) {
    return this.agileService.removeBoard(id, user.id);
  }

  @Post('columns')
  createColumn(@User() user: AuthUser, @Body() dto: CreateColumnDto) {
    return this.agileService.createColumn(user.id, dto);
  }

  @Patch('columns/:id')
  updateColumn(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.agileService.updateColumn(id, user.id, dto);
  }

  @Patch('columns/:id/move-left')
  moveColumnLeft(@Param('id') id: string, @User() user: AuthUser) {
    return this.agileService.moveColumnLeft(id, user.id);
  }

  @Patch('columns/:id/move-right')
  moveColumnRight(@Param('id') id: string, @User() user: AuthUser) {
    return this.agileService.moveColumnRight(id, user.id);
  }

  @Delete('columns/:id')
  removeColumn(@Param('id') id: string, @User() user: AuthUser) {
    return this.agileService.removeColumn(id, user.id);
  }

  @Post('cards')
  createCard(@User() user: AuthUser, @Body() dto: CreateCardDto) {
    return this.agileService.createCard(user.id, dto);
  }

  @Patch('cards/:id')
  updateCard(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: UpdateCardDto,
  ) {
    return this.agileService.updateCard(id, user.id, dto);
  }

  @Delete('cards/:id')
  removeCard(@Param('id') id: string, @User() user: AuthUser) {
    return this.agileService.removeCard(id, user.id);
  }

  @Patch('cards/:id/move')
  moveCard(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() dto: MoveCardDto,
  ) {
    return this.agileService.moveCard(id, user.id, dto);
  }
}
