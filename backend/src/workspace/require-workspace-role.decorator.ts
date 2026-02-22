import { SetMetadata } from '@nestjs/common';
import type { WorkspaceRole } from './workspace-role.enum.js';
import { REQUIRED_ROLES_KEY } from './workspace-member.guard.js';

export const RequireWorkspaceRole = (...roles: WorkspaceRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
