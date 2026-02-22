import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceService } from './workspace.service.js';
import { WorkspaceMemberService } from './workspace-member.service.js';
import { WorkspaceMemberGuard } from './workspace-member.guard.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceMemberService, WorkspaceMemberGuard],
  exports: [WorkspaceService, WorkspaceMemberGuard],
})
export class WorkspaceModule {}
