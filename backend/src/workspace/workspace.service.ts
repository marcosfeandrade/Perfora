import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { WORKSPACE_ROLE } from './workspace-role.enum.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: createWorkspaceDto.name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: WORKSPACE_ROLE.OWNER,
          },
        },
      },
      include: { members: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado');
    }

    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      throw new ForbiddenException('Você não tem acesso a este workspace');
    }

    return workspace;
  }

  async update(id: string, userId: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    await this.assertMember(id, userId);
    const data: Prisma.WorkspaceUpdateInput = {};
    if (updateWorkspaceDto.name !== undefined) data.name = updateWorkspaceDto.name;
    if (updateWorkspaceDto.plannerTaskPrefix !== undefined)
      data.plannerTaskPrefix = updateWorkspaceDto.plannerTaskPrefix;
    if (updateWorkspaceDto.notesSettings !== undefined)
      data.notesSettings = updateWorkspaceDto.notesSettings as Prisma.InputJsonValue;
    return this.prisma.workspace.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });
    if (!member || member.role !== WORKSPACE_ROLE.OWNER) {
      throw new ForbiddenException('Apenas o dono pode excluir o workspace');
    }
    return this.prisma.workspace.delete({
      where: { id },
    });
  }

  async assertMember(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado');
    }
    const isMember =
      workspace.ownerId === userId ||
      (await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      }));
    if (!isMember) {
      throw new ForbiddenException('Você não tem acesso a este workspace');
    }
  }

  async assertOwnerOrAdmin(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado');
    }
    if (workspace.ownerId === userId) return;
    if (member?.role === WORKSPACE_ROLE.ADMIN) return;
    throw new ForbiddenException('Apenas dono ou admin podem realizar esta ação');
  }

  async assertOwner(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado');
    }
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Apenas o dono pode realizar esta ação');
    }
  }
}
