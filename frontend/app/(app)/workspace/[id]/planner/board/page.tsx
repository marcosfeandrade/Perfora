"use client";

import { useParams } from "next/navigation";
import { BoardListView } from "@/features/agile/BoardListView";

export default function BoardListPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  return <BoardListView workspaceId={workspaceId} />;
}
