
import prisma from "../config/database.js";
import * as notificationService from "./notification.service.js";


export async function createPost(postData) {
  const {
    title,
    description,
    category,
    sport,
    tags,
    location,
    date,
    time,
    helpType,
    authorId,
  } = postData;

  const post = await prisma.communityPost.create({
    data: {
      title,
      description,
      category,
      sport: sport || null,
      tags: tags || [],
      location: location || null,
      date: date || null,
      time: time || null,
      helpType: helpType || null,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          displayName: true,
          role: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return post;
}
export async function getPosts(filters = {}) {
  const { category, sport, tags, page = 1, limit = 10, search } = filters;
  const skip = (page - 1) * limit;
  const where = {};

  if (category) where.category = category;
  if (sport) where.sport = sport;
  if (tags?.length) where.tags = { hasSome: Array.isArray(tags) ? tags : [tags] };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        comments: {
          take: 3, // Limit comments for preview
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                displayName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        likes: {
          select: {
            type: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
      },
    }),
    prisma.communityPost.count({ where }),
  ]);

  // Transform posts to include reaction breakdown
  const postsWithReactions = posts.map(post => {
    const reactionBreakdown = {
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0
    };

    // Count each reaction type
    post.likes.forEach(like => {
      reactionBreakdown[like.type] = (reactionBreakdown[like.type] || 0) + 1;
    });

    // Remove likes array from response
    const { likes, ...postWithoutLikes } = post;

    return {
      ...postWithoutLikes,
      reactionBreakdown,
      totalReactions: post._count.likes,
      totalComments: post._count.comments,
    };
  });

  return {
    posts: postsWithReactions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPostById(postId, userId = null) {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          displayName: true,
          role: true,
        },
      },
      likes: {
        select: {
          userId: true,
          type: true
        },
      },
      comments: {
        where: { parentId: null }, // Only top-level comments
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              displayName: true,
              role: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  displayName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { replies: true }
          }
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      },
    },
  });

  if (!post) throw new Error("Post not found");

  // Add reaction breakdown
  const reactionBreakdown = {
    LIKE: 0,
    LOVE: 0,
    HAHA: 0,
    WOW: 0,
    SAD: 0,
    ANGRY: 0
  };

  post.likes.forEach(like => {
    reactionBreakdown[like.type] = (reactionBreakdown[like.type] || 0) + 1;
  });

  // Prepare the response
  const response = {
    ...post,
    reactionBreakdown,
    totalReactions: post._count.likes,
    totalComments: post._count.comments,
    userReaction: null,
    isLikedByUser: false
  };

  // Check user's reaction if userId is provided
  if (userId) {
    const userReaction = post.likes.find(like => like.userId === userId);
    response.userReaction = userReaction?.type || null;
    response.isLikedByUser = !!userReaction;
  }

  // Remove likes array and _count from response
  delete response.likes;
  delete response._count;

  // Format comments to include reply counts
  if (response.comments) {
    response.comments = response.comments.map(comment => ({
      ...comment,
      replyCount: comment._count?.replies || 0,
      _count: undefined
    }));
  }

  return response;
}


