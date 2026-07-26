import prisma from "../config/database.js";
import { config } from "../config/index.js";
import PrismaQueryBuilder from "../shared/query-builder.js";
import * as notificationService from "./notification.service.js";


function generateBookingLink(eventId) {
  return `${config.frontendUrl}/events/${eventId}`;
}

function isValidDate(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return !Number.isNaN(date.getTime());
}

function normalizeEnumValue(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : value;
}

function buildDateRangeForFilter(dateFilter, now) {
  const normalized = (dateFilter || "").toLowerCase();

  if (normalized === "upcoming") {
    return {
      startDate: {
        gt: now,
      },
    };
  }

  if (normalized === "thisweek") {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      startDate: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    };
  }

  if (normalized === "thismonth") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return {
      startDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };
  }

  return null;
}

function buildViewCondition(view, now, includeLiveRules) {
  switch ((view || "").toLowerCase()) {
    case "live":
      if (!includeLiveRules) {
        return { status: "ONGOING" };
      }

      return {
        OR: [
          {
            status: "ONGOING",
          },
          {
            AND: [
              { isApproved: true },
              { status: { in: ["APPROVED", "UPCOMING"] } },
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
        ],
      };

    case "upcoming":
      if (!includeLiveRules) {
        return { status: "UPCOMING" };
      }

      return {
        OR: [
          {
            status: "UPCOMING",
          },
          {
            AND: [
              { isApproved: true },
              { status: "APPROVED" },
              { startDate: { gt: now } },
            ],
          },
        ],
      };

    case "completed":
      if (!includeLiveRules) {
        return { status: "COMPLETED" };
      }

      return {
        OR: [
          {
            status: "COMPLETED",
          },
          {
            AND: [
              { status: { in: ["ONGOING", "UPCOMING", "APPROVED"] } },
              { endDate: { lt: now } },
            ],
          },
        ],
      };

    case "pending":
      return { status: "PENDING" };

    case "approved":
      return { status: "APPROVED" };

    case "cancelled":
      return { status: "CANCELLED" };

    default:
      return null;
  }
}

function applyCommonEventFilters(
  builder,
  query = {},
  { includeLiveRules = false } = {}
) {
  const andConditions = [];
  const now = new Date();

  if (query.status) {
    builder._where.status = normalizeEnumValue(query.status);
  }

  if (query.eventType) {
    builder._where.eventType = normalizeEnumValue(query.eventType);
  }

  if (query.city) {
    builder._where.city = {
      contains: query.city,
      mode: "insensitive",
    };
  }

  if (query.sportType) {
    builder._where.sportType = {
      contains: query.sportType,
      mode: "insensitive",
    };
  }

  if (query.skillLevel) {
    builder._where.skillLevel = normalizeEnumValue(query.skillLevel);
  }

  if (query.organizerRole) {
    builder._where.organizer = {
      role: normalizeEnumValue(query.organizerRole),
    };
  }

  const startDateRange = {};

  if (isValidDate(query.dateFrom)) {
    startDateRange.gte = new Date(query.dateFrom);
  }

  if (isValidDate(query.dateTo)) {
    startDateRange.lte = new Date(query.dateTo);
  }

  if (Object.keys(startDateRange).length > 0) {
    andConditions.push({
      startDate: startDateRange,
    });
  }

  if (query.dateFilter) {
    const dateFilterCondition = buildDateRangeForFilter(query.dateFilter, now);

    if (dateFilterCondition) {
      andConditions.push(dateFilterCondition);
    }
  }

  const viewCondition = buildViewCondition(query.view, now, includeLiveRules);
  if (viewCondition) {
    andConditions.push(viewCondition);
  }

  if (andConditions.length) {
    builder._where.AND = [
      ...(builder._where.AND || []),
      ...andConditions,
    ];
  }
}

export async function getAllEvents(query = {}, userRole = null, userId = null) {
  const builder = new PrismaQueryBuilder(prisma.event, query, {
    searchableFields: [
      "title",
      "description",
      "sportType",
      "city",
      "venueName",
    ],
    defaultSort: {
      isFeatured: "desc",
      featuredAt: "desc",
      createdAt: "desc",
    },
    defaultLimit: 12,
    maxLimit: 50,
    populateRelations: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  builder.search().sort().paginate().include();
  applyCommonEventFilters(builder, query, { includeLiveRules: true });

  if (userRole !== "ADMIN") {
    const publicVisibilityCondition = {
      isApproved: true,
      status: {
        in: ["APPROVED", "UPCOMING", "ONGOING", "COMPLETED"],
      },
    };

    const visibilityCondition = userId
      ? {
        OR: [
          publicVisibilityCondition,
          {
            organizerId: userId,
          },
        ],
      }
      : publicVisibilityCondition;

    builder._where.AND = [...(builder._where.AND || []), visibilityCondition];
  }

  const result = await builder.execute("events");

  result.events = result.events.map((event) => ({
    ...event,
    bookingLink: generateBookingLink(event.id),
  }));

  return result;
}



export async function getEventById(eventId, userId, userRole) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      registrations: userRole === "ADMIN" || userId
        ? {
          take: userRole !== "ADMIN" ? 5 : undefined,
          orderBy: { createdAt: "desc" },
        }
        : false,
      _count: {
        select: {
          registrations: true,
          savedBy: true,
          messages: true,
        },
      },
      analytics: true,
      messages: {
        where: {
          isReply: false,
        },
        orderBy: {
          createdAt: "desc",
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
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  // ✅ View track করো (প্রতিবার page visit এ)
  await trackEventView(eventId);

  // ✅ Logged-in user হলে check করো সে এই event save করেছে কিনা
  let isSaved = false;
  let isRegistered = false;
  let isInterested = false;
  let userRegistration = null;

  if (userId) {
    const savedEvent = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
    isSaved = !!savedEvent;

    // ✅ Check if user already registered
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId,
        status: { not: "interested" },
      },
    });

    if (existingRegistration) {
      isRegistered = true;
      userRegistration = {
        id: existingRegistration.id,
        status: existingRegistration.status,
        paymentStatus: existingRegistration.paymentStatus,
      };
    }

    // ✅ Check if user already expressed interest
    const existingInterest = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId,
        status: "interested",
      },
    });

    if (existingInterest) {
      isInterested = true;
    }
  }

  // ✅ Booking link যোগ করো
  const eventWithExtras = {
    ...event,
    bookingLink: generateBookingLink(event.id),
    isSaved,
    isRegistered,
    isInterested,
    userRegistration,
    savesCount: event._count?.savedBy || 0,
  };

  return eventWithExtras;
}

