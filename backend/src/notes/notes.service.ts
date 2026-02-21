import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { UpdateFolderDto } from './dto/update-folder.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { MoveNoteDto } from './dto/move-note.dto.js';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFolders(workspaceId: string) {
    return this.prisma.noteFolder.findMany({
      where: { workspaceId },
      include: {
        children: {
          orderBy: { order: 'asc' },
          include: {
            children: { orderBy: { order: 'asc' } },
            notes: { orderBy: { order: 'asc' } },
          },
        },
        notes: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });
  }

  async getFolderTree(workspaceId: string) {
    return this.prisma.noteFolder.findMany({
      where: { workspaceId, parentId: null },
      include: {
        children: {
          orderBy: { order: 'asc' },
          include: {
            children: { orderBy: { order: 'asc' } },
            notes: { orderBy: [{ isPinned: 'desc' }, { order: 'asc' }] },
          },
        },
        notes: { orderBy: [{ isPinned: 'desc' }, { order: 'asc' }] },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createFolder(dto: CreateFolderDto) {
    const workspaceId = dto.workspaceId!;
    const maxOrder = await this.prisma.noteFolder
      .aggregate({
        where: { workspaceId, parentId: dto.parentId ?? null },
        _max: { order: true },
      })
      .then((r) => (r._max.order ?? -1) + 1);
    return this.prisma.noteFolder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        workspaceId,
        order: dto.order ?? maxOrder,
      },
    });
  }

  async updateFolder(id: string, dto: UpdateFolderDto) {
    return this.prisma.noteFolder.update({
      where: { id },
      data: dto,
    });
  }

  async deleteFolder(id: string) {
    return this.prisma.noteFolder.delete({
      where: { id },
    });
  }

  async getNotes(workspaceId: string) {
    return this.prisma.note.findMany({
      where: { workspaceId },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async getNote(id: string) {
    return this.prisma.note.findUniqueOrThrow({
      where: { id },
    });
  }

  async searchNotes(workspaceId: string, query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getNotes(workspaceId);
    return this.prisma.note.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createNote(dto: CreateNoteDto) {
    const workspaceId = dto.workspaceId!;
    const folderId = dto.folderId ?? null;
    const maxOrder = await this.prisma.note
      .aggregate({
        where: { workspaceId, folderId },
        _max: { order: true },
      })
      .then((r) => (r._max.order ?? -1) + 1);
    return this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content ?? '',
        folderId,
        workspaceId,
        order: dto.order ?? maxOrder,
      },
    });
  }

  async updateNote(id: string, dto: UpdateNoteDto) {
    return this.prisma.note.update({
      where: { id },
      data: dto,
    });
  }

  async moveNote(id: string, dto: MoveNoteDto) {
    return this.prisma.note.update({
      where: { id },
      data: { folderId: dto.folderId ?? null, order: dto.order },
    });
  }

  async deleteNote(id: string) {
    return this.prisma.note.delete({
      where: { id },
    });
  }

  async getBacklinks(noteId: string) {
    const note = await this.prisma.note.findUniqueOrThrow({
      where: { id: noteId },
      select: { title: true, workspaceId: true },
    });
    const allNotes = await this.prisma.note.findMany({
      where: {
        workspaceId: note.workspaceId,
        id: { not: noteId },
        content: { contains: `[[${note.title}]]`, mode: 'insensitive' },
      },
      select: { id: true, title: true },
    });
    return allNotes;
  }
}
