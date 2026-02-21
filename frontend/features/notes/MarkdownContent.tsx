"use client";

import ReactMarkdown from "react-markdown";
import { NoteLink } from "./NoteLink";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  workspaceId: string;
  className?: string;
};

const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export function MarkdownContent({
  content,
  workspaceId,
  className,
}: MarkdownContentProps) {
  const processedContent = content.replace(LINK_PATTERN, (_, title) => {
    return `[${title}](/workspace/${workspaceId}/notes/link/${encodeURIComponent(title)})`;
  });

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words",
        "[&_p]:break-words [&_li]:break-words [&_td]:break-words [&_th]:break-words",
        "[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6",
        "[&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-sm",
        "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_a]:break-words",
        className
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const linkMatch = href?.match(/\/notes\/link\/(.+)$/);
            if (linkMatch) {
              const title = decodeURIComponent(linkMatch[1]);
              return (
                <NoteLink title={title} workspaceId={workspaceId}>
                  {children}
                </NoteLink>
              );
            }
            return <a href={href}>{children}</a>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
