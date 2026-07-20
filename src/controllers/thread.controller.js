import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
} from "../utils/response.js";
import * as threadService from "../services/thread.service.js";

export async function getAllThreads(req, res) {
  try {
    const { threads, total, page, limit } = await threadService.getAllThreads(
      req.query,
    );
    return sendPaginatedResponse(res, threads, page, limit, total);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function getThreadById(req, res) {
  try {
    const { id } = req.params;
    const thread = await threadService.getThreadById(id);
    return sendSuccess(res, 200, "Thread retrieved successfully", { thread });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function createThread(req, res) {
  try {
    const thread = await threadService.createThread(req.body, req.user.id);
    return sendSuccess(res, 201, "Thread created successfully", { thread });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function updateThread(req, res) {
  try {
    const { id } = req.params;
    const thread = await threadService.updateThread(
      id,
      req.body,
      req.user.id,
      req.user.role,
    );
    return sendSuccess(res, 200, "Thread updated successfully", { thread });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function deleteThread(req, res) {
  try {
    const { id } = req.params;
    await threadService.deleteThread(id, req.user.id, req.user.role);
    return sendSuccess(res, 200, "Thread deleted successfully");
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function createThreadReply(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const reply = await threadService.createThreadReply(
      id,
      content,
      req.user.id,
    );
    return sendSuccess(res, 201, "Reply posted successfully", { reply });
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function togglePinThread(req, res) {
  try {
    const { id } = req.params;
    const thread = await threadService.togglePinThread(id);
    return sendSuccess(
      res,
      200,
      `Thread ${thread.isPinned ? "pinned" : "unpinned"} successfully`,
      { thread },
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}

export async function toggleLockThread(req, res) {
  try {
    const { id } = req.params;
    const thread = await threadService.toggleLockThread(id);
    return sendSuccess(
      res,
      200,
      `Thread ${thread.isLocked ? "locked" : "unlocked"} successfully`,
      { thread },
    );
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message);
  }
}