export async function updatePost(postId, updateData, userId) {
  const existingPost = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!existingPost) throw new Error("Post not found");
  if (existingPost.authorId !== userId) throw new Error("Unauthorized: You can only update your own posts");

  const { title, description, sport, tags, location, date, time, helpType } = updateData;
  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (sport !== undefined) data.sport = sport;
  if (tags !== undefined) data.tags = tags;
  if (location !== undefined) data.location = location;
  if (date !== undefined) data.date = date;
  if (time !== undefined) data.time = time;
  if (helpType !== undefined) data.helpType = helpType;

  const post = await prisma.communityPost.update({
    where: { id: postId },
    data,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          displayName: true,
          role: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return post;
}

export async function deletePost(postId, userId, userRole) {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  await prisma.communityPost.delete({ where: { id: postId } });
  return { message: "Post deleted successfully" };
}

export async function getUserPosts(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where: { authorId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.communityPost.count({ where: { authorId: userId } }),
  ]);

  return {
    posts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMyPostsActivity(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      where: { authorId: userId },
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                displayName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        comments: {
          where: { authorId: { not: userId } },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                displayName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.communityPost.count({ where: { authorId: userId } }),
  ]);

  const postsWithActivity = posts.map((post) => ({
    ...post,
    hasNewActivity: post.likes.length > 0 || post.comments.length > 0,
    activityCount: post._count.likes + post._count.comments,
  }));

  return {
    posts: postsWithActivity,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ==================== REACTIONS ====================
export async function addReaction(postId, userId, type = 'LIKE') {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!post) throw new Error("Post not found");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  const existingReaction = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  let result;

  if (existingReaction) {
    if (existingReaction.type === type) {
      // Remove reaction
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existingReaction.id } }),
        prisma.communityPost.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      result = { reacted: false, type: null, message: "Reaction removed", likesCount: post.likesCount - 1 };
    } else {
      // Update reaction type
      await prisma.postLike.update({
        where: { id: existingReaction.id },
        data: { type },
      });
      result = { reacted: true, type, message: `Reaction updated to ${type.toLowerCase()}`, likesCount: post.likesCount };
    }
  } else {
    // Add new reaction
    await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId, type } }),
      prisma.communityPost.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
    ]);
    result = { reacted: true, type, message: `Post ${type.toLowerCase()}d`, likesCount: post.likesCount + 1 };
  }

  // 🔔 Send notification for new reaction (not for self)
  if (!existingReaction && post.authorId !== userId) {
    const reactionEmoji = { LIKE: "👍", LOVE: "❤️", HAHA: "😄", WOW: "😲", SAD: "😢", ANGRY: "😠" };

    await notificationService.createNotification(
      post.authorId,
      "POST_LIKE",
      `${reactionEmoji[type]} New Reaction`,
      `${user?.name || "Someone"} reacted with ${type.toLowerCase()} to your post "${post.title?.substring(0, 30)}..."`,
      {
        type: "POST",
        action: "view_post",
        actionUrl: `/community/posts/${postId}`,
        postId: postId,
        postTitle: post.title,
        likerName: user?.name,
        reactionType: type,
      }
    );
  }

  return result;
}

export async function getPostReactions(postId) {
  const reactions = await prisma.postLike.groupBy({
    by: ['type'],
    where: { postId },
    _count: { type: true },
  });

  const reactionCounts = {};
  reactions.forEach(reaction => {
    reactionCounts[reaction.type] = reaction._count.type;
  });
  return reactionCounts;
}

export async function getUserReaction(postId, userId) {
  const reaction = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { type: true },
  });
  return reaction?.type || null;
}

export async function getPostReactionsDetailed(postId, reactionType = null) {
  const where = { postId };
  if (reactionType) where.type = reactionType;

  const reactions = await prisma.postLike.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return reactions;
}

export async function getPostLikes(postId) {
  return getPostReactionsDetailed(postId, 'LIKE');
}

// ==================== COMMENTS ====================

export async function createComment(commentData) {
  const { postId, content, authorId, parentId = null } = commentData;

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!post) throw new Error("Post not found");

  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true, name: true },
  });

  if (parentId) {
    const parentComment = await prisma.postComment.findUnique({
      where: { id: parentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!parentComment) throw new Error("Parent comment not found");
    if (parentComment.postId !== postId) throw new Error("Parent comment does not belong to this post");
  }

  const [comment] = await prisma.$transaction([
    prisma.postComment.create({
      data: { content, postId, authorId, parentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
      },
    }),
    prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    }),
  ]);

  const shortContent = content.length > 50 ? content.substring(0, 50) + "..." : content;

  if (!parentId) {
    // 🔔 New comment on post - notify post author (if not self)
    if (post.authorId !== authorId) {
      await notificationService.createNotification(
        post.authorId,
        "POST_COMMENT",
        "💬 New Comment on Your Post",
        `${user?.name || "Someone"} commented: "${shortContent}"`,
        {
          type: "POST",
          action: "view_post",
          actionUrl: `/community/posts/${postId}`,
          postId: postId,
          postTitle: post.title,
          commentId: comment.id,
          commenterName: user?.name,
          comment: shortContent,
        }
      );
    }
  } else {
    // 🔔 Reply to a comment - notify parent comment author (if not self)
    const parentComment = await prisma.postComment.findUnique({
      where: { id: parentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (parentComment && parentComment.authorId !== authorId) {
      await notificationService.createNotification(
        parentComment.authorId,
        "POST_REPLY",
        "💬 New Reply to Your Comment",
        `${user?.name || "Someone"} replied: "${shortContent}"`,
        {
          type: "POST",
          action: "view_post",
          actionUrl: `/community/posts/${postId}`,
          postId: postId,
          postTitle: post.title,
          commentId: parentId,
          replyId: comment.id,
          replierName: user?.name,
          reply: shortContent,
        }
      );
    }
  }

  return comment;
}

export async function getPostComments(postId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { postId, parentId: null },
      skip,
      take: parseInt(limit),
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                displayName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postComment.count({ where: { postId, parentId: null } }),
  ]);

  // Format comments to include reply count
  const formattedComments = comments.map(comment => ({
    ...comment,
    replyCount: comment._count?.replies || 0,
    _count: undefined
  }));

  return {
    comments: formattedComments,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateComment(commentId, content, userId) {
  const existingComment = await prisma.postComment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) throw new Error("Comment not found");
  if (existingComment.authorId !== userId) throw new Error("Unauthorized: You can only update your own comments");

  const comment = await prisma.postComment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          displayName: true,
          role: true,
        },
      },
    },
  });
  return comment;
}