export async function createEvent(eventData, organizerId) {
  try {
    const preparedData = { ...eventData };

    delete preparedData.organizerId;
    delete preparedData.organizer;

    const arrayFields = ["responseMethods", "suitableFor"];
    arrayFields.forEach((field) => {
      if (preparedData[field] && typeof preparedData[field] === "string") {
        if (preparedData[field].startsWith("[")) {
          try {
            preparedData[field] = JSON.parse(preparedData[field]);
          } catch (e) {
            preparedData[field] = preparedData[field]
              .split(",")
              .map((s) => s.trim());
          }
        } else if (preparedData[field].includes(",")) {
          preparedData[field] = preparedData[field]
            .split(",")
            .map((s) => s.trim());
        } else {
          preparedData[field] = [preparedData[field]];
        }
      }
    });

    const numericFields = [
      "minAge",
      "maxParticipants",
      "currentParticipants",
      "registrationFee",
    ];
    numericFields.forEach((field) => {
      if (
        preparedData[field] !== undefined &&
        preparedData[field] !== null &&
        preparedData[field] !== ""
      ) {
        const num = Number(preparedData[field]);
        if (!isNaN(num)) {
          preparedData[field] =
            field === "registrationFee" ? num : num > 0 ? num : null;
        } else {
          delete preparedData[field];
        }
      }
    });

    if (
      preparedData.startDate &&
      !(preparedData.startDate instanceof Date)
    ) {
      preparedData.startDate = new Date(preparedData.startDate);
    }
    if (preparedData.endDate && !(preparedData.endDate instanceof Date)) {
      preparedData.endDate = new Date(preparedData.endDate);
    }

    if (preparedData.costType === "free") {
      preparedData.registrationFee = 0;
    }

    if (!preparedData.currentParticipants) {
      preparedData.currentParticipants = 0;
    }

    const event = await prisma.event.create({
      data: {
        ...preparedData,
        organizer: {
          connect: { id: organizerId },
        },
        status: "PENDING",
        isApproved: false,
      },
      include: {
        organizer: {
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

    const eventWithBookingLink = {
      ...event,
      bookingLink: generateBookingLink(event.id),
    };

    return eventWithBookingLink;
  } catch (error) {
    console.error("Error creating event:", error);
    throw {
      statusCode: 400,
      message: `Failed to create event: ${error.message}`,
    };
  }
}



export async function updateEvent(eventId, updateData, userId, userRole) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (userRole !== "ADMIN" && event.organizerId !== userId) {
    throw { statusCode: 403, message: "Not authorized to update this event" };
  }

  const data = { ...updateData };

  // Handle array fields
  const arrayFields = ["responseMethods", "suitableFor"];
  arrayFields.forEach(field => {
    if (data[field] !== undefined) {
      if (typeof data[field] === "string") {
        if (data[field].startsWith("[")) {
          try {
            data[field] = JSON.parse(data[field]);
          } catch (e) {
            data[field] = data[field]
              .split(",")
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
        } else if (data[field].includes(",")) {
          data[field] = data[field]
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0);
        } else {
          data[field] = [data[field]];
        }
      } else if (!Array.isArray(data[field])) {
        delete data[field];
      }
    }
  });

  // Handle numeric fields
  const numericFields = ["minAge", "maxParticipants", "currentParticipants", "registrationFee"];
  numericFields.forEach(field => {
    if (data[field] !== undefined) {
      if (data[field] === null || data[field] === "" || data[field] === "null") {
        data[field] = null;
      } else {
        const num = Number(data[field]);
        if (!isNaN(num)) {
          data[field] = num;
        } else {
          delete data[field];
        }
      }
    }
  });

  // Handle date fields
  if (data.startDate && !(data.startDate instanceof Date)) {
    data.startDate = new Date(data.startDate);
  }
  if (data.endDate && !(data.endDate instanceof Date)) {
    data.endDate = new Date(data.endDate);
  }

  // If not admin and event is approved, set back to pending
  if (userRole !== "ADMIN" && event.isApproved) {
    data.status = "PENDING";
    data.isApproved = false;
  }

  // Remove undefined values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: data,
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      registrations: {
        select: {
          id: true,
          userId: true,
          status: true,
        },
      },
      analytics: true,
    },
  });

  return updatedEvent;
}


