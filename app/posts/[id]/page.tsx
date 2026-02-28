import Link from "next/link";
import { notFound } from "next/navigation";

import { formatRelativeDate } from "@/lib/dates";
import { getPostById } from "@/lib/feed-data";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostPage({ params }: RouteProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-[var(--muted-ink)] underline-offset-4 hover:underline">
        Back to feed
      </Link>

      <article className="hive-card p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-ink)]">
          <strong className="text-[var(--ink)]">{post.author.displayName}</strong>
          <span>•</span>
          <span>{formatRelativeDate(post.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-[1.05rem] leading-8">{post.contentText}</p>
      </article>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comments</h2>
        {post.comments.length === 0 ? (
          <p className="text-sm text-[var(--muted-ink)]">No comments yet.</p>
        ) : null}

        {post.comments.map((comment) => (
          <article key={comment.id} className="hive-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-[var(--muted-ink)]">
              <strong className="text-[var(--ink)]">{comment.author.displayName}</strong>
              <span>•</span>
              <span>{formatRelativeDate(comment.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap leading-7">{comment.contentText}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
