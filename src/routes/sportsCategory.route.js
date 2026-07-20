import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import * as sportsCategoryController from "../controllers/sportsCategory.controller.js";
import { validateZod } from "../middlewares/validateZod.js";
import { createSportsCategorySchema, updateSportsCategorySchema } from "../validators/sportCategory.validation.js";

const router = Router();


router.get(
  "/", 
  optionalAuth, 
  asyncHandler(sportsCategoryController.getAllSportsCategories)
);


router.get(
  "/:id", 
  optionalAuth, 
  asyncHandler(sportsCategoryController.getSportsCategoryById)
);


router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateZod(createSportsCategorySchema),
  asyncHandler(sportsCategoryController.createSportsCategory)
);


router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateZod(updateSportsCategorySchema),
  asyncHandler(sportsCategoryController.updateSportsCategory)
);


router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(sportsCategoryController.deleteSportsCategory)
);

export default router;