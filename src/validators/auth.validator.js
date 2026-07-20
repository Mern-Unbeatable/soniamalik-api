import { body } from "express-validator";

// Common validation rules for all roles
const commonValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("name").notEmpty().withMessage("Name is required"),
  body("role")
    .isIn(["USER", "COACH", "PROVIDER", "ADMIN"])
    .withMessage("Invalid role"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number required"),
  body("postcode").optional().notEmpty().withMessage("Postcode is required"),
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
];

// Sport Provider (COACH) validation
export const coachRegistrationValidation = [
  ...commonValidation,
  body("organizationName")
    .notEmpty()
    .withMessage("Organization/Coach name is required for sport providers"),
  body("sessionType")
    .optional()
    .isIn(["Women Only", "Mixed", "Men Only"])
    .withMessage("Invalid session type"),
  body("sportsOffered")
    .optional()
    .isArray()
    .withMessage("Sports offered must be an array"),
  body("aboutOrganization")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("About organization must not exceed 1000 characters"),
];

// Service Provider (PROVIDER) validation
export const providerRegistrationValidation = [
  ...commonValidation,
  body("organizationName")
    .notEmpty()
    .withMessage(
      "Organization/Practitioner name is required for service providers",
    ),
  body("serviceTypes")
    .optional()
    .isArray()
    .withMessage("Service types must be an array"),
  body("aboutOrganization")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("About organization must not exceed 1000 characters"),
];

// Regular User validation
export const userRegistrationValidation = [
  ...commonValidation,
  body("displayName")
    .optional()
    .notEmpty()
    .withMessage("Display name cannot be empty"),
  body("sportsInterests")
    .optional()
    .isArray()
    .withMessage("Sports interests must be an array"),
];

// Generic registration validation (for backward compatibility)
export const registrationValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("name").notEmpty().withMessage("Name is required"),
  body("role")
    .optional()
    .isIn(["USER", "COACH", "PROVIDER", "ADMIN"])
    .withMessage("Invalid role"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const verifyEmailValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("code").notEmpty().withMessage("Verification code is required"),
];

export const resendVerificationValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

export const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

export const verifyOTPValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp").notEmpty().withMessage("OTP is required"),
];

export const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp").notEmpty().withMessage("OTP is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
];
