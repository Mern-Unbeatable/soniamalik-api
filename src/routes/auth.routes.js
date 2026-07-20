import { Router } from "express";
import { body } from "express-validator";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";
import {
  register,
  login,
  getCurrentUser,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Validation rules
const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("role")
    .optional()
    .isIn(["USER", "ADMIN", "PROVIDER", "COACH"])
    .withMessage("Invalid role"),

  // Common optional fields
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("displayName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Display name cannot be empty"),
  body("phone").optional().trim(),
  body("postcode").optional().trim(),
  body("address").optional().trim(),
  body("bio").optional().trim(),

  // Sport Provider (COACH) fields
  body("organizationName").optional().trim(),
  body("sessionType")
    .optional()
    .isIn(["Women Only", "Mixed", "Men Only", "Other"])
    .withMessage("Invalid session type"),
  body("sportsOffered")
    .optional()
    .isArray()
    .withMessage("Sports offered must be an array"),
  body("aboutOrganization").optional().trim(),

  // Service Provider (PROVIDER) fields
  body("serviceTypes")
    .optional()
    .isArray()
    .withMessage("Service types must be an array"),

  // Regular User fields
  body("sportsInterests")
    .optional()
    .isArray()
    .withMessage("Sports interests must be an array"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const verifyEmailValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("code").notEmpty().trim().withMessage("Verification code is required"),
];

const resendVerificationValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
];

const forgotPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
];

const verifyOTPValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("otp").notEmpty().trim().withMessage("OTP is required"),
];

const resetPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("otp").notEmpty().trim().withMessage("OTP is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// Routes
router.post("/register", registerValidation, validate, asyncHandler(register));
router.post("/login", loginValidation, validate, asyncHandler(login));
router.get("/me", authenticate, asyncHandler(getCurrentUser));
router.post("/logout", authenticate, asyncHandler(logout));

// Email verification routes
router.post(
  "/verify-email",
  verifyEmailValidation,
  validate,
  asyncHandler(verifyEmail),
);
router.post(
  "/resend-verification",
  resendVerificationValidation,
  validate,
  asyncHandler(resendVerification),
);

// Password reset routes
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  asyncHandler(forgotPassword),
);
router.post(
  "/verify-otp",
  verifyOTPValidation,
  validate,
  asyncHandler(verifyOTP),
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  asyncHandler(resetPassword),
);

// Change password route (requires authentication)
router.post(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  asyncHandler(changePassword),
);

export default router;
