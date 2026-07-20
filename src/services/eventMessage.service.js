import prisma from "../config/database.js";
import * as notificationService from "./notification.service.js";

export async function postEventMessage(eventId, userId, message, parentId = null) {

  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  // If it's a reply, check if parent message exists
  if (parentId) {
    const parentMessage = await prisma.eventMessage.findUnique({
      where: { id: parentId },
    });

    if (!parentMessage) {
      throw { statusCode: 404, message: "Parent message not found" };
    }

    if (parentMessage.eventId !== eventId) {
      throw { statusCode: 400, message: "Parent message does not belong to this event" };
    }
  }

  // Check if user is associated with the event
  const isOrganizer = event.organizerId === userId;
  const registration = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  const isAdmin = user.role === "ADMIN";

  // if (!isOrganizer && !registration && !isAdmin && !parentId) {
  //   throw {
  //     statusCode: 403,
  //     message: "You must be registered for the event to post questions",
  //   };
  // }

  // Create message
  const eventMessage = await prisma.eventMessage.create({
    data: {
      eventId,
      userId,
      message: message.trim(),
      parentId,
      isReply: !!parentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  //  SEND NOTIFICATION - THIS WAS MISSING!
  const shortMessage = message.length > 50 ? message.substring(0, 50) + "..." : message;

  if (!parentId) {
    // New question - notify event organizer
    if (event.organizerId !== userId) {
      await notificationService.createNotification(
        event.organizerId,
        "EVENT_MESSAGE_RECEIVED",
        "❓ New Question on Your Event",
        `${user.name} asked: "${shortMessage}"`,
        {
          type: "EVENT_MESSAGE",
          action: "view_event_question",
          actionUrl: `/organizer/events/${eventId}/messages/${eventMessage.id}`,
          eventId: eventId,
          eventTitle: event.title,
          messageId: eventMessage.id,
          userId: userId,
          userName: user.name,
          message: shortMessage,
        }
      );
    }
  } else {
    // Reply - notify original question asker
    const parentMessage = await prisma.eventMessage.findUnique({
      where: { id: parentId },
      select: { userId: true, message: true }
    });

    if (parentMessage && parentMessage.userId !== userId) {
      await notificationService.createNotification(
        parentMessage.userId,
        "EVENT_MESSAGE_REPLY_RECEIVED",
        "Reply to Your Question",
        `${user.name} replied: "${shortMessage}"`,
        {
          type: "EVENT_MESSAGE",
          action: "view_event_reply",
          actionUrl: `/events/${eventId}/messages/${parentId}`,
          eventId: eventId,
          eventTitle: event.title,
          messageId: eventMessage.id,
          parentId: parentId,
          userId: userId,
          userName: user.name,
          reply: shortMessage,
        }
      );
    }
  }

  return eventMessage;
}

export async function getAllEventMessages(userId, userRole, query = {}) {

  const parsedPage = Math.max(parseInt(query.page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const { search, eventId } = query;

  const skip = (parsedPage - 1) * parsedLimit;
  const take = parsedLimit;

  // We paginate top-level questions only. Replies are nested under each question.
  const where = {
    isReply: false,
  };

  let userEventIds = null;

  if (userRole !== "ADMIN") {
    const userEvents = await prisma.event.findMany({
      where: { organizerId: userId },
      select: { id: true },
    });

    userEventIds = userEvents.map((event) => event.id);

    if (userEventIds.length === 0) {
      return {
        messagesByEvent: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    where.eventId = { in: userEventIds };
  }

  if (eventId) {
    if (userRole !== "ADMIN" && userEventIds && !userEventIds.includes(eventId)) {
      return {
        messagesByEvent: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    where.eventId = eventId;
  }

  if (search && search.trim()) {
    where.OR = [
      {
        message: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
      {
        replies: {
          some: {
            message: {
              contains: search.trim(),
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const questions = await prisma.eventMessage.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          organizerId: true,
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          status: true,
          eventType: true,
          sportType: true,
          startDate: true,
          endDate: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const total = await prisma.eventMessage.count({ where });

  const grouped = {};

  for (const question of questions) {
    const normalizedReplies = question.replies.map((reply) => ({
      id: reply.id,
      eventId: reply.eventId,
      userId: reply.userId,
      message: reply.message,
      parentId: reply.parentId,
      isReply: reply.isReply,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      user: reply.user,
    }));

    const normalizedQuestion = {
      id: question.id,
      eventId: question.eventId,
      userId: question.userId,
      message: question.message,
      parentId: question.parentId,
      isReply: question.isReply,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      user: question.user,
      replies: normalizedReplies,
    };

    if (!grouped[question.eventId]) {
      grouped[question.eventId] = {
        event: question.event,
        totalQuestions: 0,
        totalReplies: 0,
        latestMessageAt: question.createdAt,
        messages: [],
      };
    }

    grouped[question.eventId].messages.push(normalizedQuestion);
    grouped[question.eventId].totalQuestions += 1;
    grouped[question.eventId].totalReplies += normalizedReplies.length;

    const currentLatest = grouped[question.eventId].latestMessageAt;
    const latestReplyAt = normalizedReplies.length
      ? normalizedReplies[normalizedReplies.length - 1].createdAt
      : null;
    const candidateLatest =
      latestReplyAt && latestReplyAt > question.createdAt
        ? latestReplyAt
        : question.createdAt;

    if (!currentLatest || candidateLatest > currentLatest) {
      grouped[question.eventId].latestMessageAt = candidateLatest;
    }
  }

  const events = Object.values(grouped).sort(
    (a, b) => new Date(b.latestMessageAt) - new Date(a.latestMessageAt)
  );

  return {
    messagesByEvent: events,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

/**
 * Get event messages for a user's dashboard
 * Shows messages from events the user is registered for or interested in
 */
export async function getUserDashboardMessages(userId, query = {}) {
  console.log("\n========== [GET USER DASHBOARD MESSAGES] Started ==========");
  console.log("User ID:", userId);

  const parsedPage = Math.max(parseInt(query.page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;
  const take = parsedLimit;


  const userEvents = await prisma.event.findMany({
    where: {
      OR: [

        { organizerId: userId },

        {
          messages: {
            some: {
              userId: userId
            }
          }
        },

        {
          messages: {
            some: {
              replies: {
                some: {}
              }
            }
          }
        }
      ]
    },
    select: { id: true }
  });

  const userEventIds = userEvents.map(e => e.id);

  console.log("User event IDs found:", userEventIds.length);

  if (userEventIds.length === 0) {
    return {
      messages: [],
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Get all messages for these events
  const messages = await prisma.eventMessage.findMany({
    where: {
      eventId: { in: userEventIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          organizerId: true,
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const total = await prisma.eventMessage.count({
    where: {
      eventId: { in: userEventIds },
    },
  });

  console.log("Messages found:", messages.length);

  return {
    messages,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

export async function getEventMessageWithThread(messageId, userId, userRole) {
  console.log("\n========== [GET EVENT MESSAGE THREAD] Started ==========");

  // Get the message with its event
  const message = await prisma.eventMessage.findUnique({
    where: { id: messageId },
    include: {
      event: {
        select: {
          id: true,
          organizerId: true,
          title: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      parent: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!message) {
    throw { statusCode: 404, message: "Message not found" };
  }

  // Check authorization
  const isOrganizer = message.event.organizerId === userId;
  const isAdmin = userRole === "ADMIN";
  const isMessageAuthor = message.userId === userId;

  // Organizer, admin, or the message author can view the message thread
  if (!isOrganizer && !isAdmin && !isMessageAuthor) {
    throw {
      statusCode: 403,
      message: "You are not authorized to view this message",
    };
  }

  return message;
}

export async function getEventMessages(eventId, userId, userRole) {

  // Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      organizerId: true,
      title: true,
      status: true,
    },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  // Check authorization
  const isOrganizer = event.organizerId === userId;
  const isAdmin = userRole === "ADMIN";

  // Only organizer or admin can view event messages
  if (!isOrganizer && !isAdmin) {
    throw {
      statusCode: 403,
      message: "You are not authorized to view messages for this event",
    };
  }

  // Get all messages for this event (questions that are not replies)
  const messages = await prisma.eventMessage.findMany({
    where: {
      eventId: eventId,
      isReply: false, // Only get top-level questions
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    eventId: event.id,
    eventTitle: event.title,
    totalQuestions: messages.length,
    messages: messages,
  };
}

export async function deleteEventMessage(messageId, userId, userRole) {
  console.log("\n========== [DELETE EVENT MESSAGE] Started ==========");

  // Get the message with its event
  const message = await prisma.eventMessage.findUnique({
    where: { id: messageId },
    include: {
      event: {
        select: {
          id: true,
          organizerId: true,
          title: true,
        },
      },
    },
  });

  if (!message) {
    throw { statusCode: 404, message: "Message not found" };
  }

  // Check authorization
  const isOrganizer = message.event.organizerId === userId;
  const isAdmin = userRole === "ADMIN";
  const isMessageAuthor = message.userId === userId;

  // Only organizer, admin, or the message author can delete the message
  if (!isOrganizer && !isAdmin && !isMessageAuthor) {
    throw {
      statusCode: 403,
      message: "You are not authorized to delete this message",
    };
  }

  // If this is not a reply (it's a question), delete all its replies first
  if (!message.isReply) {
    await prisma.eventMessage.deleteMany({
      where: { parentId: messageId },
    });
  }

  // Delete the message
  await prisma.eventMessage.delete({
    where: { id: messageId },
  });

  return {
    success: true,
    message: "Message deleted successfully",
    deletedMessageId: messageId,
  };
}