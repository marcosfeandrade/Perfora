export const WORKSPACE_ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLE)[keyof typeof WORKSPACE_ROLE];
