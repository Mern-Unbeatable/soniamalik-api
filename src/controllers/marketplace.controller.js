import * as marketplaceService from "../services/marketplace.service.js";
import { sendSuccess } from "../utils/response.js";
import { catchAsync } from "../shared/catch-async.js";

export const recordBrandClick = catchAsync(async (req, res) => {
  await marketplaceService.recordBrandClick(req.body?.brandKey);
  return sendSuccess(res, 201, "Click recorded");
});

export const getBrandClickStats = catchAsync(async (req, res) => {
  const stats = await marketplaceService.getBrandClickStats();
  return sendSuccess(res, 200, "Brand clicks retrieved successfully", stats);
});
