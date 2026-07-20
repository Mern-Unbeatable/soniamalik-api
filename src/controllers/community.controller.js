import * as communityService from "../services/community.service.js";
import { catchAsync } from "../shared/catch-async.js";
import { sendSuccess, sendError } from "../utils/response.js";

// ==================== POSTS ====================

export const createPost = catchAsync(async (req, res) => {
  const postData = { ...req.body, authorId: req.user.id };
  const post = await communityService.createPost(postData);
  return sendSuccess(res, 201, "Post created successfully", post);
});

export const getPosts = catchAsync(async (req, res) => {
  const { category, sport, tags, page, limit, search } = req.query;
  const result = await communityService.getPosts({
    category,
    sport,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    page,
    limit,
    search,
  });
  return sendSuccess(res, 200, "Posts retrieved successfully", result);
});

export const getPostById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const post = await communityService.getPostById(id, userId);
  return sendSuccess(res, 200, "Post retrieved successfully", post);
});

export const updatePost = catchAsync(async (req, res) => {
  const post = await communityService.updatePost(req.params.id, req.body, req.user.id);
  return sendSuccess(res, 200, "Post updated successfully", post);
});

export const deletePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await communityService.deletePost(id, req.user.id, req.user.role);
  return sendSuccess(res, 200, result.message, null);
});

export const getUserPosts = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const result = await communityService.getUserPosts(userId, page, limit);
  return sendSuccess(res, 200, "User posts retrieved successfully", result);
});

export const getMyPostsActivity = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await communityService.getMyPostsActivity(req.user.id, page, limit);
  return sendSuccess(res, 200, "Post activity retrieved successfully", result);
});

// ==================== REACTIONS ====================

export const addReaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  const validTypes = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

  if (!type || !validTypes.includes(type)) {
    return sendError(res, 400, "Invalid reaction type");
  }

  const result = await communityService.addReaction(id, req.user.id, type);
  return sendSuccess(res, 200, result.message, {
    reacted: result.reacted,
    type: result.type,
    likesCount: result.likesCount
  });
});

export const getReactionSummary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const summary = await communityService.getPostReactions(id);
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  return sendSuccess(res, 200, "Reaction summary retrieved", { total, breakdown: summary });
});

export const getPostReactions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;
  const reactions = await communityService.getPostReactionsDetailed(id, type);
  return sendSuccess(res, 200, "Reactions retrieved successfully", reactions);
});

export const getMyReaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const reaction = await communityService.getUserReaction(id, req.user.id);
  return sendSuccess(res, 200, "User reaction retrieved", { reaction });
});

// Legacy like endpoints (maintained for backward compatibility)
export const toggleLike = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await communityService.addReaction(id, req.user.id, 'LIKE');
  return sendSuccess(res, 200, result.message, {
    liked: result.reacted,
    likesCount: result.likesCount
  });
});

export const getPostLikes = catchAsync(async (req, res) => {
  const { id } = req.params;
  const likes = await communityService.getPostLikes(id);
  return sendSuccess(res, 200, "Post likes retrieved successfully", likes);
});

// ==================== COMMENTS ====================

export const createComment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content, parentId } = req.body;

  if (!content?.trim()) {
    return sendError(res, 400, "Comment content is required");
  }

  const comment = await communityService.createComment({
    postId: id,
    content,
    authorId: req.user.id,
    parentId,
  });
  return sendSuccess(res, 201, "Comment created successfully", comment);
});

export const getPostComments = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const result = await communityService.getPostComments(id, page, limit);
  return sendSuccess(res, 200, "Comments retrieved successfully", result);
});

export const updateComment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return sendError(res, 400, "Comment content is required");
  }

  const comment = await communityService.updateComment(id, content, req.user.id);
  return sendSuccess(res, 200, "Comment updated successfully", comment);
});

export const deleteComment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await communityService.deleteComment(id, req.user.id, req.user.role);
  return sendSuccess(res, 200, result.message, null);
});

// ==================== REPLIES ====================

export const getCommentReplies = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const { page, limit } = req.query;
  const result = await communityService.getCommentReplies(commentId, page, limit);
  return sendSuccess(res, 200, "Replies retrieved successfully", result);
});

export const getReplyById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const reply = await communityService.getReplyById(id);
  return sendSuccess(res, 200, "Reply retrieved successfully", reply);
});

export const createReply = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return sendError(res, 400, "Reply content is required");
  }

  const reply = await communityService.createReply({
    commentId,
    content,
    authorId: req.user.id,
  });
  return sendSuccess(res, 201, "Reply created successfully", reply);
});

export const updateReply = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return sendError(res, 400, "Reply content is required");
  }

  const reply = await communityService.updateReply(id, content, req.user.id);
  return sendSuccess(res, 200, "Reply updated successfully", reply);
});

export const deleteReply = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await communityService.deleteReply(id, req.user.id, req.user.role);
  return sendSuccess(res, 200, result.message, null);
});

export const getMyReplies = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await communityService.getUserReplies(req.user.id, page, limit);
  return sendSuccess(res, 200, "Your replies retrieved successfully", result);
});

// Get all comments on user's posts
export const getCommentsOnMyPosts = catchAsync(async (req, res) => {
  const { page, limit, includeReplies } = req.query;
  const result = await communityService.getCommentsOnMyPosts(req.user.id, {
    page,
    limit,
    includeReplies: includeReplies === 'true',
  });
  return sendSuccess(res, 200, "Comments on your posts retrieved successfully", result);
});

// Get all replies on user's comments
export const getRepliesOnMyComments = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await communityService.getRepliesOnMyComments(req.user.id, {
    page,
    limit,
  });
  return sendSuccess(res, 200, "Replies on your comments retrieved successfully", result);
});

// Get combined activity feed
export const getUserContentInteractions = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await communityService.getUserContentInteractions(req.user.id, {
    page,
    limit,
  });
  return sendSuccess(res, 200, "Content interactions retrieved successfully", result);
});