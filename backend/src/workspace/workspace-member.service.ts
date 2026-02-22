import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { WORKSPACE_ROLE } from './workspace-role.enum.js';
import { WorkspaceService } from './workspace.service.js';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async listMembers(workspaceId: string, userId: string) {
    await this.workspaceService.assertMember(workspaceId, userId);
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(workspaceId: string, userId: string, email: string) {
    await this.workspaceService.assertOwnerOrAdmin(workspaceId, userId);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      throw new BadRequestException('Usuário com este email não encontrado');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUser.id },
      },
    });

    if (existing) {
      throw new BadRequestException('Usuário já é membro deste workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: WORKSPACE_ROLE.MEMBER,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async removeMember(
    workspaceId: string,
    userId: string,
    memberUserId: string,
  ) {
    const actorMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado');
    }

    const isOwner = workspace.ownerId === userId;
    const isAdmin = actorMember?.role === WORKSPACE_ROLE.ADMIN;

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Membro não encontrado');
    }

    if (memberUserId === userId) {
      throw new BadRequestException('Use a opção de sair do workspace');
    }

    if (targetMember.role === WORKSPACE_ROLE.OWNER) {
      throw new ForbiddenException('Não é possível remover o dono do workspace');
    }

    const canRemove =
      isOwner || (isAdmin && targetMember.role === WORKSPACE_ROLE.MEMBER);
    if (!canRemove) {
      throw new ForbiddenException('Você não tem permissão para remover este membro');
    }

    return this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: memberUserId } },
    });
  }
}
