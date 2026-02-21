import { redirect } from "next/navigation";

type PlannerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlannerPage({ params }: PlannerPageProps) {
  const { id } = await params;
  redirect(`/workspace/${id}/planner/board`);
}
