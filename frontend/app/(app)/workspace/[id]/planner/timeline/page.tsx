import { TimelineView } from "@/features/agile/timeline/TimelineView";

type TimelinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id: workspaceId } = await params;

  return (
    <div className="flex flex-col flex-1 min-h-0 p-4">
      <TimelineView workspaceId={workspaceId} />
    </div>
  );
}
