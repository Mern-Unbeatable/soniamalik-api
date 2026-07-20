import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateBillingAddress,
  updateShippingAddress,
  getMyProfile,
  getUserComments,
  getUserReplies,
} from "../controllers/user.controller.js";

const router = Router();

// Validation rules for address
const addressValidation = [
  body("firstName").notEmpty().trim().withMessage("First name is required"),
  body("lastName").notEmpty().trim().withMessage("Last name is required"),
  body("companyName").optional().trim(),
  body("address").notEmpty().trim().withMessage("Address is required"),
  body("regionState").notEmpty().trim().withMessage("Region/State is required"),
  body("city").notEmpty().trim().withMessage("City is required"),
  body("zipCode").notEmpty().trim().withMessage("Zip code is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phoneNumber").notEmpty().trim().withMessage("Phone number is required"),
];

// All user routes require authentication
router.use(authenticate);
// Add this after the existing routes
router.get("/me/profile", asyncHandler(getMyProfile));
router.get("/", authorize("ADMIN"), asyncHandler(getAllUsers));
router.get("/:id", asyncHandler(getUserById));
router.put(
  "/:id",
  uploadSingleImage("avatar", "avatars"),
  asyncHandler(updateUser),
);
router.delete("/:id", authorize("ADMIN"), asyncHandler(deleteUser));

// Address routes
router.put(
  "/:id/billing-address",
  addressValidation,
  validate,
  asyncHandler(updateBillingAddress),
);
router.put(
  "/:id/shipping-address",
  addressValidation,
  validate,
  asyncHandler(updateShippingAddress),
);
// In routes/user.routes.js
router.get("/my/comments", authenticate, asyncHandler(getUserComments));
router.get("/my/replies", authenticate, asyncHandler(getUserReplies));

export default router;
