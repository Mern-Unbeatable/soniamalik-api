import prisma from "../config/database.js";
import * as  notificationService from "./notification.service.js";


export async function sendMessage(serviceId, userId, message, parentId = null) {
    console.log("\n========== [MESSAGE] sendMessage Started ==========");
    console.log("[MESSAGE] Input:", { serviceId, userId, parentId, message: message.substring(0, 50) });

    // Verify service exists and is approved
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!service) {
        console.error("[MESSAGE] Service not found:", serviceId);
        throw { statusCode: 404, message: "Service not found" };
    }

    if (!service.isApproved) {
        console.error("[MESSAGE] Service not approved:", serviceId);
        throw { statusCode: 400, message: "Cannot message about an unavailable service" };
    }

    console.log("[MESSAGE] Service found:", {
        id: service.id,
        name: service.listingHeadline,
        providerId: service.providerId,
        providerName: service.provider?.name
    });

    // Verify user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
        console.error("[MESSAGE] User not found:", userId);
        throw { statusCode: 404, message: "User not found" };
    }

    console.log("[MESSAGE] User found:", {
        id: user.id,
        name: user.name,
        role: user.role
    });

    // If it's a reply, check if parent message exists
    if (parentId) {
        const parentMessage = await prisma.serviceMessage.findUnique({
            where: { id: parentId },
        });

        if (!parentMessage) {
            throw { statusCode: 404, message: "Parent message not found" };
        }

        if (parentMessage.serviceId !== serviceId) {
            throw { statusCode: 400, message: "Parent message does not belong to this service" };
        }

        console.log("[MESSAGE] Parent message found:", {
            id: parentMessage.id,
            senderId: parentMessage.senderId
        });
    }

    // Create message
    const serviceMessage = await prisma.serviceMessage.create({
        data: {
            serviceId,
            senderId: userId,
            message: message.trim(),
            parentId,
            isReply: !!parentId,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                },
            },
        },
    });

    console.log("[MESSAGE] Message created:", {
        id: serviceMessage.id,
        isReply: serviceMessage.isReply
    });

    // 🔔 Send notification based on message type
    const shortMessage = message.length > 50 ? message.substring(0, 50) + "..." : message;

    console.log("\n[NOTIFICATION] Checking conditions...");
    console.log("[NOTIFICATION] parentId:", parentId);
    console.log("[NOTIFICATION] service.providerId:", service.providerId);
    console.log("[NOTIFICATION] userId:", userId);
    console.log("[NOTIFICATION] Is sender provider?", service.providerId === userId);

    if (!parentId) {
        // New message - notify provider (if sender is not provider)
        if (service.providerId !== userId) {
            console.log("[NOTIFICATION] ✅ Condition met: Sending to provider");
            console.log("[NOTIFICATION] Target userId:", service.providerId);
            console.log("[NOTIFICATION] Title: 💬 New Message");
            console.log("[NOTIFICATION] Message:", `${user.name}: "${shortMessage}"`);

            const result = await notificationService.createNotification(
                service.providerId,
                "MESSAGE_RECEIVED",
                "💬 New Message",
                `${user.name}: "${shortMessage}"`,
                {
                    type: "MESSAGE",
                    action: "view_conversation",
                    actionUrl: `/provider/services/${serviceId}/messages`,
                    serviceId: serviceId,
                    serviceName: service.listingHeadline,
                    messageId: serviceMessage.id,
                    senderId: userId,
                    senderName: user.name,
                    message: shortMessage,
                }
            );

            console.log("[NOTIFICATION] Result:", result ? "✅ Success" : "❌ Failed");
        } else {
            console.log("[NOTIFICATION] ❌ Skipping: Sender is the provider themselves");
        }
    } else {
        // Reply - notify original sender
        console.log("[NOTIFICATION] Processing reply...");

        const parentMessage = await prisma.serviceMessage.findUnique({
            where: { id: parentId },
            select: { senderId: true }
        });

        console.log("[NOTIFICATION] Parent senderId:", parentMessage?.senderId);
        console.log("[NOTIFICATION] Current userId:", userId);

        if (parentMessage && parentMessage.senderId !== userId) {
            console.log("[NOTIFICATION] ✅ Condition met: Sending reply notification to:", parentMessage.senderId);

            const result = await notificationService.createNotification(
                parentMessage.senderId,
                "MESSAGE_REPLY_RECEIVED",
                "💬 New Reply",
                `${user.name} replied: "${shortMessage}"`,
                {
                    type: "MESSAGE",
                    action: "view_conversation",
                    actionUrl: `/messages/${parentId}`,
                    serviceId: serviceId,
                    serviceName: service.listingHeadline,
                    messageId: serviceMessage.id,
                    parentId: parentId,
                    senderId: userId,
                    senderName: user.name,
                    reply: shortMessage,
                }
            );

            console.log("[NOTIFICATION] Reply notification result:", result ? "✅ Success" : "❌ Failed");
        } else {
            console.log("[NOTIFICATION] ❌ Skipping: Replying to own message");
        }
    }

    console.log("========== [MESSAGE] sendMessage Completed ==========\n");
    return serviceMessage;
}