export async function deleteEvent(eventId, userId, userRole) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (userRole !== "ADMIN" && event.organizerId !== userId) {
    throw { statusCode: 403, message: "Not authorized to delete this event" };
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  return true;
}

export async function approveEvent(eventId) {
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

  if (event.isApproved) {
    throw { statusCode: 400, message: "Event is already approved" };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "APPROVED",
      isApproved: true,
      rejectionReason: null,
    },
  });

  await createEventAnalytics(eventId);

  await notificationService.createNotification(
    event.organizerId,
    "EVENT_APPROVED",
    "✅ Event Approved",
    `Your event "${event.title}" has been approved and is now live!`,
    {
      type: "EVENT",
      action: "view_event",
      actionUrl: `/organizer/events/${eventId}`,
      eventId: eventId,
      eventTitle: event.title,
    }
  );

  return updatedEvent;
}

export async function rejectEvent(eventId, rejectionReason = null) {
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

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "REJECTED",
      isApproved: false,
      rejectionReason,
    },
  });

  await notificationService.createNotification(
    event.organizerId,
    "EVENT_REJECTED",
    "❌ Event Rejected",
    `Your event "${event.title}" was rejected. Reason: ${rejectionReason || "Not specified"}`,
    {
      type: "EVENT",
      action: "edit_event",
      actionUrl: `/organizer/events/${eventId}/edit`,
      eventId: eventId,
      eventTitle: event.title,
      reason: rejectionReason,
    }
  );

  return updatedEvent;
}

