import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";
import {
  suspendUser,
  unsuspendUser,
  getSuspendedUsers,
  getDashboardStats,
  getUserTrends,
  getDemandVsSupply,
  getHighDemandAlerts,
  getTopLocationsByDemand,
  exportDashboardData,
  getConversionFunnel,
  getContactMetadata,
  getRegisterInterests,
  createProvider,
  resendProviderInvite,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));


const suspendValidation = [
  body("reason")
    .notEmpty()
    .trim()
    .withMessage("Suspension reason is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Reason must be between 1 and 500 characters"),
];


router.get("/suspended-users", asyncHandler(getSuspendedUsers));


router.post(
  "/users/:id/suspend",
  suspendValidation,
  validate,
  asyncHandler(suspendUser),
);

router.post("/users/:id/unsuspend", asyncHandler(unsuspendUser));

const createProviderValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("role").isIn(["COACH", "PROVIDER"]).withMessage("Role must be COACH or PROVIDER"),
  body("organizationName").notEmpty().trim().withMessage("Organisation name is required"),
];

router.post(
  "/providers",
  createProviderValidation,
  validate,
  asyncHandler(createProvider),
);

router.post("/providers/:id/resend-invite", asyncHandler(resendProviderInvite));


router.get("/dashboard/stats", asyncHandler(getDashboardStats));

router.get("/dashboard/user-trends", asyncHandler(getUserTrends));


router.get("/dashboard/demand-supply", asyncHandler(getDemandVsSupply));


router.get("/dashboard/high-demand-alerts", asyncHandler(getHighDemandAlerts));


router.get("/dashboard/top-locations", asyncHandler(getTopLocationsByDemand));


router.get("/dashboard/export", asyncHandler(exportDashboardData));
router.get("/dashboard/conversion-funnel", asyncHandler(getConversionFunnel));

router.get(
  "/dashboard/contact-metadata",
  asyncHandler(getContactMetadata)
);
// Register Interests Table
router.get(
  "/dashboard/register-interests",
  asyncHandler(getRegisterInterests)
);

export default router;
