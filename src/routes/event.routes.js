import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { uploadSingleImage } from "../middlewares/upload.js";
import * as eventController from "../controllers/event.controller.js";
import { validateZod } from "../middlewares/validateZod.js";
import { createEventSchema, updateEventSchema } from "../validators/event.validation.js";
import { catchAsync } from "../shared/catch-async.js";
import { parseArrayFields } from "../middlewares/parseArrayFields.js";

const router = Router();

// ==================== ANALYTICS & DASHBOARD ====================
router.get(
  "/analytics/all",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(eventController.getEventAnalytics)
);

router.get(
  "/my/dashboard",
  authenticate,
  authorize("PROVIDER", "COACH"),
  asyncHandler(eventController.getOrganizerDashboard)
);

router.get(
  "/my/list",
  authenticate,
  authorize("PROVIDER", "COACH"),
  asyncHandler(eventController.getOrganizerEvents)
);

// ==================== USER PROFILE EVENT ROUTES ====================
router.get(
  "/user/interested",
  authenticate,
  authorize("USER", "PROVIDER", "COACH", "ADMIN"),
  asyncHandler(eventController.getUserInterestedEvents)
);

router.get(
  "/user/registered",
  authenticate,
  authorize("USER", "PROVIDER", "COACH", "ADMIN"),
  asyncHandler(eventController.getUserRegisteredEvents)
);

router.get(
  "/user/saved",
  authenticate,
  authorize("USER", "PROVIDER", "COACH", "ADMIN"),
  asyncHandler(eventController.getUserSavedEvents)
);
router.get(
  "/dashboard/messages",
  authenticate,
  authorize("USER"),
  asyncHandler(eventController.getUserDashboardMessages)
);
// ==================== MESSAGES ====================
router.get(
  "/messages/all",
  authenticate,
  authorize("PROVIDER", "COACH", "ADMIN", "USER"),
  asyncHandler(eventController.getAllEventMessages)
);

// ==================== USER DASHBOARD MESSAGES ====================

router.delete(
  "/messages/:messageId",
  authenticate,
  authorize("PROVIDER", "COACH", "USER", "ADMIN"),
  asyncHandler(eventController.deleteEventMessage)
);

router.get(
  "/messages/:messageId/thread",
  authenticate,
  authorize("PROVIDER", "COACH", "USER", "ADMIN"),
  asyncHandler(eventController.getEventMessageWithThread)
);

// ==================== PUBLIC / SHARED BOOKING LINK ====================


router.get("/", optionalAuth, asyncHandler(eventController.getAllEvents));



router.get(
  "/:id",
  optionalAuth,
  asyncHandler(eventController.getEventById)
);

// ==================== EVENT ACTIONS (AUTH REQUIRED) ====================

router.post(
  "/:id/register",
  optionalAuth,
  asyncHandler(eventController.registerForEvent)
);


router.post(
  "/:id/interest",
  authenticate,
  asyncHandler(eventController.registerInterest)
);

router.post(
  "/:id/save",
  authenticate,
  authorize("USER", "PROVIDER", "COACH", "ADMIN"),
  asyncHandler(eventController.toggleSaveEvent)
);


// Get event interests (organizer or admin)
router.get(
  "/:id/interests",
  authenticate,
  asyncHandler(eventController.getEventInterests)
);

// Get event registrations (organizer or admin)
router.get(
  "/:id/registrations",
  authenticate,
  asyncHandler(eventController.getEventRegistrations)
);

// Event messages
router.post(
  "/:id/messages",
  authenticate,
  authorize("PROVIDER", "COACH", "USER", "ADMIN"),
  asyncHandler(eventController.postEventMessage)
);

router.get(
  "/:id/messages",
  authenticate,
  authorize("PROVIDER", "COACH", "USER", "ADMIN"),
  asyncHandler(eventController.getEventMessages)
);


// ==================== CREATE / UPDATE / DELETE ====================

router.post(
  "/",
  authenticate,
  authorize("PROVIDER", "COACH", "ADMIN"),
  uploadSingleImage("image", "events"),
  parseArrayFields,
  validateZod(createEventSchema),
  catchAsync(eventController.createEvent)
);

router.put(
  "/:id",
  authenticate,
  uploadSingleImage("image", "events"),
  validateZod(updateEventSchema),
  asyncHandler(eventController.updateEvent)
);


router.delete(
  "/:id",
  authenticate,
  asyncHandler(eventController.deleteEvent)
);

// ==================== REGISTRATION STATUS ====================

router.patch(
  "/registrations/:registrationId/status",
  authenticate,
  asyncHandler(eventController.updateRegistrationStatus)
);

// ==================== ADMIN ACTIONS ====================

router.patch(
  "/:id/approval-status",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(eventController.updateApprovalStatus)
);

router.patch(
  "/:id/feature",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(eventController.toggleFeatureStatus)
);

router.patch(
  "/:id/ban",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(eventController.toggleBanStatus)
);

// ==================== SAVED EVENT SINGLE ====================
router.get(
  "/saved/:savedEventId",
  authenticate,
  authorize("USER", "PROVIDER", "COACH", "ADMIN"),
  asyncHandler(eventController.getSavedEventById)
);

export default router;