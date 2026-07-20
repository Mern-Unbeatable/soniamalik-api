import * as brandService from "../services/brand.service.js";
import { sendSuccess, sendPaginatedResponse } from "../utils/response.js";
import { catchAsync } from "../shared/catch-async.js";

export const createBrand = catchAsync(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  return sendSuccess(res, 201, "Brand created successfully", brand);
});

export const getBrandById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const brand = await brandService.getBrandById(id);
  return sendSuccess(res, 200, "Brand retrieved successfully", brand);
});

export const updateBrand = catchAsync(async (req, res) => {
  const { id } = req.params;
  const brand = await brandService.updateBrand(id, req.body);
  return sendSuccess(res, 200, "Brand updated successfully", brand);
});

export const deleteBrand = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await brandService.deleteBrand(id);
  return sendSuccess(res, 200, result.message, null);
});

export const getAllBrands = catchAsync(async (req, res) => {
  const result = await brandService.getAllBrands(req.query);
  return sendPaginatedResponse(
    res,
    result.brands,
    result.pagination.page,
    result.pagination.limit,
    result.pagination.total
  );
});