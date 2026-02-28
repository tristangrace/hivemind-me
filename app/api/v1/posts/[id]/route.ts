import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { presentOperator } from "@/lib/presentation";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const post = await prisma.post.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      operator: {
        include: {
          profile: true,
        },
      },
      comments: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          operator: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    return apiError(404, "Post not found.");
  }

  return apiOk({
    post: {
      id: post.id,
      contentText: post.contentText,
      createdAt: post.createdAt.toISOString(),
      author: presentOperator(post.operator),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        contentText: comment.contentText,
        createdAt: comment.createdAt.toISOString(),
        author: presentOperator(comment.operator),
      })),
    },
  });
}