export async function deleteComment(commentId, userId, userRole) {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: { replies: true },
  });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  const totalCommentsToDelete = 1 + comment.replies.length;

  await prisma.$transaction([
    prisma.postComment.delete({ where: { id: commentId } }),
    prisma.communityPost.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: totalCommentsToDelete } },
    }),
  ]);

  return { message: "Comment deleted successfully" };
}

// ==================== REPLIES ====================

export async function getCommentReplies(commentId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const parentComment = await prisma.postComment.findUnique({
    where: { id: commentId },
  });
  if (!parentComment) throw new Error("Comment not found");

  const [replies, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { parentId: commentId },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
      },
    }),
    prisma.postComment.count({ where: { parentId: commentId } }),
  ]);

  return {
    replies,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getReplyById(replyId) {
  const reply = await prisma.postComment.findUnique({
    where: { id: replyId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          displayName: true,
          role: true,
        },
      },
      parent: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
      post: { select: { id: true, title: true } },
    },
  });

  if (!reply) throw new Error("Reply not found");
  if (!reply.parentId) throw new Error("This is not a reply comment");
  return reply;
}

export async function createReply(replyData) {
  const { commentId, content, authorId } = replyData;

  const parentComment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: {
      post: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!parentComment) throw new Error("Comment not found");
  if (!content?.trim()) throw new Error("Reply content is required");

  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true, name: true },
  });

  const [reply] = await prisma.$transaction([
    prisma.postComment.create({
      data: {
        content,
        postId: parentComment.postId,
        authorId,
        parentId: commentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    }),
    prisma.communityPost.update({
      where: { id: parentComment.postId },
      data: { commentsCount: { increment: 1 } },
    }),
  ]);

  const shortContent = content.length > 50 ? content.substring(0, 50) + "..." : content;

  //  Send notification to parent comment author (if not self)
  if (parentComment.authorId !== authorId) {
    await notificationService.createNotification(
      parentComment.authorId,
      "POST_REPLY",
      " New Reply to Your Comment",
      `${user?.name || "Someone"} replied: "${shortContent}"`,
      {
        type: "POST",
        action: "view_post",
        actionUrl: `/community/posts/${parentComment.postId}`,
        postId: parentComment.postId,
        postTitle: parentComment.post?.title,
        commentId: commentId,
        replyId: reply.id,
        replierName: user?.name,
        reply: shortContent,
      }
    );
  }

  return reply;
}

export async function updateReply(replyId, content, userId) {
  const existingReply = await prisma.postComment.findUnique({
    where: { id: replyId },
  });

  if (!existingReply) throw new Error("Reply not found");
  if (existingReply.authorId !== userId) throw new Error("Unauthorized: You can only update your own replies");
  if (!existingReply.parentId) throw new Error("This is not a reply comment");

  const reply = await prisma.postComment.update({
    where: { id: replyId },
    data: { content },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          displayName: true,
          role: true,
        },
      },
    },
  });
  return reply;
}

export async function deleteReply(replyId, userId, userRole) {
  const reply = await prisma.postComment.findUnique({
    where: { id: replyId },
  });

  if (!reply) throw new Error("Reply not found");
  if (!reply.parentId) throw new Error("This is not a reply comment");
  if (reply.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("Unauthorized: You can only delete your own replies");
  }

  await prisma.$transaction([
    prisma.postComment.delete({ where: { id: replyId } }),
    prisma.communityPost.update({
      where: { id: reply.postId },
      data: { commentsCount: { decrement: 1 } },
    }),
  ]);

  return { message: "Reply deleted successfully" };
}

