import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = Router();


router.use(authenticate);

router.get("/", asyncHandler(notificationController.getMyNotifications));


router.get("/unread-count", asyncHandler(notificationController.getUnreadCount));

router.patch("/:id/read", asyncHandler(notificationController.markNotificationAsRead));

router.patch("/read-all", asyncHandler(notificationController.markAllNotificationsAsRead));


router.delete("/delete/read-all", asyncHandler(notificationController.deleteAllReadNotifications));
router.delete("/:id", asyncHandler(notificationController.deleteNotification));
export default router;