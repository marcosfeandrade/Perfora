import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { WorkspaceService } from '../workspace/workspace.service.js';
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
    private readonly workspaceService: WorkspaceService,
    private readonly notesGateway: NotesGateway,
  ) {}

  async getFolders(workspaceId: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
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

  async getFolderTree(workspaceId: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
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

  async createFolder(userId: string, dto: CreateFolderDto) {
    const workspaceId = dto.workspaceId!;
    await this.workspaceService.assertMember(workspaceId, userId);
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

  async updateFolder(id: string, userId: string, dto: UpdateFolderDto) {
    const existing = await this.prisma.noteFolder.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(existing.workspaceId, userId);
    const folder = await this.prisma.noteFolder.update({
      where: { id },
      data: dto,
    });
    this.notesGateway.broadcastNotesStructureUpdate(folder.workspaceId);
    return folder;
  }

  async moveFolder(id: string, userId: string, dto: MoveFolderDto) {
    const folder = await this.prisma.noteFolder.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(folder.workspaceId, userId);
    if (dto.parentId === id) return this.getFolderById(id);
    if (dto.parentId) {
      const wouldCreateCycle = await this.isDescendant(dto.parentId, id);
      if (wouldCreateCycle) throw new Error('Cannot move folder into its own descendant');
    }
    const folderWithParent = await this.prisma.noteFolder.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true, parentId: true },
    });
    const parentId = dto.parentId ?? null;
    const maxOrder = await this.prisma.noteFolder
      .aggregate({
        where: { workspaceId: folderWithParent.workspaceId, parentId },
        _max: { order: true },
      })
      .then((r) => (r._max.order ?? -1) + 1);
    const order = dto.order ?? maxOrder;
    const updated = await this.prisma.noteFolder.update({
      where: { id },
      data: { parentId, order },
    });
    this.notesGateway.broadcastNotesStructureUpdate(folderWithParent.workspaceId);
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

  async deleteFolder(id: string, userId: string) {
    const folder = await this.prisma.noteFolder.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(folder.workspaceId, userId);
    await this.prisma.noteFolder.delete({ where: { id } });
    this.notesGateway.broadcastNotesStructureUpdate(folder.workspaceId);
  }

  async getNotes(workspaceId: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
    return this.prisma.note.findMany({
      where: { workspaceId },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async getNote(id: string, userId: string) {
    const note = await this.prisma.note.findUniqueOrThrow({
      where: { id },
    });
    await this.workspaceService.assertMember(note.workspaceId, userId);
    return note;
  }

  async searchNotes(workspaceId: string, query: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
    const q = query.trim().toLowerCase();
    if (!q) return this.getNotes(workspaceId, userId);
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

  async createNote(userId: string, dto: CreateNoteDto) {
    const workspaceId = dto.workspaceId!;
    await this.workspaceService.assertMember(workspaceId, userId);
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

  async updateNote(id: string, userId: string, dto: UpdateNoteDto) {
    const existing = await this.prisma.note.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(existing.workspaceId, userId);
    const note = await this.prisma.note.update({
      where: { id },
      data: dto,
    });
    this.notesGateway.broadcastNoteUpdate(note.workspaceId, note);
    this.notesGateway.broadcastNotesStructureUpdate(note.workspaceId);
    return note;
  }

  async moveNote(id: string, userId: string, dto: MoveNoteDto) {
    const existing = await this.prisma.note.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(existing.workspaceId, userId);
    const note = await this.prisma.note.update({
      where: { id },
      data: { folderId: dto.folderId ?? null, order: dto.order },
    });
    this.notesGateway.broadcastNoteUpdate(note.workspaceId, note);
    this.notesGateway.broadcastNotesStructureUpdate(note.workspaceId);
    return note;
  }

  async deleteNote(id: string, userId: string) {
    const note = await this.prisma.note.findUniqueOrThrow({
      where: { id },
      select: { workspaceId: true },
    });
    await this.workspaceService.assertMember(note.workspaceId, userId);
    await this.prisma.note.delete({ where: { id } });
    this.notesGateway.broadcastNotesStructureUpdate(note.workspaceId);
  }

  async getBacklinks(noteId: string, userId: string) {
    const note = await this.prisma.note.findUniqueOrThrow({
      where: { id: noteId },
      select: { title: true, workspaceId: true },
    });
    await this.workspaceService.assertMember(note.workspaceId, userId);
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
