import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import * as serviceController from "../controllers/service.controller.js";

import { validateZod } from "../middlewares/validateZod.js";
import { banServiceSchema, createServiceSchema, rejectServiceSchema, sendMessageSchema, updateBookingStatusSchema, updateServiceSchema } from "../validators/service.validation.js";
import { parseArrayFields } from "../middlewares/parseArrayFields.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────


router.get("/", asyncHandler(serviceController.getAllServices));

// ─── Provider ─────────────────────────────────────────────────────────────────


router.get(
  "/provider/my",
  authenticate,
  authorize("PROVIDER", "ADMIN", 'COACH'),
  asyncHandler(serviceController.getProviderServices),
);

router.get(
  "/analytics",
  authenticate,
  authorize("PROVIDER", "ADMIN", 'COACH'),
  asyncHandler(serviceController.getServiceAnalytics),
);
router.get(
  "/admin/by-provider-role",
  authenticate,
  authorize("ADMIN", 'USER'),
  asyncHandler(serviceController.getServicesByProviderRole),
);
router.get(
  "/by-role",
  asyncHandler(serviceController.getServicesByProviderRole),
);

router.get(
  "/dashboard",
  authenticate,
  authorize("PROVIDER", "ADMIN", 'COACH'),
  asyncHandler(serviceController.getProviderDashboard),
);


// ─── Admin ────────────────────────────────────────────────────────────────────

router.get(
  "/admin/all",
  authenticate,
  authorize("ADMIN", 'USER'),
  asyncHandler(serviceController.getAdminServices),
);


router.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(serviceController.approveService),
);

router.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  validateZod(rejectServiceSchema),
  asyncHandler(serviceController.rejectService)
);

router.patch(
  "/:id/feature",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(serviceController.featureService),
);

router.patch(
  "/:id/ban",
  authenticate,
  authorize("ADMIN"),
  validateZod(banServiceSchema),
  asyncHandler(serviceController.banService)
);



router.patch(
  "/:id/approval-status",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(serviceController.updateApprovalStatus),
);

// ─── Booking / Interest ───────────────────────────────────────────────────────


router.post("/:id/book", authenticate, asyncHandler(serviceController.bookNow));

router.post(
  "/:id/interest",
  authenticate,
  asyncHandler(serviceController.registerInterest),
);


router.get(
  "/:id/bookings",
  authenticate,
  authorize("PROVIDER", "ADMIN", "COACH"),
  asyncHandler(serviceController.getServiceBookings),
);

router.get(
  "/:id/interests",
  authenticate,
  authorize("PROVIDER", "ADMIN", "COACH"),
  asyncHandler(serviceController.getServiceInterests),
);

router.patch(
  "/bookings/:bookingId/status",
  authenticate,
  authorize("PROVIDER", "ADMIN", "COACH"),
  validateZod(updateBookingStatusSchema),
  asyncHandler(serviceController.updateBookingStatus)
);


// ==================== DELETE BOOKING & INTEREST ====================


router.delete(
  "/bookings/:bookingId",
  authenticate,
  authorize("PROVIDER", "COACH", "ADMIN"),
  asyncHandler(serviceController.deleteBooking)
);

router.delete(
  "/interests/:interestId",
  authenticate,
  authorize("PROVIDER", "COACH", "ADMIN"),
  asyncHandler(serviceController.deleteInterest)
);

router.patch(
  "/bookings/:bookingId/cancel",
  authenticate,
  asyncHandler(serviceController.cancelBooking)
);

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(serviceController.getServiceById),
);




router.post(
  "/",
  authenticate,
  authorize("PROVIDER", "ADMIN", "COACH"),
  uploadSingleImage("logo"),
  parseArrayFields,
  validateZod(createServiceSchema),
  asyncHandler(serviceController.createService)
);

router.put(
  "/:id",
  authenticate,
  authorize("PROVIDER", "ADMIN", "COACH"),
  uploadSingleImage("logo"),
  validateZod(updateServiceSchema),
  asyncHandler(serviceController.updateService)
);


router.delete(
  "/:id",
  authenticate,
  authorize("PROVIDER", "ADMIN", "COACH"),
  asyncHandler(serviceController.deleteService),
);


// MESSAGES 
router.get(
  "/messages/all",
  authenticate,
  authorize("PROVIDER", "COACH", "ADMIN"),
  asyncHandler(serviceController.getAllServiceMessages)
);

router.post(
  "/:id/messages",
  authenticate,
  validateZod(sendMessageSchema),
  asyncHandler(serviceController.sendMessage)
);


router.get(
  "/:id/messages",
  authenticate,
  asyncHandler(serviceController.getServiceMessages)
);

router.get(
  "/messages/:messageId",
  authenticate,
  asyncHandler(serviceController.getMessageWithThread)
);


router.get(
  "/conversations/my",
  authenticate,
  asyncHandler(serviceController.getUserConversations)
);


router.delete(
  "/messages/:messageId",
  authenticate,
  asyncHandler(serviceController.deleteMessage)
);




export default router;
