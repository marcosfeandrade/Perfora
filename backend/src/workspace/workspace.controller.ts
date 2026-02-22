import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service.js';
import { WorkspaceMemberService } from './workspace-member.service.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/user.decorator.js';
import { WorkspaceMemberGuard } from './workspace-member.guard.js';
import { RequireWorkspaceRole } from './require-workspace-role.decorator.js';
import { WORKSPACE_ROLE } from './workspace-role.enum.js';

type AuthUser = { id: string; email: string; name: string | null };

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceMemberService: WorkspaceMemberService,
  ) {}

  @Post()
  create(@User() user: AuthUser, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspaceService.create(user.id, createWorkspaceDto);
  }

  @Get()
  findAll(@User() user: AuthUser) {
    return this.workspaceService.findAll(user.id);
  }

  @Get(':id/members')
  @UseGuards(WorkspaceMemberGuard)
  listMembers(@Param('id') workspaceId: string, @User() user: AuthUser) {
    return this.workspaceMemberService.listMembers(workspaceId, user.id);
  }

  @Post(':id/members')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspaceRole(WORKSPACE_ROLE.OWNER, WORKSPACE_ROLE.ADMIN)
  addMember(
    @Param('id') workspaceId: string,
    @User() user: AuthUser,
    @Body() dto: AddMemberDto,
  ) {
    return this.workspaceMemberService.addMember(
      workspaceId,
      user.id,
      dto.email,
    );
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceMemberGuard)
  removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') memberUserId: string,
    @User() user: AuthUser,
  ) {
    return this.workspaceMemberService.removeMember(
      workspaceId,
      user.id,
      memberUserId,
    );
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  findOne(@Param('id') id: string, @User() user: AuthUser) {
    return this.workspaceService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard)
  update(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(id, user.id, updateWorkspaceDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceMemberGuard)
  @RequireWorkspaceRole(WORKSPACE_ROLE.OWNER)
  remove(@Param('id') id: string, @User() user: AuthUser) {
    return this.workspaceService.remove(id, user.id);
  }
}
