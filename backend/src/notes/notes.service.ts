import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { NotesGateway } from './notes.gateway.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { UpdateFolderDto } from './dto/update-folder.dto.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { MoveNoteDto } from './dto/move-note.dto.js';
import { MoveFolderDto } from './dto/move-folder.dto.js';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notesGateway: NotesGateway,
  ) {}

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
    const folder = await this.prisma.noteFolder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        workspaceId,
        order: dto.order ?? maxOrder,
      },
    });
    this.notesGateway.broadcastNotesStructureUpdate(workspaceId);
    return folder;
  }

  async updateFolder(id: string, dto: UpdateFolderDto) {
    const folder = await this.prisma.noteFolder.update({
      where: { id },
      data: dto,
    });
    this.notesGateway.broadcastNotesStructureUpdate(folder.workspaceId);
    return folder;
  }

  async moveFolder(id: string, dto: MoveFolderDto) {
    if (dto.parentId === id) return this.getFolderById(id);
    if (dto.parentId) {
      const wouldCreateCycle = await this.isDescendant(dto.parentId, id);
      if (wouldCreateCycle) throw new Error('Cannot move folder into its own descendant');
    }
    const folder = await this.prisma.noteFolder.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true, parentId: true },
    });
    const parentId = dto.parentId ?? null;
    const maxOrder = await this.prisma.noteFolder
      .aggregate({
        where: { workspaceId: folder.workspaceId, parentId },
        _max: { order: true },
      })
      .then((r) => (r._max.order ?? -1) + 1);
    const order = dto.order ?? maxOrder;
    const updated = await this.prisma.noteFolder.update({
      where: { id },
      data: { parentId, order },
    });
    this.notesGateway.broadcastNotesStructureUpdate(updated.workspaceId);
    return updated;
  }

  private async getFolderById(id: string) {
    return this.prisma.noteFolder.findUniqueOrThrow({ where: { id } });
  }

  private async isDescendant(folderId: string, potentialAncestorId: string): Promise<boolean> {
    let current: string | null = folderId;
    while (current) {
      const folder = await this.prisma.noteFolder.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      if (!folder) return false;
      if (folder.parentId === potentialAncestorId) return true;
      current = folder.parentId;
    }
    return false;
  }

  async deleteFolder(id: string) {
    const folder = await this.prisma.noteFolder.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.prisma.noteFolder.delete({ where: { id } });
    this.notesGateway.broadcastNotesStructureUpdate(folder.workspaceId);
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
    const note = await this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content ?? '',
        folderId,
        workspaceId,
        order: dto.order ?? maxOrder,
      },
    });
    this.notesGateway.broadcastNoteUpdate(workspaceId, note);
    this.notesGateway.broadcastNotesStructureUpdate(workspaceId);
    return note;
  }

  async updateNote(id: string, dto: UpdateNoteDto) {
    const note = await this.prisma.note.update({
      where: { id },
      data: dto,
    });
    this.notesGateway.broadcastNoteUpdate(note.workspaceId, note);
    return note;
  }

  async moveNote(id: string, dto: MoveNoteDto) {
    const note = await this.prisma.note.update({
      where: { id },
      data: { folderId: dto.folderId ?? null, order: dto.order },
    });
    this.notesGateway.broadcastNoteUpdate(note.workspaceId, note);
    this.notesGateway.broadcastNotesStructureUpdate(note.workspaceId);
    return note;
  }

  async deleteNote(id: string) {
    const note = await this.prisma.note.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.prisma.note.delete({ where: { id } });
    this.notesGateway.broadcastNotesStructureUpdate(note.workspaceId);
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
