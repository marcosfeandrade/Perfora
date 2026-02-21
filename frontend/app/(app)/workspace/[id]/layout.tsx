import { WorkspaceLayoutClient } from "@/components/workspace/WorkspaceLayoutClient";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WorkspaceLayoutClient workspaceId={id}>{children}</WorkspaceLayoutClient>;
}
