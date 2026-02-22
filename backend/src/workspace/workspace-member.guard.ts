import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../core/prisma/prisma.service.js';
import type { WorkspaceRole } from './workspace-role.enum.js';

export const WORKSPACE_MEMBER_KEY = 'workspaceMember';
export const REQUIRED_ROLES_KEY = 'requiredRoles';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const workspaceId =
      request.params.id ?? request.params.workspaceId ?? request.params.workspace_id;
    if (!workspaceId) {
      throw new ForbiddenException('Workspace não identificado');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
      include: { workspace: true },
    });

    if (!member) {
      throw new ForbiddenException('Você não tem acesso a este workspace');
    }

    request[WORKSPACE_MEMBER_KEY] = member;

    const requiredRoles = this.reflector.get<WorkspaceRole[]>(
      REQUIRED_ROLES_KEY,
      context.getHandler(),
    );
    if (requiredRoles?.length && !requiredRoles.includes(member.role as WorkspaceRole)) {
      throw new ForbiddenException('Permissão insuficiente para esta ação');
    }

    return true;
  }
}