export async function getUserReplies(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    prisma.postComment.findMany({
      where: { authorId: userId, parentId: { not: null } },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        post: { select: { id: true, title: true } },
      },
    }),
    prisma.postComment.count({
      where: { authorId: userId, parentId: { not: null } },
    }),
  ]);

  return {
    replies,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}





// Get all comments on user's posts (by others)
export async function getCommentsOnMyPosts(userId, filters = {}) {
  const { page = 1, limit = 20, includeReplies = true } = filters;
  const skip = (page - 1) * limit;

  // First, get all post IDs created by this user
  const userPosts = await prisma.communityPost.findMany({
    where: { authorId: userId },
    select: { id: true, title: true },
  });

  const postIds = userPosts.map(post => post.id);
  
  if (postIds.length === 0) {
    return {
      comments: [],
      pagination: {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0,
      },
    };
  }

  // Get comments on those posts (excluding user's own comments)
  const where = {
    postId: { in: postIds },
    authorId: { not: userId }, // Exclude user's own comments
    parentId: null, // Only top-level comments (not replies)
  };

  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
          },
        },
        replies: includeReplies ? {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                displayName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
          take: 5, // Limit replies per comment
        } : false,
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postComment.count({ where }),
  ]);

  // Format comments
  const formattedComments = comments.map(comment => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.author,
    post: {
      id: comment.post.id,
      title: comment.post.title,
    },
    replyCount: comment._count?.replies || 0,
    recentReplies: comment.replies || [],
    isRepliedByMe: false, // You can check if user replied to this comment
  }));

  return {
    comments: formattedComments,
    postsSummary: userPosts.map(post => ({
      id: post.id,
      title: post.title,
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get all replies on user's comments
export async function getRepliesOnMyComments(userId, filters = {}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  // Get all comments made by user
  const userComments = await prisma.postComment.findMany({
    where: { authorId: userId },
    select: { id: true },
  });

  const userCommentIds = userComments.map(comment => comment.id);

  if (userCommentIds.length === 0) {
    return {
      replies: [],
      pagination: {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0,
      },
    };
  }

  // Get replies on user's comments (excluding user's own replies)
  const where = {
    parentId: { in: userCommentIds },
    authorId: { not: userId },
  };

  const [replies, total] = await Promise.all([
    prisma.postComment.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postComment.count({ where }),
  ]);

  return {
    replies: replies.map(reply => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: reply.author,
      parentComment: {
        id: reply.parent.id,
        content: reply.parent.content,
        author: reply.parent.author,
      },
      post: reply.post,
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Combined activity feed - all interactions on user's content
export async function getUserContentInteractions(userId, filters = {}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  // Get user's posts
  const userPosts = await prisma.communityPost.findMany({
    where: { authorId: userId },
    select: { id: true },
  });

  const postIds = userPosts.map(post => post.id);

  // Get user's comments
  const userComments = await prisma.postComment.findMany({
    where: { authorId: userId },
    select: { id: true },
  });

  const userCommentIds = userComments.map(comment => comment.id);

  // Get all interactions (comments on posts + replies on comments)
  const [commentsOnPosts, repliesOnComments] = await Promise.all([
    prisma.postComment.findMany({
      where: {
        postId: { in: postIds },
        authorId: { not: userId },
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.postComment.findMany({
      where: {
        parentId: { in: userCommentIds },
        authorId: { not: userId },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            displayName: true,
            role: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Combine and sort all interactions
  let allInteractions = [
    ...commentsOnPosts.map(c => ({
      type: 'COMMENT',
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: c.author,
      post: c.post,
      replyCount: c._count?.replies || 0,
    })),
    ...repliesOnComments.map(r => ({
      type: 'REPLY',
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      author: r.author,
      post: r.post,
      parentComment: {
        id: r.parent.id,
        content: r.parent.content,
        author: r.parent.author,
      },
    })),
  ];

  // Sort by date
  allInteractions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allInteractions.length;
  const paginatedInteractions = allInteractions.slice(skip, skip + parseInt(limit));

  return {
    interactions: paginatedInteractions,
    summary: {
      totalComments: commentsOnPosts.length,
      totalReplies: repliesOnComments.length,
      totalInteractions: total,
    },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}