import { PlannerTabs } from "@/components/planner/PlannerTabs";

export default async function PlannerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PlannerTabs workspaceId={id} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
