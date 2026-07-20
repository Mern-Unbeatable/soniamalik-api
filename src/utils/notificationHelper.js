import * as notificationService from "../services/notification.service.js";

// Frontend routes mapping
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const NotificationHelper = {

    // ==================== 1. SERVICE BOOKING NOTIFICATIONS ====================

    async bookingCreated(providerId, userName, serviceName, serviceId, bookingId) {
        return notificationService.createNotification(
            providerId,
            "BOOKING_CREATED",
            " New Booking Received",
            `${userName} has booked "${serviceName}". Please confirm the booking.`,
            {
                type: "BOOKING",
                action: "view_booking",
                actionUrl: `/provider/services/${serviceId}/bookings/${bookingId}`,
                serviceId,
                serviceName,
                bookingId,
                userName,
            }
        );
    },

    async bookingConfirmed(userId, serviceName, serviceId, bookingId) {
        return notificationService.createNotification(
            userId,
            "BOOKING_CONFIRMED",
            " Booking Confirmed",
            `Your booking for "${serviceName}" has been confirmed!`,
            {
                type: "BOOKING",
                action: "view_booking",
                actionUrl: `/my-bookings/${bookingId}`,
                serviceId,
                serviceName,
                bookingId,
            }
        );
    },

    async bookingCancelled(userId, serviceName, serviceId, bookingId, cancelledBy) {
        const title = cancelledBy === "provider" ? "❌ Booking Cancelled by Provider" : "❌ Booking Cancelled";
        const message = cancelledBy === "provider"
            ? `Your booking for "${serviceName}" has been cancelled by the provider.`
            : `You have cancelled your booking for "${serviceName}".`;

        return notificationService.createNotification(
            userId,
            "BOOKING_CANCELLED",
            title,
            message,
            {
                type: "BOOKING",
                action: "view_booking",
                actionUrl: `/my-bookings/${bookingId}`,
                serviceId,
                serviceName,
                bookingId,
                cancelledBy,
            }
        );
    },

    async bookingCompleted(userId, serviceName, serviceId, bookingId) {
        return notificationService.createNotification(
            userId,
            "BOOKING_COMPLETED",
            " Service Completed",
            `Your service "${serviceName}" has been completed. Please share your feedback!`,
            {
                type: "BOOKING",
                action: "rate_service",
                actionUrl: `/my-bookings/${bookingId}/review`,
                serviceId,
                serviceName,
                bookingId,
            }
        );
    },

    // ==================== 2. SERVICE INTEREST NOTIFICATIONS ====================

    async interestReceived(providerId, userName, serviceName, serviceId, interestId) {
        return notificationService.createNotification(
            providerId,
            "INTEREST_RECEIVED",
            " New Interest Received",
            `${userName} is interested in "${serviceName}". Contact them soon!`,
            {
                type: "INTEREST",
                action: "view_interest",
                actionUrl: `/provider/services/${serviceId}/interests/${interestId}`,
                serviceId,
                serviceName,
                interestId,
                userName,
            }
        );
    },

    // ==================== 3. MESSAGE NOTIFICATIONS ====================

    async messageReceived(providerId, userName, serviceName, serviceId, messageId, message) {
        const shortMessage = message.length > 50 ? message.substring(0, 50) + "..." : message;

        return notificationService.createNotification(
            providerId,
            "MESSAGE_RECEIVED",
            " New Message",
            `${userName}: "${shortMessage}"`,
            {
                type: "MESSAGE",
                action: "view_conversation",
                actionUrl: `/provider/services/${serviceId}/messages`,
                serviceId,
                serviceName,
                messageId,
                userName,
                message: shortMessage,
            }
        );
    },

    async messageReplyReceived(userId, providerName, serviceName, serviceId, messageId, reply) {
        const shortReply = reply.length > 50 ? reply.substring(0, 50) + "..." : reply;

        return notificationService.createNotification(
            userId,
            "MESSAGE_REPLY_RECEIVED",
            " New Reply",
            `${providerName} replied: "${shortReply}"`,
            {
                type: "MESSAGE",
                action: "view_conversation",
                actionUrl: `/messages/${messageId}`,
                serviceId,
                serviceName,
                messageId,
                providerName,
                reply: shortReply,
            }
        );
    },

    // ==================== 4. SERVICE STATUS NOTIFICATIONS ====================

    async serviceApproved(providerId, serviceName, serviceId) {
        return notificationService.createNotification(
            providerId,
            "SERVICE_APPROVED",
            " Service Approved",
            `Your service "${serviceName}" has been approved and is now live!`,
            {
                type: "SERVICE",
                action: "view_service",
                actionUrl: `/provider/services/${serviceId}`,
                serviceId,
                serviceName,
            }
        );
    },

    async serviceRejected(providerId, serviceName, serviceId, reason) {
        return notificationService.createNotification(
            providerId,
            "SERVICE_REJECTED",
            " Service Rejected",
            `Your service "${serviceName}" was rejected. Reason: ${reason}`,
            {
                type: "SERVICE",
                action: "edit_service",
                actionUrl: `/provider/services/${serviceId}/edit`,
                serviceId,
                serviceName,
                reason,
            }
        );
    },

    async serviceFeatured(providerId, serviceName, serviceId) {
        return notificationService.createNotification(
            providerId,
            "SERVICE_FEATURED",
            "Service Featured",
            `Your service "${serviceName}" has been featured on the platform!`,
            {
                type: "SERVICE",
                action: "view_service",
                actionUrl: `/provider/services/${serviceId}`,
                serviceId,
                serviceName,
            }
        );
    },

    async serviceBanned(providerId, serviceName, serviceId, reason, isBanned = true) {
        const title = isBanned ? " Service Banned" : " Service Unbanned";
        const message = isBanned
            ? `Your service "${serviceName}" has been banned. Reason: ${reason}`
            : `Your service "${serviceName}" has been unbanned.`;

        return notificationService.createNotification(
            providerId,
            "SERVICE_BANNED",
            title,
            message,
            {
                type: "SERVICE",
                action: "view_service",
                actionUrl: `/provider/services/${serviceId}`,
                serviceId,
                serviceName,
                reason,
                isBanned,
            }
        );
    },

    // ==================== 5. EVENT NOTIFICATIONS ====================

    async eventRegistration(organizerId, userName, eventTitle, eventId, registrationId) {
        return notificationService.createNotification(
            organizerId,
            "EVENT_REGISTRATION",
            " New Event Registration",
            `${userName} registered for "${eventTitle}"`,
            {
                type: "EVENT",
                action: "view_registrations",
                actionUrl: `/organizer/events/${eventId}/registrations`,
                eventId,
                eventTitle,
                registrationId,
                userName,
            }
        );
    },

    async eventApproved(organizerId, eventTitle, eventId) {
        return notificationService.createNotification(
            organizerId,
            "EVENT_APPROVED",
            " Event Approved",
            `Your event "${eventTitle}" has been approved and is now live!`,
            {
                type: "EVENT",
                action: "view_event",
                actionUrl: `/organizer/events/${eventId}`,
                eventId,
                eventTitle,
            }
        );
    },

    async eventRejected(organizerId, eventTitle, eventId, reason) {
        return notificationService.createNotification(
            organizerId,
            "EVENT_REJECTED",
            " Event Rejected",
            `Your event "${eventTitle}" was rejected. Reason: ${reason}`,
            {
                type: "EVENT",
                action: "edit_event",
                actionUrl: `/organizer/events/${eventId}/edit`,
                eventId,
                eventTitle,
                reason,
            }
        );
    },

    async eventFeatured(organizerId, eventTitle, eventId) {
        return notificationService.createNotification(
            organizerId,
            "SERVICE_FEATURED",
            "⭐ Event Featured",
            `Your event "${eventTitle}" has been featured on the platform!`,
            {
                type: "EVENT",
                action: "view_event",
                actionUrl: `/organizer/events/${eventId}`,
                eventId,
                eventTitle,
            }
        );
    },

    async eventBanned(organizerId, eventTitle, eventId, reason, isBanned = true) {
        const title = isBanned ? " Event Banned" : "🔓 Event Unbanned";
        const message = isBanned
            ? `Your event "${eventTitle}" has been banned. Reason: ${reason}`
            : `Your event "${eventTitle}" has been unbanned.`;

        return notificationService.createNotification(
            organizerId,
            "SERVICE_BANNED",
            title,
            message,
            {
                type: "EVENT",
                action: "view_event",
                actionUrl: `/organizer/events/${eventId}`,
                eventId,
                eventTitle,
                reason,
                isBanned,
            }
        );
    },

    // ==================== 6. EVENT MESSAGE NOTIFICATIONS ====================

    async eventMessageReceived(organizerId, userName, eventTitle, eventId, messageId, message) {
        const shortMessage = message.length > 50 ? message.substring(0, 50) + "..." : message;

        return notificationService.createNotification(
            organizerId,
            "EVENT_MESSAGE_RECEIVED",
            " New Question on Your Event",
            `${userName} asked: "${shortMessage}"`,
            {
                type: "EVENT_MESSAGE",
                action: "view_event_question",
                actionUrl: `/organizer/events/${eventId}/messages/${messageId}`,
                eventId,
                eventTitle,
                messageId,
                userName,
                message: shortMessage,
            }
        );
    },

    async eventMessageReplyReceived(userId, organizerName, eventTitle, eventId, parentId, reply) {
        const shortReply = reply.length > 50 ? reply.substring(0, 50) + "..." : reply;

        return notificationService.createNotification(
            userId,
            "EVENT_MESSAGE_REPLY_RECEIVED",
            " Reply to Your Question",
            `${organizerName} replied: "${shortReply}"`,
            {
                type: "EVENT_MESSAGE",
                action: "view_event_reply",
                actionUrl: `/events/${eventId}/messages/${parentId}`,
                eventId,
                eventTitle,
                parentId,
                organizerName,
                reply: shortReply,
            }
        );
    },

    // ==================== 7. COMMUNITY POST NOTIFICATIONS ====================

    async postComment(postAuthorId, commenterName, postTitle, postId, commentId, comment) {
        const shortComment = comment.length > 60 ? comment.substring(0, 60) + "..." : comment;

        return notificationService.createNotification(
            postAuthorId,
            "POST_COMMENT",
            " New Comment",
            `${commenterName} commented: "${shortComment}"`,
            {
                type: "POST",
                action: "view_post",
                actionUrl: `/community/posts/${postId}`,
                postId,
                postTitle,
                commentId,
                commenterName,
                comment: shortComment,
            }
        );
    },

    async postLike(postAuthorId, likerName, postTitle, postId, reactionType) {
        const emoji = { LIKE: "👍", LOVE: "❤️", HAHA: "😄", WOW: "😲", SAD: "😢", ANGRY: "😠" };

        return notificationService.createNotification(
            postAuthorId,
            "POST_LIKE",
            `${emoji[reactionType]} New Reaction`,
            `${likerName} reacted with ${reactionType.toLowerCase()} to your post`,
            {
                type: "POST",
                action: "view_post",
                actionUrl: `/community/posts/${postId}`,
                postId,
                postTitle,
                likerName,
                reactionType,
            }
        );
    },

    async postReply(commentAuthorId, replierName, postId, commentId, replyId, reply) {
        const shortReply = reply.length > 60 ? reply.substring(0, 60) + "..." : reply;

        return notificationService.createNotification(
            commentAuthorId,
            "POST_REPLY",
            " New Reply",
            `${replierName} replied to your comment: "${shortReply}"`,
            {
                type: "POST",
                action: "view_post",
                actionUrl: `/community/posts/${postId}`,
                postId,
                commentId,
                replyId,
                replierName,
                reply: shortReply,
            }
        );
    },

    // ==================== 8. NEW USER SIGNUP ====================

    async newUserSignup(adminId, userName, userEmail, userId) {
        return notificationService.createNotification(
            adminId,
            "NEW_SIGNUP",
            " New User Joined",
            `${userName} (${userEmail}) just joined the platform!`,
            {
                type: "USER",
                action: "view_user",
                actionUrl: `/admin/users/${userId}`,
                userId,
                userName,
                userEmail,
            }
        );
    },
};