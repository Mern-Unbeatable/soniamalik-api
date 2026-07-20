import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
} from "../utils/response.js";
import * as homepageService from "../services/homepage.service.js";
import { catchAsync } from "../shared/catch-async.js";

export const createSection = catchAsync(async (req, res) => {
  const section = await homepageService.createSection(req.body);
  return sendSuccess(res, 201, "Section created successfully", { section });
});

export const getAllSections = catchAsync(async (req, res) => {
  const result = await homepageService.getAllSections(req.query);
  return sendPaginatedResponse(
    res,
    result.sections,
    result.page,
    result.limit,
    result.total,
  );
});

export const getSectionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const section = await homepageService.getSectionById(id);
  return sendSuccess(res, 200, "Section retrieved successfully", { section });
});

export const updateSection = catchAsync(async (req, res) => {
  const { id } = req.params;
  const section = await homepageService.updateSection(id, req.body);
  return sendSuccess(res, 200, "Section updated successfully", { section });
});


export const deleteSection = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await homepageService.deleteSection(id);
  return sendSuccess(res, 200, result.message);
});

export const createCard = catchAsync(async (req, res) => {
  const card = await homepageService.createCard(req.body);
  return sendSuccess(res, 201, "Card created successfully", { card });
});

export const getAllCards = catchAsync(async (req, res) => {
  const result = await homepageService.getAllCards(req.query);
  return sendPaginatedResponse(
    res,
    result.cards,
    result.page,
    result.limit,
    result.total,
  );
});

export const getCardById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const card = await homepageService.getCardById(id);
  return sendSuccess(res, 200, "Card retrieved successfully", { card });
});

export const updateCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const card = await homepageService.updateCard(id, req.body);
  return sendSuccess(res, 200, "Card updated successfully", { card });
});

export const deleteCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await homepageService.deleteCard(id);
  return sendSuccess(res, 200, result.message);
});

export const getActiveSections = catchAsync(async (req, res) => {
  const { type, page } = req.query;
  const sections = await homepageService.getActiveSections(type, page);
  return sendSuccess(res, 200, "Active sections retrieved successfully", {
    sections,
  });
});

export const getHomepageContent = catchAsync(async (req, res) => {
  const { page } = req.query;
  const homepage = await homepageService.getHomepageContent(page);
  return sendSuccess(res, 200, "Homepage content retrieved successfully", {
    homepage,
  });
});