export async function registerForEvent(eventId, registrationData) {
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

  const now = new Date();
  const eventEndDate = new Date(event.endDate);

  if (event.endTime) {
    const timeParts = event.endTime.split(":");
    eventEndDate.setHours(
      parseInt(timeParts[0]) || 23,
      parseInt(timeParts[1]) || 59,
      parseInt(timeParts[2]) || 59
    );
  } else {
    eventEndDate.setHours(23, 59, 59);
  }

  if (now > eventEndDate) {
    throw {
      statusCode: 400,
      message: "Event registration closed - event has ended",
    };
  }

  if (event.status === "BANNED" || event.status === "CANCELLED") {
    throw {
      statusCode: 400,
      message: `Event is ${event.status.toLowerCase()} and not accepting registrations`,
    };
  }

  if (
    event.maxParticipants &&
    event.currentParticipants >= event.maxParticipants
  ) {
    throw { statusCode: 400, message: "Event is full" };
  }

  if (registrationData.userId) {
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        userId: registrationData.userId,
        status: { not: "interested" },
      },
    });

    if (existingRegistration) {
      throw {
        statusCode: 409,
        message: "Already registered for this event",
      };
    }
  }

  const [registration] = await prisma.$transaction([
    prisma.eventRegistration.create({
      data: {
        ...registrationData,
        eventId,
        status: "confirmed",
      },
      include: {
        user: registrationData.userId
          ? {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          }
          : undefined,
      },
    }),
    prisma.event.update({
      where: { id: eventId },
      data: {
        currentParticipants: {
          increment: 1,
        },
      },
    }),
  ]);

  await trackEventRegistration(eventId);

  const userName =
    registrationData.fullName || registrationData.user?.name || "Someone";

  await notificationService.createNotification(
    event.organizerId,
    "EVENT_REGISTRATION",
    " New Event Registration",
    `${userName} registered for "${event.title}"`,
    {
      type: "EVENT",
      action: "view_registrations",
      actionUrl: `/organizer/events/${eventId}/registrations`,
      eventId: eventId,
      eventTitle: event.title,
      registrationId: registration.id,
      userName: userName,
    }
  );

  return registration;
}

export async function registerInterest(eventId, userId) {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  const existingInterest = await prisma.eventRegistration.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  if (existingInterest) {
    throw {
      statusCode: 409,
      message: "You have already registered interest for this event",
    };
  }

  const interest = await prisma.eventRegistration.create({
    data: {
      eventId,
      userId: user.id,
      fullName: user.name,
      email: user.email,
      phoneNumber: user.phone || "Not provided",
      notes: "Automatic interest registration",
      status: "interested",
      paymentStatus: "not_applicable",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
        },
      },
    },
  });

  await notificationService.createNotification(
    event.organizerId,
    "INTEREST_RECEIVED",
    "🎯 New Event Interest",
    `${user.name} is interested in "${event.title}"`,
    {
      type: "EVENT",
      action: "view_interests",
      actionUrl: `/organizer/events/${eventId}/interests`,
      eventId: eventId,
      eventTitle: event.title,
      interestId: interest.id,
      userId: userId,
      userName: user.name,
    }
  );

  return interest;
}

