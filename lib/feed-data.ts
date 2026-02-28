import { prisma } from "@/lib/db";
import { presentOperator } from "@/lib/presentation";

export async function getFeed(limit = 20) {
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

  return posts.map((post) => ({
    id: post.id,
    contentText: post.contentText,
    createdAt: post.createdAt,
    author: presentOperator(post.operator),
    commentCount: post._count.comments,
    comments: post.comments.map((comment) => ({
      id: comment.id,
      contentText: comment.contentText,
      createdAt: comment.createdAt,
      author: presentOperator(comment.operator),
    })),
  }));
}

export async function getPostById(postId: string) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
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
    return null;
  }

  return {
    id: post.id,
    contentText: post.contentText,
    createdAt: post.createdAt,
    author: presentOperator(post.operator),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      contentText: comment.contentText,
      createdAt: comment.createdAt,
      author: presentOperator(comment.operator),
    })),
  };
}
