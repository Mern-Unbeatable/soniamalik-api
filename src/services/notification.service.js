import prisma from "../config/database.js";

// Helper function to create notification with action URL
export async function createNotification(userId, type, title, message, data = null) {
    try {
        console.log("📢 [NOTIFICATION] Creating notification:", {
            userId,
            type,
            title,
            message,
            data
        });

        // Don't send notification to self
        if (data && data.selfId === userId) {
            console.log("⏭️ [NOTIFICATION] Skipping: self notification");
            return null;
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true }
        });

        if (!user) {
            console.error(`❌ [NOTIFICATION] User not found: ${userId}`);
            return null;
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data: data || {},
                isRead: false,
                isDeleted: false,
            },
        });

        console.log(`✅ [NOTIFICATION] Created: ${notification.id} for user ${user.name} (${user.role})`);
        return notification;
    } catch (error) {
        console.error("❌ [NOTIFICATION] Create error:", error);
        return null;
    }
}

// Get user's notifications
export async function getUserNotifications(userId, page = 1, limit = 20, filter = null) {
    const skip = (page - 1) * limit;

    const where = {
        userId,
        isDeleted: false,
    };

    if (filter === 'unread') {
        where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                userId,
                isRead: false,
                isDeleted: false,
            },
        }),
    ]);

    console.log(`📬 [NOTIFICATION] Fetched ${notifications.length} notifications for user ${userId}, unread: ${unreadCount}`);

    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        unreadCount,
    };
}

// Mark as read
export async function markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId,
            isDeleted: false,
        },
    });

    if (!notification) {
        throw { statusCode: 404, message: "Notification not found" };
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });
}

// Mark all as read
export async function markAllAsRead(userId) {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
            isDeleted: false,
        },
        data: { isRead: true },
    });
}

// Delete notification
export async function deleteNotification(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
        where: {
            id: notificationId,
            userId,
        },
    });

    if (!notification) {
        throw { statusCode: 404, message: "Notification not found" };
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: { isDeleted: true },
    });
}


export async function deleteAllReadNotifications(userId) {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            isRead: true,     
            isDeleted: false,  
        },
        data: { isDeleted: true },
    });
    
    // Don't throw error if count is 0, just return 0
    return { count: result.count };
}
// Get unread count
export async function getUnreadCount(userId) {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false,
            isDeleted: false,
        },
    });
}