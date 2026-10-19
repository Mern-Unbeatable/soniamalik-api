import * as draftService from "../services/draft.service.js";
import { sendSuccess } from "../utils/response.js";
import { catchAsync } from "../shared/catch-async.js";

export const listDrafts = catchAsync(async (req, res) => {
  const drafts = await draftService.listDrafts(req.user.id, req.query.kind);
  return sendSuccess(res, 200, "Drafts retrieved successfully", drafts);
});

export const createDraft = catchAsync(async (req, res) => {
  const draft = await draftService.createDraft(
    req.user.id,
    req.body,
    draftService.getDraftUploadPaths(req),
  );
  return sendSuccess(res, 201, "Draft saved", draft);
});

export const updateDraft = catchAsync(async (req, res) => {
  const draft = await draftService.updateDraft(
    req.params.id,
    req.user.id,
    req.body,
    draftService.getDraftUploadPaths(req),
  );
  return sendSuccess(res, 200, "Draft saved", draft);
});

export const deleteDraft = catchAsync(async (req, res) => {
  await draftService.deleteDraft(req.params.id, req.user.id);
  return sendSuccess(res, 200, "Draft deleted");
});
