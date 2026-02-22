"use client";

import { useParams } from "next/navigation";
import { BacklogViewWrapper } from "@/features/agile/BacklogViewWrapper";

export default function BacklogPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  return <BacklogViewWrapper workspaceId={workspaceId} />;
}
