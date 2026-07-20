import prisma from "../config/database.js";

export async function getAllInquiries(userId, userRole, query = {}) {
  console.log("\n========== [GET ALL INQUIRIES] Started ==========");
  console.log(`User: ${userId}, Role: ${userRole}`);

  const { page = 1, limit = 20, search, type, status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get user's services
  const userServices = await prisma.service.findMany({
    where: { providerId: userId },
    select: { id: true, listingHeadline: true, status: true, isApproved: true }
  });

  // Get user's events
  const userEvents = await prisma.event.findMany({
    where: { organizerId: userId },
    select: { id: true, title: true, status: true, isApproved: true }
  });

  const serviceIds = userServices.map(s => s.id);
  const eventIds = userEvents.map(e => e.id);

  if (serviceIds.length === 0 && eventIds.length === 0) {
    return {
      inquiries: [],
      summary: {
        totalServices: 0,
        totalEvents: 0,
        totalServiceMessages: 0,
        totalEventMessages: 0,
        unreadServiceMessages: 0,
        unreadEventMessages: 0,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Prepare queries for both types
  let serviceMessagesQuery = {};
  let eventMessagesQuery = {};

  // Service messages query
  if (serviceIds.length > 0 && (!type || type === 'service')) {
    serviceMessagesQuery = {
      where: {
        serviceId: { in: serviceIds },
        ...(search && {
          message: { contains: search, mode: 'insensitive' }
        })
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
      orderBy: { createdAt: "desc" }
    };
  }

  // Event messages query
  if (eventIds.length > 0 && (!type || type === 'event')) {
    eventMessagesQuery = {
      where: {
        eventId: { in: eventIds },
        ...(search && {
          message: { contains: search, mode: 'insensitive' }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            status: true,
            isApproved: true,
            eventType: true,
            sportType: true,
          }
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
              }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    };
  }

  // Execute both queries in parallel
  const [serviceMessages, eventMessages] = await Promise.all([
    serviceIds.length > 0 && (!type || type === 'service') 
      ? prisma.serviceMessage.findMany(serviceMessagesQuery)
      : Promise.resolve([]),
    eventIds.length > 0 && (!type || type === 'event')
      ? prisma.eventMessage.findMany(eventMessagesQuery)
      : Promise.resolve([])
  ]);

  // Format and combine messages
  const formattedServiceMessages = serviceMessages.map(msg => ({
    id: msg.id,
    type: 'service',
    message: msg.message,
    isReply: msg.isReply,
    parentId: msg.parentId,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    sender: msg.sender,
    service: msg.service,
    event: null,
    replies: msg.replies,
    replyCount: msg.replies.length,
    isRead: msg.isRead || false,
  }));

  const formattedEventMessages = eventMessages.map(msg => ({
    id: msg.id,
    type: 'event',
    message: msg.message,
    isReply: msg.isReply,
    parentId: msg.parentId,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    sender: msg.user,
    service: null,
    event: msg.event,
    replies: msg.replies,
    replyCount: msg.replies.length,
    isRead: false, // Event messages don't have isRead field
  }));

  // Combine and sort by createdAt
  let allInquiries = [...formattedServiceMessages, ...formattedEventMessages];
  
  // Filter by status if needed
  if (status === 'unread') {
    allInquiries = allInquiries.filter(inq => !inq.isRead && inq.type === 'service');
  } else if (status === 'replied') {
    allInquiries = allInquiries.filter(inq => inq.replyCount > 0);
  } else if (status === 'pending') {
    allInquiries = allInquiries.filter(inq => inq.replyCount === 0 && !inq.isReply);
  }

  // Sort by createdAt descending
  allInquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Get total count
  const total = allInquiries.length;

  // Apply pagination
  const paginatedInquiries = allInquiries.slice(skip, skip + take);

  // Calculate summary statistics
  const summary = {
    totalServices: userServices.length,
    totalEvents: userEvents.length,
    totalServiceMessages: serviceMessages.length,
    totalEventMessages: eventMessages.length,
    unreadServiceMessages: serviceMessages.filter(m => !m.isRead).length,
    unreadEventMessages: 0,
    totalInquiries: total,
    unreadInquiries: serviceMessages.filter(m => !m.isRead).length,
    pendingReplies: allInquiries.filter(i => i.replyCount === 0 && !i.isReply).length,
  };

  // Group by service/event
  const groupedByItem = {};
  
  paginatedInquiries.forEach(inquiry => {
    const key = inquiry.type === 'service' 
      ? `service_${inquiry.service.id}` 
      : `event_${inquiry.event.id}`;
    
    if (!groupedByItem[key]) {
      groupedByItem[key] = {
        type: inquiry.type,
        item: inquiry.type === 'service' ? inquiry.service : inquiry.event,
        inquiries: [],
        totalInquiries: 0,
        unreadCount: 0,
      };
    }
    
    groupedByItem[key].inquiries.push(inquiry);
    groupedByItem[key].totalInquiries++;
    if (!inquiry.isRead && inquiry.type === 'service') {
      groupedByItem[key].unreadCount++;
    }
  });

  return {
    inquiries: paginatedInquiries,
    groupedByItem: Object.values(groupedByItem),
    summary,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export async function getInquiryById(inquiryId, type, userId, userRole) {
  console.log("\n========== [GET INQUIRY BY ID] Started ==========");
  console.log(`Inquiry ID: ${inquiryId}, Type: ${type}, User: ${userId}`);

  if (type === 'service') {
    const message = await prisma.serviceMessage.findUnique({
      where: { id: inquiryId },
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
            providerId: true,
            status: true,
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
        }
      }
    });

    if (!message) {
      throw { statusCode: 404, message: "Inquiry not found" };
    }

    // Check authorization
    const isServiceOwner = message.service.providerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isServiceOwner && !isAdmin) {
      throw { statusCode: 403, message: "Not authorized to view this inquiry" };
    }

    // Mark as read
    if (!message.isRead && message.senderId !== userId) {
      await prisma.serviceMessage.update({
        where: { id: inquiryId },
        data: { isRead: true }
      });
      message.isRead = true;
    }

    return {
      type: 'service',
      ...message,
    };
  } 
  
  else if (type === 'event') {
    const message = await prisma.eventMessage.findUnique({
      where: { id: inquiryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            image: true,
            organizerId: true,
            status: true,
          }
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
              }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        }
      }
    });

    if (!message) {
      throw { statusCode: 404, message: "Inquiry not found" };
    }

    // Check authorization
    const isEventOwner = message.event.organizerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isEventOwner && !isAdmin) {
      throw { statusCode: 403, message: "Not authorized to view this inquiry" };
    }

    return {
      type: 'event',
      ...message,
    };
  }

  throw { statusCode: 400, message: "Invalid inquiry type. Use 'service' or 'event'" };
}

