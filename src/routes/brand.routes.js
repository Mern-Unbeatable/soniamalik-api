import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validateZod } from "../middlewares/validateZod.js";
import { createBrandSchema, updateBrandSchema } from "../validators/brand.validation.js";
import * as brandController from "../controllers/brand.controller.js";

const router = Router();

router.post(
  "/",
  validateZod(createBrandSchema),
  asyncHandler(brandController.createBrand)
);

router.put(
  "/:id",
  authenticate,
  validateZod(updateBrandSchema),
  asyncHandler(brandController.updateBrand)
);


router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(brandController.getAllBrands)
);


router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(brandController.getBrandById)
);


router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(brandController.deleteBrand)
);

export default router;