import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
import { AgileGateway } from './agile.gateway.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';
import { CreateCardDto } from './dto/create-card.dto.js';
import { UpdateCardDto } from './dto/update-card.dto.js';
import { MoveCardDto } from './dto/move-card.dto.js';

@Injectable()
export class AgileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
    private readonly agileGateway: AgileGateway,
  ) {}

  async createBoard(userId: string, dto: CreateBoardDto) {
    await this.workspaceService.assertMember(dto.workspaceId, userId);
    const board = await this.prisma.board.create({
      data: {
        name: dto.name,
        workspaceId: dto.workspaceId,
      },
    });
    this.agileGateway.broadcastBoardsListUpdate(dto.workspaceId);
    return board;
  }

  async findBacklogCards(workspaceId: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
    return this.prisma.card.findMany({
      where: { workspaceId, columnId: null },
      orderBy: { order: 'asc' },
      include: {
        assignees: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findBoardsByWorkspace(workspaceId: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignees: {
                  include: { user: { select: { id: true, email: true, name: true } } },
                },
                createdBy: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async findBoard(id: string, userId: string) {
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                assignees: {
                  include: { user: { select: { id: true, email: true, name: true } } },
                },
                createdBy: { select: { id: true, email: true, name: true } },
              },
            },
          },
        },
      },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    return board;
  }

  async updateBoard(id: string, userId: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    return this.prisma.board.update({
      where: { id },
      data: dto,
    });
  }

  async removeBoard(id: string, userId: string) {
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    const deleted = await this.prisma.board.delete({
      where: { id },
    });
    this.agileGateway.broadcastBoardsListUpdate(board.workspaceId);
    return deleted;
  }

  async createColumn(userId: string, dto: CreateColumnDto) {
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: dto.boardId },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    const column = await this.prisma.column.create({
      data: {
        name: dto.name,
        order: dto.order,
        boardId: dto.boardId,
      },
    });
    const fullBoard = await this.findBoard(dto.boardId, userId);
    this.agileGateway.broadcastBoardUpdate(board.workspaceId, fullBoard);
    return column;
  }

  async updateColumn(id: string, userId: string, dto: UpdateColumnDto) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id },
      select: { boardId: true },
    });
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    const updated = await this.prisma.column.update({
      where: { id },
      data: dto,
    });
    await this.broadcastBoardForColumn(id, userId);
    return updated;
  }

  async removeColumn(id: string, userId: string) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id },
      select: { boardId: true },
    });
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    await this.prisma.column.delete({ where: { id } });
    const fullBoard = await this.findBoard(column.boardId, userId);
    this.agileGateway.broadcastBoardUpdate(board.workspaceId, fullBoard);
  }

  async moveColumnLeft(columnId: string, userId: string) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id: columnId },
    });
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    const columns = await this.prisma.column.findMany({
      where: { boardId: column.boardId },
      orderBy: { order: 'asc' },
    });
    const index = columns.findIndex((c) => c.id === columnId);
    if (index <= 0) return this.findBoard(column.boardId, userId);
    const prev = columns[index - 1];
    await this.prisma.$transaction([
      this.prisma.column.update({
        where: { id: columnId },
        data: { order: prev.order },
      }),
      this.prisma.column.update({
        where: { id: prev.id },
        data: { order: column.order },
      }),
    ]);
    await this.broadcastBoardForColumn(columnId, userId);
    return this.findBoard(column.boardId, userId);
  }

  async moveColumnRight(columnId: string, userId: string) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id: columnId },
    });
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(board.workspaceId, userId);
    const columns = await this.prisma.column.findMany({
      where: { boardId: column.boardId },
      orderBy: { order: 'asc' },
    });
    const index = columns.findIndex((c) => c.id === columnId);
    if (index < 0 || index >= columns.length - 1) return this.findBoard(column.boardId, userId);
    const next = columns[index + 1];
    await this.prisma.$transaction([
      this.prisma.column.update({
        where: { id: columnId },
        data: { order: next.order },
      }),
      this.prisma.column.update({
        where: { id: next.id },
        data: { order: column.order },
      }),
    ]);
    await this.broadcastBoardForColumn(columnId, userId);
    return this.findBoard(column.boardId, userId);
  }

  private async broadcastBoardForColumn(columnId: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });
    if (!column) return;
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    const fullBoard = await this.findBoard(column.boardId, userId);
    this.agileGateway.broadcastBoardUpdate(board.workspaceId, fullBoard);
  }

  async createCard(userId: string, dto: CreateCardDto) {
    const { assigneeIds, columnId, workspaceId, createdById, labels, ...rest } = dto;
    const title = rest.title.trim() || 'Nova task';
    let code: string | null = null;

    const createData = (wsId: string, colId: string | null, ord: number): Prisma.CardUncheckedCreateInput => ({
      title,
      code,
      workspaceId: wsId,
      columnId: colId,
      description: rest.description ?? null,
      order: ord,
      createdById: createdById ?? null,
      labels: labels?.length ? labels : undefined,
      assignees: assigneeIds?.length
        ? { create: assigneeIds.map((userId) => ({ userId })) }
        : undefined,
    });

    if (columnId) {
      const column = await this.prisma.column.findUniqueOrThrow({
        where: { id: columnId },
        include: { board: { include: { workspace: true } } },
      });
      await this.workspaceService.assertMember(column.board.workspaceId, userId);
      const workspace = column.board.workspace;

      if (workspace.plannerTaskPrefix?.trim()) {
        const prefix = workspace.plannerTaskPrefix.trim().toUpperCase();
        const count = await this.prisma.card.count({
          where: { workspaceId: workspace.id },
        });
        code = `${prefix}-${count + 1}`;
      }

      const colCards = await this.prisma.card.count({ where: { columnId } });
      const card = await this.prisma.card.create({
        data: createData(column.board.workspaceId, columnId, Math.min(rest.order, colCards)),
        include: {
          assignees: {
            include: { user: { select: { id: true, email: true, name: true } } },
          },
          createdBy: { select: { id: true, email: true, name: true } },
        },
      });
      if (labels?.length) {
        const ws = await this.prisma.workspace.findUniqueOrThrow({
          where: { id: workspace.id },
          select: { labels: true },
        });
        const existing = (ws.labels as string[]) ?? [];
        const merged = [...new Set([...existing, ...labels])];
        await this.prisma.workspace.update({
          where: { id: workspace.id },
          data: { labels: merged },
        });
      }
      await this.broadcastBoardForColumn(columnId, userId);
      return card;
    }

    if (!workspaceId) {
      throw new Error('workspaceId é obrigatório para criar card no backlog');
    }

    await this.workspaceService.assertMember(workspaceId, userId);
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    if (workspace.plannerTaskPrefix?.trim()) {
      const prefix = workspace.plannerTaskPrefix.trim().toUpperCase();
      const count = await this.prisma.card.count({
        where: { workspaceId },
      });
      code = `${prefix}-${count + 1}`;
    }

    const backlogCount = await this.prisma.card.count({
      where: { workspaceId, columnId: null },
    });

    const card = await this.prisma.card.create({
      data: createData(workspaceId, null, backlogCount),
      include: {
        assignees: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
    if (labels?.length) {
      const ws = await this.prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { labels: true },
      });
      const existing = (ws.labels as string[]) ?? [];
      const merged = [...new Set([...existing, ...labels])];
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { labels: merged },
      });
    }
    this.agileGateway.broadcastBacklogUpdate(workspaceId);
    return card;
  }

  async updateCard(id: string, userId: string, dto: UpdateCardDto) {
    const card = await this.prisma.card.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(card.workspaceId, userId);
    const { assigneeIds, labels, startDate, dueDate, priority, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (assigneeIds !== undefined) {
      await this.prisma.cardAssignee.deleteMany({ where: { cardId: id } });
      if (assigneeIds.length > 0) {
        await this.prisma.cardAssignee.createMany({
          data: assigneeIds.map((userId) => ({ cardId: id, userId })),
        });
      }
    }
    if (labels !== undefined) {
      data.labels = labels;
      const card = await this.prisma.card.findUniqueOrThrow({
        where: { id },
        select: { workspaceId: true },
      });
      const ws = await this.prisma.workspace.findUniqueOrThrow({
        where: { id: card.workspaceId },
        select: { labels: true },
      });
      const existing = (ws.labels as string[]) ?? [];
      const merged = [...new Set([...existing, ...labels])];
      await this.prisma.workspace.update({
        where: { id: card.workspaceId },
        data: { labels: merged },
      });
    }
    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (priority !== undefined) {
      data.priority = priority && priority.trim() ? priority.trim() : null;
    }
    const updated = await this.prisma.card.update({
      where: { id },
      data,
      include: {
        assignees: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
    if (updated.columnId) {
      await this.broadcastBoardForColumn(updated.columnId, userId);
    } else {
      this.agileGateway.broadcastBacklogUpdate(updated.workspaceId);
    }
    return updated;
  }

  async removeCard(id: string, userId: string) {
    const card = await this.prisma.card.findUniqueOrThrow({
      where: { id },
      select: { columnId: true, workspaceId: true },
    });
    await this.workspaceService.assertMember(card.workspaceId, userId);
    await this.prisma.card.delete({
      where: { id },
    });
    if (card.columnId) {
      await this.broadcastBoardForColumn(card.columnId, userId);
    } else {
      this.agileGateway.broadcastBacklogUpdate(card.workspaceId);
    }
  }

  async moveCard(cardId: string, userId: string, dto: MoveCardDto) {
    const card = await this.prisma.card.findUniqueOrThrow({
      where: { id: cardId },
      include: { column: true, workspace: true },
    });
    await this.workspaceService.assertMember(card.workspaceId, userId);

    const movingToBacklog = !dto.targetColumnId;
    const movingToColumn = !!dto.targetColumnId;

    if (movingToBacklog) {
      let backlogCards = await this.prisma.card.findMany({
        where: { workspaceId: card.workspaceId, columnId: null },
        orderBy: { order: 'asc' },
      });
      const existingIndex = backlogCards.findIndex((c) => c.id === cardId);
      const toIndex = Math.min(dto.order, backlogCards.length);
      const reordered =
        existingIndex >= 0
          ? reorderArray(backlogCards, existingIndex, toIndex)
          : (() => {
              const rest = backlogCards.filter((c) => c.id !== cardId);
              rest.splice(toIndex, 0, card as (typeof backlogCards)[0]);
              return rest;
            })();
      await this.prisma.$transaction(
        reordered.map((c, i) =>
          this.prisma.card.update({
            where: { id: c.id },
            data: {
              columnId: c.id === cardId ? null : undefined,
              workspaceId: c.id === cardId ? card.workspaceId : undefined,
              order: i,
            },
          }),
        ),
      );
      this.agileGateway.broadcastBacklogUpdate(card.workspaceId);
    if (card.columnId) {
      await this.broadcastBoardForColumn(card.columnId, userId);
    }
    return this.prisma.card.findUniqueOrThrow({
        where: { id: cardId },
        include: {
          assignees: {
            include: { user: { select: { id: true, email: true, name: true } } },
          },
        },
      });
    }

    const sameColumn = card.columnId === dto.targetColumnId;
    const targetOrder = dto.order;

    if (sameColumn) {
      const columnCards = await this.prisma.card.findMany({
        where: { columnId: card.columnId },
        orderBy: { order: 'asc' },
      });
      const fromIndex = columnCards.findIndex((c) => c.id === cardId);
      if (fromIndex === targetOrder) {
        return this.prisma.card.findUniqueOrThrow({ where: { id: cardId } });
      }
      const reordered = reorderArray(columnCards, fromIndex, targetOrder);
      await this.reorderCardsInColumn(card.columnId!, reordered);
    } else {
      const targetColumnId = dto.targetColumnId!;
      const targetColumn = await this.prisma.column.findUniqueOrThrow({
        where: { id: targetColumnId },
        select: { boardId: true, board: { select: { workspaceId: true } } },
      });
      await this.prisma.card.update({
        where: { id: cardId },
        data: {
          columnId: targetColumnId,
          workspaceId: targetColumn.board.workspaceId,
          order: targetOrder,
        },
      });
      const targetColumnCards = await this.prisma.card.findMany({
        where: { columnId: targetColumnId },
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      });
      await this.reorderCardsInColumn(
        targetColumnId,
        targetColumnCards.map((c) => ({ id: c.id })),
      );
      if (card.columnId) {
        await this.broadcastBoardForColumn(card.columnId, userId);
      }
      this.agileGateway.broadcastBacklogUpdate(card.workspaceId);
    }

    const updated = await this.prisma.card.findUniqueOrThrow({
      where: { id: cardId },
      include: { column: true },
    });
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id: updated.columnId! },
      select: { boardId: true },
    });
    const fullBoard = await this.findBoard(column.boardId, userId);
    const boardWithWorkspace = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    this.agileGateway.broadcastBoardUpdate(
      boardWithWorkspace.workspaceId,
      fullBoard,
    );
    return updated;
  }

  private async reorderCardsInColumn(
    columnId: string,
    cards: { id: string }[],
  ) {
    await this.prisma.$transaction(
      cards.map((c, i) =>
        this.prisma.card.update({
          where: { id: c.id },
          data: { order: i },
        }),
      ),
    );
  }
}

function reorderArray<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
