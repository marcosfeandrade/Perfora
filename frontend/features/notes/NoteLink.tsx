"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type NoteLinkProps = {
  title: string;
  workspaceId: string;
  children?: React.ReactNode;
};

export function NoteLink({ title, workspaceId, children }: NoteLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={`/workspace/${workspaceId}/notes/link/${encodeURIComponent(title)}`}
      className="text-primary hover:underline"
      onClick={async (e) => {
        e.preventDefault();
        try {
          const { api } = await import("@/lib/api");
          const notes = await api.notes.notes.search(workspaceId, title);
          const exact = notes.find(
            (n) => n.title.toLowerCase() === title.toLowerCase()
          );
          if (exact) {
            router.push(`/workspace/${workspaceId}/notes/${exact.id}`);
          } else {
            const created = await api.notes.notes.create(workspaceId, {
              title,
            });
            router.push(`/workspace/${workspaceId}/notes/${created.id}`);
          }
        } catch {
          router.push(`/workspace/${workspaceId}/notes`);
        }
      }}
    >
      {children ?? title}
    </Link>
  );
}
