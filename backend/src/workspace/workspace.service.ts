import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../core/prisma/prisma.service.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  create(createWorkspaceDto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: createWorkspaceDto,
    });
  }

  findAll() {
    return this.prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.workspace.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
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

  remove(id: string) {
    return this.prisma.workspace.delete({
      where: { id },
    });
  }
}
