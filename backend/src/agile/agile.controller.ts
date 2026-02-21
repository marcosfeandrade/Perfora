import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AgileService } from './agile.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';
import { CreateCardDto } from './dto/create-card.dto.js';
import { UpdateCardDto } from './dto/update-card.dto.js';
import { MoveCardDto } from './dto/move-card.dto.js';

@Controller('agile')
export class AgileController {
  constructor(private readonly agileService: AgileService) {}

  @Post('boards')
  createBoard(@Body() dto: CreateBoardDto) {
    return this.agileService.createBoard(dto);
  }

  @Get('workspaces/:workspaceId/boards')
  findBoardsByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.agileService.findBoardsByWorkspace(workspaceId);
  }

  @Get('boards/:id')
  findBoard(@Param('id') id: string) {
    return this.agileService.findBoard(id);
  }

  @Patch('boards/:id')
  updateBoard(@Param('id') id: string, @Body() dto: UpdateBoardDto) {
    return this.agileService.updateBoard(id, dto);
  }

  @Delete('boards/:id')
  removeBoard(@Param('id') id: string) {
    return this.agileService.removeBoard(id);
  }

  @Post('columns')
  createColumn(@Body() dto: CreateColumnDto) {
    return this.agileService.createColumn(dto);
  }

  @Patch('columns/:id')
  updateColumn(@Param('id') id: string, @Body() dto: UpdateColumnDto) {
    return this.agileService.updateColumn(id, dto);
  }

  @Patch('columns/:id/move-left')
  moveColumnLeft(@Param('id') id: string) {
    return this.agileService.moveColumnLeft(id);
  }

  @Patch('columns/:id/move-right')
  moveColumnRight(@Param('id') id: string) {
    return this.agileService.moveColumnRight(id);
  }

  @Delete('columns/:id')
  removeColumn(@Param('id') id: string) {
    return this.agileService.removeColumn(id);
  }

  @Post('cards')
  createCard(@Body() dto: CreateCardDto) {
    return this.agileService.createCard(dto);
  }

  @Patch('cards/:id')
  updateCard(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.agileService.updateCard(id, dto);
  }

  @Delete('cards/:id')
  removeCard(@Param('id') id: string) {
    return this.agileService.removeCard(id);
  }

  @Patch('cards/:id/move')
  moveCard(@Param('id') id: string, @Body() dto: MoveCardDto) {
    return this.agileService.moveCard(id, dto);
  }
}
