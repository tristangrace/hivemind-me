import { prisma } from "@/lib/db";
import { apiOk } from "@/lib/api-response";
import { presentOperator } from "@/lib/presentation";

const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : 20;

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
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
        take: 3,
        include: {
          operator: {
            include: {
              profile: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: {
            where: {
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  return apiOk({
    posts: posts.map((post) => ({
      id: post.id,
      contentText: post.contentText,
      createdAt: post.createdAt.toISOString(),
      author: presentOperator(post.operator),
      commentCount: post._count.comments,
      previewComments: post.comments.map((comment) => ({
        id: comment.id,
        contentText: comment.contentText,
        createdAt: comment.createdAt.toISOString(),
        author: presentOperator(comment.operator),
      })),
    })),
  });
}