export async function getServiceMessages(serviceId, userId, userRole) {
    // Check service exists
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: {
            id: true,
            listingHeadline: true,
            providerId: true,
            provider: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                }
            }
        }
    });

    if (!service) {
        throw { statusCode: 404, message: "Service not found" };
    }

    const isServiceOwner = service.providerId === userId;
    const isAdmin = userRole === "ADMIN";

    // Get all messages (root + replies) in chronological order
    let messages = await prisma.serviceMessage.findMany({
        where: {
            serviceId,
            ...(!isServiceOwner && !isAdmin ? { senderId: userId } : {})
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                }
            },
            replies: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            role: true,
                        }
                    }
                },
                orderBy: { createdAt: "asc" }
            }
        },
        orderBy: { createdAt: "asc" }
    });

    // Organize messages as thread
    const messageMap = new Map();
    const threads = [];

    // First, collect all root messages
    messages.forEach(msg => {
        if (!msg.parentId) {
            messageMap.set(msg.id, { ...msg, replies: [] });
            threads.push(messageMap.get(msg.id));
        }
    });

    // Then, add replies to their parents
    messages.forEach(msg => {
        if (msg.parentId && messageMap.has(msg.parentId)) {
            messageMap.get(msg.parentId).replies.push(msg);
        }
    });

    return {
        service,
        messages: threads,
        totalMessages: messages.length
    };
}

/**
 * Get single message with its thread
 */
export async function getMessageWithThread(messageId, userId, userRole) {
    const message = await prisma.serviceMessage.findUnique({
        where: { id: messageId },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                }
            },
            service: {
                select: {
                    id: true,
                    listingHeadline: true,
                    providerId: true,
                }
            },
            parent: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        }
                    }
                }
            },
            replies: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            role: true,
                        }
                    }
                },
                orderBy: { createdAt: "asc" }
            }
        }
    });

    if (!message) {
        throw { statusCode: 404, message: "Message not found" };
    }

    // Check authorization
    const isServiceOwner = message.service.providerId === userId;
    const isSender = message.senderId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isServiceOwner && !isSender && !isAdmin) {
        throw { statusCode: 403, message: "Not authorized" };
    }

    return message;
}

/**
 * Get all conversations for a user (across all services)
 */