export async function updateRegistrationStatus(
  registrationId,
  status,
  userId,
  userRole
) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!registration) {
    throw { statusCode: 404, message: "Registration not found" };
  }

  if (
    userRole !== "ADMIN" &&
    registration.event.organizerId !== userId
  ) {
    throw {
      statusCode: 403,
      message: "Not authorized to update registration",
    };
  }

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status },
  });

  if (registration.userId && status !== registration.status) {
    let title, message;

    switch (status) {
      case "confirmed":
        title = "✅ Registration Confirmed";
        message = `Your registration for "${registration.event.title}" has been confirmed!`;
        break;
      case "cancelled":
        title = "❌ Registration Cancelled";
        message = `Your registration for "${registration.event.title}" has been cancelled.`;
        break;
      case "rejected":
        title = "⚠️ Registration Rejected";
        message = `Your registration for "${registration.event.title}" was not approved.`;
        break;
      default:
        title = "Registration Updated";
        message = `Your registration for "${registration.event.title}" status changed to ${status}`;
    }

    await notificationService.createNotification(
      registration.userId,
      "EVENT_REGISTRATION",
      title,
      message,
      {
        type: "EVENT",
        action: "view_registration",
        actionUrl: `/my-events/registrations/${registrationId}`,
        eventId: registration.event.id,
        eventTitle: registration.event.title,
        registrationId: registrationId,
        status: status,
      }
    );
  }

  return updatedRegistration;
}

