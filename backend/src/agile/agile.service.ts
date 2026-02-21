import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service.js';
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
    private readonly agileGateway: AgileGateway,
  ) {}

  createBoard(dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        name: dto.name,
        workspaceId: dto.workspaceId,
      },
    });
  }

  findBacklogCards(workspaceId: string) {
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

  findBoardsByWorkspace(workspaceId: string) {
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

  findBoard(id: string) {
    return this.prisma.board.findUniqueOrThrow({
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
  }

  updateBoard(id: string, dto: UpdateBoardDto) {
    return this.prisma.board.update({
      where: { id },
      data: dto,
    });
  }

  removeBoard(id: string) {
    return this.prisma.board.delete({
      where: { id },
    });
  }

  async createColumn(dto: CreateColumnDto) {
    const column = await this.prisma.column.create({
      data: {
        name: dto.name,
        order: dto.order,
        boardId: dto.boardId,
      },
    });
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: dto.boardId },
      select: { workspaceId: true },
    });
    const fullBoard = await this.findBoard(dto.boardId);
    this.agileGateway.broadcastBoardUpdate(board.workspaceId, fullBoard);
    return column;
  }

  async updateColumn(id: string, dto: UpdateColumnDto) {
    const updated = await this.prisma.column.update({
      where: { id },
      data: dto,
    });
    await this.broadcastBoardForColumn(id);
    return updated;
  }

  async removeColumn(id: string) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id },
      select: { boardId: true },
    });
    await this.prisma.column.delete({ where: { id } });
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    const fullBoard = await this.findBoard(column.boardId);
    this.agileGateway.broadcastBoardUpdate(board.workspaceId, fullBoard);
  }

  async moveColumnLeft(columnId: string) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id: columnId },
    });
    const columns = await this.prisma.column.findMany({
      where: { boardId: column.boardId },
      orderBy: { order: 'asc' },
    });
    const index = columns.findIndex((c) => c.id === columnId);
    if (index <= 0) return this.findBoard(column.boardId);
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
    await this.broadcastBoardForColumn(columnId);
    return this.findBoard(column.boardId);
  }

  async moveColumnRight(columnId: string) {
    const column = await this.prisma.column.findUniqueOrThrow({
      where: { id: columnId },
    });
    const columns = await this.prisma.column.findMany({
      where: { boardId: column.boardId },
      orderBy: { order: 'asc' },
    });
    const index = columns.findIndex((c) => c.id === columnId);
    if (index < 0 || index >= columns.length - 1) return this.findBoard(column.boardId);
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
    await this.broadcastBoardForColumn(columnId);
    return this.findBoard(column.boardId);
  }

  private async broadcastBoardForColumn(columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });
    if (!column) return;
    const board = await this.prisma.board.findUniqueOrThrow({
      where: { id: column.boardId },
      select: { workspaceId: true },
    });
    const fullBoard = await this.findBoard(column.boardId);
    this.agileGateway.broadcastBoardUpdate(board.workspaceId, fullBoard);
  }

  async createCard(dto: CreateCardDto) {
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
      await this.broadcastBoardForColumn(columnId);
      return card;
    }

    if (!workspaceId) {
      throw new Error('workspaceId é obrigatório para criar card no backlog');
    }

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

  async updateCard(id: string, dto: UpdateCardDto) {
    const { assigneeIds, labels, startDate, dueDate, ...rest } = dto;
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
      await this.broadcastBoardForColumn(updated.columnId);
    } else {
      this.agileGateway.broadcastBacklogUpdate(updated.workspaceId);
    }
    return updated;
  }

  async removeCard(id: string) {
    const card = await this.prisma.card.findUniqueOrThrow({
      where: { id },
      select: { columnId: true, workspaceId: true },
    });
    await this.prisma.card.delete({
      where: { id },
    });
    if (card.columnId) {
      await this.broadcastBoardForColumn(card.columnId);
    } else {
      this.agileGateway.broadcastBacklogUpdate(card.workspaceId);
    }
  }

  async moveCard(cardId: string, dto: MoveCardDto) {
    const card = await this.prisma.card.findUniqueOrThrow({
      where: { id: cardId },
      include: { column: true, workspace: true },
    });

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
        await this.broadcastBoardForColumn(card.columnId);
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
        await this.broadcastBoardForColumn(card.columnId);
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
    const fullBoard = await this.findBoard(column.boardId);
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