export async function getUserConversations(userId, userRole) {
    // Get all messages grouped by service
    const messages = await prisma.serviceMessage.findMany({
        where: {
            OR: [
                { senderId: userId },
                ...(userRole === "PROVIDER" || userRole === "COACH" || userRole === "ADMIN"
                    ? [{ service: { providerId: userId } }]
                    : [])
            ]
        },
        include: {
            service: {
                select: {
                    id: true,
                    listingHeadline: true,
                    logo: true,
                    providerId: true,
                    provider: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        }
                    }
                }
            },
            sender: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    role: true,
                }
            },
            replies: {
                take: 1,
                orderBy: { createdAt: "desc" },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Group by service
    const conversations = new Map();

    messages.forEach(msg => {
        const serviceId = msg.service.id;
        if (!conversations.has(serviceId)) {
            const { service, ...messageWithoutService } = msg;

            conversations.set(serviceId, {
                service: msg.service,
                lastMessage: messageWithoutService,
                unreadCount: msg.replies.filter(r => !r.isRead && r.senderId !== userId).length,
                totalMessages: 0
            });
        }
        conversations.get(serviceId).totalMessages++;
    });

    return Array.from(conversations.values());
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId, userId, userRole) {
    const message = await prisma.serviceMessage.findUnique({
        where: { id: messageId },
        include: {
            service: { select: { providerId: true } }
        }
    });

    if (!message) {
        throw { statusCode: 404, message: "Message not found" };
    }

    const isOwner = message.service.providerId === userId;
    const isAuthor = message.senderId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAuthor && !isAdmin) {
        throw { statusCode: 403, message: "Cannot delete this message" };
    }

    // Delete message and its replies
    if (!message.parentId) {
        await prisma.serviceMessage.deleteMany({
            where: { parentId: messageId }
        });
    }

    await prisma.serviceMessage.delete({
        where: { id: messageId }
    });

    return { success: true, message: "Message deleted" };
}
/**
 * Get all messages for all services owned by a provider/coach
 */
export async function getAllServiceMessages(userId, userRole, query = {}) {
    console.log("\n========== [GET ALL SERVICE MESSAGES] Started ==========");
    console.log(`User: ${userId}, Role: ${userRole}`);

    const { page = 1, limit = 20, search, serviceId, status } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get user's services
    const userServices = await prisma.service.findMany({
        where: { providerId: userId },
        select: { id: true, listingHeadline: true, logo: true, status: true, isApproved: true }
    });

    const serviceIds = userServices.map(s => s.id);

    if (serviceIds.length === 0) {
        return {
            messages: [],
            services: [],
            summary: {
                totalServices: 0,
                totalMessages: 0,
                unreadMessages: 0,
                pendingReplies: 0,
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                totalPages: 0,
            },
        };
    }

    let where = {
        serviceId: { in: serviceIds },
        isReply: false, // Only get root messages (questions/conversations)
    };

    // Filter by specific service
    if (serviceId) {
        if (!serviceIds.includes(serviceId)) {
            throw { statusCode: 403, message: "You don't have access to this service" };
        }
        where.serviceId = serviceId;
    }

    // Search in messages
    if (search && search.trim()) {
        where.message = {
            contains: search.trim(),
            mode: 'insensitive',
        };
    }

    // Filter by status
    if (status === 'unread') {
        where.isRead = false;
    } else if (status === 'pending') {
        where.replies = { none: {} }; // No replies yet
    }

    // Get messages with pagination
    const messages = await prisma.serviceMessage.findMany({
        where,
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                }
            },
            service: {
                select: {
                    id: true,
                    listingHeadline: true,
                    logo: true,
                    status: true,
                    isApproved: true,
                }
            },
            replies: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            role: true,
                        }
                    }
                },
                orderBy: { createdAt: "asc" }
            }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
    });

    // Get total count
    const total = await prisma.serviceMessage.count({ where });

    // Calculate summary
    const allMessages = await prisma.serviceMessage.findMany({
        where: {
            serviceId: { in: serviceIds },
            isReply: false,
        },
        select: {
            id: true,
            isRead: true,
            replies: { select: { id: true } }
        }
    });

    const summary = {
        totalServices: userServices.length,
        totalMessages: allMessages.length,
        unreadMessages: allMessages.filter(m => !m.isRead).length,
        pendingReplies: allMessages.filter(m => m.replies.length === 0).length,
    };

    // Group messages by service
    const messagesByService = {};
    messages.forEach(message => {
        if (!messagesByService[message.serviceId]) {
            messagesByService[message.serviceId] = {
                service: message.service,
                messages: [],
                totalMessages: 0,
                unreadCount: 0,
            };
        }
        messagesByService[message.serviceId].messages.push(message);
        messagesByService[message.serviceId].totalMessages++;
        if (!message.isRead) {
            messagesByService[message.serviceId].unreadCount++;
        }
    });

    return {
        messages: messages,
        messagesByService: Object.values(messagesByService),
        services: userServices,
        summary,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
}