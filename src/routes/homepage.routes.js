import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { uploadHomepageImages, uploadSingleImage } from "../middlewares/upload.js";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  createCard,
  getAllCards,
  getCardById,
  updateCard,
  deleteCard,
  getActiveSections,
  getHomepageContent,
} from "../controllers/homepage.controller.js";
import {
  createSectionSchema,
  updateSectionSchema,
  idParamSchema,
  createCardSchema,
  updateCardSchema,
  getActiveSectionsQuerySchema,
  getAllSectionsQuerySchema,
  getAllCardsQuerySchema,
} from "../validators/homepage.validation.js";
import { validateZod } from "../middlewares/validateZod.js";

const router = Router();

// ==================== PUBLIC ROUTES ====================

router.get("/content", asyncHandler(getHomepageContent));
router.get(
  "/sections/active",
  validateZod(getActiveSectionsQuerySchema),
  asyncHandler(getActiveSections)
);

// ==================== ADMIN ROUTES ====================

router.get(
  "/sections",
  authenticate,
  validateZod(getAllSectionsQuerySchema),
  asyncHandler(getAllSections)
);

router.get(
  "/sections/:id",
  authenticate,
  asyncHandler(getSectionById)
);


router.post(
  "/sections",
  authenticate,
  authorize("ADMIN"),
  uploadHomepageImages("homepage"),
  validateZod(createSectionSchema),
  asyncHandler(createSection)
);


router.patch(
  "/sections/:id",
  authenticate,
  authorize("ADMIN"),
  uploadHomepageImages("homepage"),
  asyncHandler(updateSection)
);

router.delete(
  "/sections/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(deleteSection)
);

// ==================== CARD ROUTES ====================

router.get(
  "/cards",
  asyncHandler(getAllCards)
);

router.get(
  "/cards/:id",
  asyncHandler(getCardById)
);

router.post(
  "/cards",
  authenticate,
  authorize("ADMIN"),
  uploadSingleImage("image", "homepage"),
  asyncHandler(createCard)
);


router.put(
  "/cards/:id",
  authenticate,
  authorize("ADMIN"),
  uploadSingleImage("image", "homepage"),
  asyncHandler(updateCard)
);

router.delete(
  "/cards/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(deleteCard)
);

export default router;