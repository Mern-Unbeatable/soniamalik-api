import * as notificationService from "../services/notification.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getMyNotifications(req, res) {
    try {
        const { page = 1, limit = 20, filter } = req.query;

        const result = await notificationService.getUserNotifications(
            req.user.id,
            parseInt(page),
            parseInt(limit),
            filter
        );

        return sendSuccess(res, 200, "Notifications retrieved", result);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markNotificationAsRead(req, res) {
    try {
        const { id } = req.params;

        const notification = await notificationService.markAsRead(id, req.user.id);

        return sendSuccess(res, 200, "Notification marked as read", { notification });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export async function markAllNotificationsAsRead(req, res) {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);

        return sendSuccess(res, 200, "All notifications marked as read", {
            count: result.count,
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}


export async function deleteNotification(req, res) {
    try {
        const { id } = req.params;

        await notificationService.deleteNotification(id, req.user.id);

        return sendSuccess(res, 200, "Notification deleted", null);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}



export async function deleteAllReadNotifications(req, res) {
    try {
        const result = await notificationService.deleteAllReadNotifications(req.user.id);
        
        const message = result.count === 0 
            ? "No read notifications to delete" 
            : `Successfully deleted ${result.count} read notification(s)`;
        
        return sendSuccess(res, 200, message, {
            count: result.count,
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

/**
 * Get unread count only
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(req, res) {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);

        return sendSuccess(res, 200, "Unread count retrieved", { unreadCount: count });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}