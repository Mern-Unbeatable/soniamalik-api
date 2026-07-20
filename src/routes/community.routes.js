import express from "express";
import * as communityController from "../controllers/community.controller.js";
import { authenticate, optionalAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { createPostSchema, createReplySchema, updatePostSchema, updateReplySchema } from "../validators/community.validation.js";
import { validateZod } from "../middlewares/validateZod.js";

const router = express.Router();

// ==================== POST ROUTES ====================
router.post("/posts", authenticate, validateZod(createPostSchema), communityController.createPost);
router.get("/posts", asyncHandler(communityController.getPosts));
router.get("/posts/:id", optionalAuth, asyncHandler(communityController.getPostById));
router.put("/posts/:id", authenticate, validateZod(updatePostSchema), asyncHandler(communityController.updatePost));
router.delete("/posts/:id", authenticate, asyncHandler(communityController.deletePost));
router.get("/users/:userId/posts", asyncHandler(communityController.getUserPosts));
router.get("/my-posts/activity", authenticate, asyncHandler(communityController.getMyPostsActivity));

// ==================== REACTION ROUTES ====================
// New reaction endpoints
router.post("/posts/:id/reactions", authenticate, asyncHandler(communityController.addReaction));
router.get("/posts/:id/reactions/summary", asyncHandler(communityController.getReactionSummary));
router.get("/posts/:id/reactions", asyncHandler(communityController.getPostReactions));
router.get("/posts/:id/my-reaction", authenticate, asyncHandler(communityController.getMyReaction));

// Legacy like endpoints (backward compatible)
router.post("/posts/:id/like", authenticate, asyncHandler(communityController.toggleLike));
router.get("/posts/:id/likes", asyncHandler(communityController.getPostLikes));

// ==================== COMMENT ROUTES ====================
router.post("/posts/:id/comments", authenticate, asyncHandler(communityController.createComment));
router.get("/posts/:id/comments", asyncHandler(communityController.getPostComments));
router.put("/comments/:id", authenticate, asyncHandler(communityController.updateComment));
router.delete("/comments/:id", authenticate, asyncHandler(communityController.deleteComment));

// ==================== REPLY ROUTES ====================
router.get("/comments/:commentId/replies", asyncHandler(communityController.getCommentReplies));
router.get("/replies/:id", optionalAuth, asyncHandler(communityController.getReplyById));
router.post("/comments/:commentId/replies", authenticate, validateZod(createReplySchema), asyncHandler(communityController.createReply));
router.put("/replies/:id", authenticate, validateZod(updateReplySchema), asyncHandler(communityController.updateReply));
router.delete("/replies/:id", authenticate, asyncHandler(communityController.deleteReply));
router.get("/my-replies", authenticate, asyncHandler(communityController.getMyReplies));


// ==================== USER DASHBOARD COMMENT ROUTES ====================


router.get(
  "/my-posts/comments",
  authenticate,
  asyncHandler(communityController.getCommentsOnMyPosts)
);

// Get all replies on my comments
router.get(
  "/my-comments/replies",
  authenticate,
  asyncHandler(communityController.getRepliesOnMyComments)
);

// Get combined activity feed (comments + replies)
router.get(
  "/my-interactions",
  authenticate,
  asyncHandler(communityController.getUserContentInteractions)
);
export default router;