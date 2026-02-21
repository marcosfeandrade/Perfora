import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppShell } from "@/components/app/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