export async function toggleFeatureEvent(eventId, adminId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (event.isFeatured) {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        isFeatured: false,
        featuredAt: null,
        featuredBy: null,
      },
      include: {
        organizer: {
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

    return updatedEvent;
  }

  if (event.status === "BANNED") {
    throw { statusCode: 400, message: "Cannot feature a banned event" };
  }

  if (event.status === "REJECTED") {
    throw { statusCode: 400, message: "Cannot feature a rejected event" };
  }

  if (event.status === "PENDING") {
    throw {
      statusCode: 400,
      message: "Event must be approved before featuring",
    };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      isFeatured: true,
      featuredAt: new Date(),
      featuredBy: adminId,
    },
    include: {
      organizer: {
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

  await notificationService.createNotification(
    event.organizerId,
    "SERVICE_FEATURED",
    "⭐ Event Featured",
    `Your event "${event.title}" has been featured on the platform!`,
    {
      type: "EVENT",
      action: "view_event",
      actionUrl: `/organizer/events/${eventId}`,
      eventId: eventId,
      eventTitle: event.title,
    }
  );

  return updatedEvent;
}

export async function toggleBanEvent(eventId, bannedReason, adminId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (event.status === "BANNED") {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: "PENDING",
        bannedReason: null,
        bannedAt: null,
      },
      include: {
        organizer: {
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

    await notificationService.createNotification(
      event.organizerId,
      "SERVICE_BANNED",
      "🔓 Event Unbanned",
      `Your event "${event.title}" has been unbanned. It will need to be approved again.`,
      {
        type: "EVENT",
        action: "view_event",
        actionUrl: `/organizer/events/${eventId}`,
        eventId: eventId,
        eventTitle: event.title,
      }
    );

    return updatedEvent;
  }

  if (!bannedReason || bannedReason.trim() === "") {
    throw { statusCode: 400, message: "Ban reason is required" };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "BANNED",
      bannedReason,
      bannedAt: new Date(),
      isFeatured: false,
      featuredAt: null,
      featuredBy: null,
    },
    include: {
      organizer: {
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

  await notificationService.createNotification(
    event.organizerId,
    "SERVICE_BANNED",
    "⛔ Event Banned",
    `Your event "${event.title}" has been banned. Reason: ${bannedReason}`,
    {
      type: "EVENT",
      action: "contact_support",
      actionUrl: `/organizer/events/${eventId}`,
      eventId: eventId,
      eventTitle: event.title,
      reason: bannedReason,
    }
  );

  return updatedEvent;
}

export async function getEventRegistrations(eventId, userId, userRole) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (userRole !== "ADMIN" && event.organizerId !== userId) {
    throw {
      statusCode: 403,
      message: "Not authorized to view registrations",
    };
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      status: { not: "interested" },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return registrations;
}

export async function getEventInterests(eventId, userId, userRole) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (userRole !== "ADMIN" && event.organizerId !== userId) {
    throw {
      statusCode: 403,
      message: "Not authorized to view event interests",
    };
  }

  const interests = await prisma.eventRegistration.findMany({
    where: {
      eventId,
      status: "interested",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return interests;
}

export async function createEventAnalytics(eventId) {
  const existingAnalytics = await prisma.eventAnalytics.findFirst({
    where: { eventId },
  });

  if (existingAnalytics) {
    return existingAnalytics;
  }

  const analytics = await prisma.eventAnalytics.create({
    data: {
      eventId,
      views: 0,
      registrations: 0,
      completionRate: 0,
      revenue: 0,
    },
  });

  return analytics;
}

export async function trackEventView(eventId) {
  let analytics = await prisma.eventAnalytics.findFirst({
    where: { eventId },
  });

  if (!analytics) {
    analytics = await createEventAnalytics(eventId);
  }

  await prisma.eventAnalytics.update({
    where: { id: analytics.id },
    data: {
      views: {
        increment: 1,
      },
    },
  });
}

export async function trackEventRegistration(eventId) {
  let analytics = await prisma.eventAnalytics.findFirst({
    where: { eventId },
  });

  if (!analytics) {
    analytics = await createEventAnalytics(eventId);
  }

  await prisma.eventAnalytics.update({
    where: { id: analytics.id },
    data: {
      registrations: {
        increment: 1,
      },
    },
  });
}

export async function updateEventRevenue(eventId, amount) {
  let analytics = await prisma.eventAnalytics.findFirst({
    where: { eventId },
  });

  if (!analytics) {
    analytics = await createEventAnalytics(eventId);
  }

  await prisma.eventAnalytics.update({
    where: { id: analytics.id },
    data: {
      revenue: {
        increment: amount,
      },
    },
  });
}

export async function getEventAnalytics(filters = {}) {
  const { eventId, startDate, endDate } = filters;

  const where = {};

  if (eventId) {
    where.eventId = eventId;
  }

  const approvedEvents = await prisma.event.findMany({
    where: {
      isApproved: true,
      status: "APPROVED",
    },
    select: { id: true },
  });

  for (const event of approvedEvents) {
    await createEventAnalytics(event.id);
  }

  const analytics = await prisma.eventAnalytics.findMany({
    where,
    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventType: true,
          sportType: true,
          status: true,
          startDate: true,
          endDate: true,
          city: true,
          image: true,
        },
      },
    },
    orderBy: { views: "desc" },
  });

  return analytics;
}

export async function getOrganizerDashboard(organizerId) {
  const events = await prisma.event.findMany({
    where: { organizerId },
    include: {
      analytics: true,
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  const metrics = {
    totalEvents: events.length,
    approvedEvents: events.filter((e) => e.isApproved).length,
    pendingEvents: events.filter((e) => e.status === "PENDING")
      .length,
    rejectedEvents: events.filter((e) => e.status === "REJECTED").length,
    totalViews: events.reduce(
      (sum, e) => sum + (e.analytics[0]?.views || 0),
      0
    ),
    totalRegistrations: events.reduce(
      (sum, e) => sum + (e.analytics[0]?.registrations || 0),
      0
    ),
    totalRevenue: events.reduce(
      (sum, e) => sum + parseFloat(e.analytics[0]?.revenue || 0),
      0
    ),
  };

  const recentRegistrations = await prisma.eventRegistration.findMany({
    where: {
      event: {
        organizerId,
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventType: true,
          sportType: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    metrics,
    events,
    recentRegistrations,
  };
}

export async function getEventsByOrganizer(organizerId, filters = {}) {
  const queryBuilder = new PrismaQueryBuilder(
    prisma.event,
    {
      ...filters,
      organizerId,
    },
    {
      searchableFields: [
        "title",
        "description",
        "venueName",
        "city",
        "sportType",
      ],
      defaultSort: { createdAt: "desc" },
      defaultLimit: 10,
      maxLimit: 100,
      populateRelations: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            status: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
              },
            },
          },
          orderBy: {
            registeredAt: "desc",
          },
        },
        analytics: true,
        messages: {
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    }
  );

  queryBuilder._where.organizerId = organizerId;

  queryBuilder.search().sort().paginate().fields().include();
  applyCommonEventFilters(queryBuilder, filters, { includeLiveRules: true });

  const result = await queryBuilder.execute("events");

  // ✅ Add this mapping to include bookingLink
  const eventsWithBookingLink = result.events.map((event) => ({
    ...event,
    bookingLink: generateBookingLink(event.id),
  }));

  return {
    events: eventsWithBookingLink,
    meta: {
      total: result.meta.total,
      page: result.meta.page,
      limit: result.meta.limit,
      totalPages: result.meta.totalPage,
    },
  };
}

export async function getUserInterestedEvents(userId, filters = {}) {
  const where = {
    userId: userId,
    status: "interested",
  };

  if (filters.eventStatus) {
    where.event = {
      status: filters.eventStatus,
    };
  }

  if (filters.eventType) {
    where.event = {
      ...where.event,
      eventType: filters.eventType,
    };
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: where,
    include: {
      event: {
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: filters.sortOrder === "asc" ? "asc" : "desc",
    },
    skip: filters.page ? (filters.page - 1) * (filters.limit || 10) : 0,
    take: filters.limit || 10,
  });

  const total = await prisma.eventRegistration.count({
    where: where,
  });

  const events = registrations.map((reg) => ({
    registrationId: reg.id,
    registrationStatus: reg.status,
    registrationNotes: reg.notes,
    registeredAt: reg.createdAt,
    updatedAt: reg.updatedAt,
    paymentStatus: reg.paymentStatus,
    event: {
      id: reg.event.id,
      title: reg.event.title,
      sportType: reg.event.sportType,
      description: reg.event.description,
      eventType: reg.event.eventType,
      startDate: reg.event.startDate,
      endDate: reg.event.endDate,
      startTime: reg.event.startTime,
      endTime: reg.event.endTime,
      venueName: reg.event.venueName,
      city: reg.event.city,
      fullAddress: reg.event.fullAddress,
      googleMapLink: reg.event.googleMapLink,
      minAge: reg.event.minAge,
      maxParticipants: reg.event.maxParticipants,
      currentParticipants: reg.event.currentParticipants,
      skillLevel: reg.event.skillLevel,
      registrationFee: reg.event.registrationFee,
      costType: reg.event.costType,
      image: reg.event.image,
      status: reg.event.status,
      isApproved: reg.event.isApproved,
      isFeatured: reg.event.isFeatured,
      createdAt: reg.event.createdAt,
      updatedAt: reg.event.updatedAt,
      organizer: reg.event.organizer,
      _count: reg.event._count,
      bookingLink: generateBookingLink(reg.event.id),
    },
  }));

  return {
    events: events,
    meta: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: total,
      totalPage: Math.ceil(total / (filters.limit || 10)),
    },
  };
}

export async function getUserRegisteredEvents(userId, filters = {}) {
  const where = {
    userId: userId,
    status: {
      not: "interested",
    },
  };

  if (filters.registrationStatus) {
    where.status = filters.registrationStatus;
  }

  if (filters.eventStatus) {
    where.event = {
      status: filters.eventStatus,
    };
  }

  if (filters.eventType) {
    where.event = {
      ...where.event,
      eventType: filters.eventType,
    };
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: where,
    include: {
      event: {
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: filters.sortOrder === "asc" ? "asc" : "desc",
    },
    skip: filters.page ? (filters.page - 1) * (filters.limit || 10) : 0,
    take: filters.limit || 10,
  });

  const total = await prisma.eventRegistration.count({
    where: where,
  });

  const events = registrations.map((reg) => ({
    registrationId: reg.id,
    registrationStatus: reg.status,
    registrationNotes: reg.notes,
    registeredAt: reg.createdAt,
    updatedAt: reg.updatedAt,
    paymentStatus: reg.paymentStatus,
    event: {
      id: reg.event.id,
      title: reg.event.title,
      sportType: reg.event.sportType,
      description: reg.event.description,
      eventType: reg.event.eventType,
      startDate: reg.event.startDate,
      endDate: reg.event.endDate,
      startTime: reg.event.startTime,
      endTime: reg.event.endTime,
      venueName: reg.event.venueName,
      city: reg.event.city,
      fullAddress: reg.event.fullAddress,
      googleMapLink: reg.event.googleMapLink,
      minAge: reg.event.minAge,
      maxParticipants: reg.event.maxParticipants,
      currentParticipants: reg.event.currentParticipants,
      skillLevel: reg.event.skillLevel,
      registrationFee: reg.event.registrationFee,
      costType: reg.event.costType,
      image: reg.event.image,
      status: reg.event.status,
      isApproved: reg.event.isApproved,
      isFeatured: reg.event.isFeatured,
      createdAt: reg.event.createdAt,
      updatedAt: reg.event.updatedAt,
      organizer: reg.event.organizer,
      _count: reg.event._count,
      bookingLink: generateBookingLink(reg.event.id),
    },
  }));

  return {
    events: events,
    meta: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: total,
      totalPage: Math.ceil(total / (filters.limit || 10)),
    },
  };
}

export async function featureEvent(eventId, adminId) {
  return toggleFeatureEvent(eventId, adminId);
}

export async function unfeatureEvent(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (!event.isFeatured) {
    throw { statusCode: 400, message: "Event is not featured" };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      isFeatured: false,
      featuredAt: null,
      featuredBy: null,
    },
    include: {
      organizer: {
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

  return updatedEvent;
}

export async function banEvent(eventId, bannedReason, adminId) {
  return toggleBanEvent(eventId, bannedReason, adminId);
}

export async function unbanEvent(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  if (event.status !== "BANNED") {
    throw { statusCode: 400, message: "Event is not banned" };
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "PENDING",
      bannedReason: null,
      bannedAt: null,
    },
    include: {
      organizer: {
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

  return updatedEvent;
}


// save event
export async function saveEvent(eventId, userId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw { statusCode: 404, message: "Event not found" };
  }

  try {
    const savedEvent = await prisma.savedEvent.create({
      data: {
        userId,
        eventId,
      },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return savedEvent;
  } catch (error) {
    if (error.code === "P2002") {
      throw { statusCode: 409, message: "Event already saved" };
    }
    throw error;
  }
}

export async function unsaveEvent(eventId, userId) {
  const savedEvent = await prisma.savedEvent.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (!savedEvent) {
    throw { statusCode: 404, message: "Saved event not found" };
  }

  await prisma.savedEvent.delete({
    where: {
      id: savedEvent.id,
    },
  });

  return { message: "Event removed from saved list" };
}

export async function getUserSavedEvents(userId, filters = {}) {
  const savedEvents = await prisma.savedEvent.findMany({
    where: {
      userId,
    },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              savedBy: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: filters.page ? (filters.page - 1) * (filters.limit || 10) : 0,
    take: filters.limit || 10,
  });

  const total = await prisma.savedEvent.count({
    where: { userId },
  });

  return {
    savedEvents: savedEvents.map((item) => ({
      savedAt: item.createdAt,
      event: {
        ...item.event,
        bookingLink: generateBookingLink(item.event.id),
        isSaved: true,
      },
    })),
    meta: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total,
      totalPage: Math.ceil(total / (filters.limit || 10)),
    },
  };
}

export async function isEventSavedByUser(eventId, userId) {
  const savedEvent = await prisma.savedEvent.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  return !!savedEvent;
}

export async function getSavedEventById(savedEventId, userId, userRole) {
  const savedEvent = await prisma.savedEvent.findUnique({
    where: { id: savedEventId },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              savedBy: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  if (!savedEvent) {
    throw { statusCode: 404, message: "Saved event not found" };
  }

  if (userRole !== "ADMIN" && savedEvent.userId !== userId) {
    throw {
      statusCode: 403,
      message: "Not authorized to view this saved event",
    };
  }

  return {
    id: savedEvent.id,
    savedAt: savedEvent.createdAt,
    user: savedEvent.user,
    event: {
      ...savedEvent.event,
      bookingLink: generateBookingLink(savedEvent.event.id),
      isSaved: true,
      savesCount: savedEvent.event._count?.savedBy || 0,
    },
  };
}