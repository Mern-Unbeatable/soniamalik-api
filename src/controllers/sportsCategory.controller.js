import * as sportsCategoryService from "../services/sportsCategory.service.js";
import { catchAsync } from "../shared/catch-async.js";
import { sendError } from "../utils/response.js";

export const createSportsCategory = catchAsync(async (req, res) => {
  const { name } = req.body;

  const category = await sportsCategoryService.createSportsCategory({ name });

  res.status(201).json({
    success: true,
    message: "Sports category created successfully",
    data: category,
  });
});

export const getAllSportsCategories = catchAsync(async (req, res) => {
  const filters = {
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  };

  const result = await sportsCategoryService.getAllSportsCategories(filters);

  res.status(200).json({
    success: true,
    message: "Sports categories retrieved successfully",
    data: result.categories,
    meta: result.meta,
  });
});

export const getSportsCategoryById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await sportsCategoryService.getSportsCategoryById(id);

  res.status(200).json({
    success: true,
    message: "Sports category retrieved successfully",
    data: category,
  });
});

export const updateSportsCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const updatedCategory = await sportsCategoryService.updateSportsCategory(id, { name });

  res.status(200).json({
    success: true,
    message: "Sports category updated successfully",
    data: updatedCategory,
  });
});

export const deleteSportsCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  await sportsCategoryService.deleteSportsCategory(id);

  res.status(200).json({
    success: true,
    message: "Sports category deleted successfully",
  });
});