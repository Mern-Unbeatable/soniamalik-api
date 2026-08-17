import prisma from "../config/database.js";
import { config } from "../config/index.js";
import { ServiceStatusEnum } from "../constant/service.constant.js";
import PrismaQueryBuilder from "../shared/query-builder.js";
import * as  notificationService from "./notification.service.js";




function generateSharingLink(serviceId, role) {
  const basePath = role === "COACH" ? "discover" : "services";
  return `${config.frontendUrl}/${basePath}/${serviceId}`;
}

function getFullImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
    return imagePath;
  return `${config.backendUrl}${imagePath}`;
}


function getAnalyticsRecord(analytics) {
  if (!analytics) return null;
  return Array.isArray(analytics) ? analytics[0] : analytics;
}

function getBookingLinkClicks(analytics) {
  return getAnalyticsRecord(analytics)?.bookingLinkClicks || 0;
}

function transformServiceUrls(service) {
  if (!service) return service;
  const bookingLink =
    service.bookingLink && !service.bookingLink.startsWith("http")
      ? `${config.backendUrl}${service.bookingLink}`
      : service.bookingLink;
  return {
    ...service,
    image: getFullImageUrl(service.image),
    bookingLink,
    shareLink:
      service.shareLink ||
      generateSharingLink(service.id, service.provider?.role),
    bookingLinkClicks: getBookingLinkClicks(service.analytics),
  };
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

async function ensureAnalytics(serviceId) {
  const existing = await prisma.serviceAnalytics.findFirst({
    where: { serviceId },
  });
  if (existing) return existing;
  return prisma.serviceAnalytics.create({ data: { serviceId } });
}


export async function getAllServices(query = {}) {
  const getCaseVariants = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return [];

    const lower = normalized.toLowerCase();
    const upper = normalized.toUpperCase();
    const title = lower
      .split(" ")
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(" ");

    return [...new Set([normalized, lower, upper, title])];
  };

  const builder = new PrismaQueryBuilder(prisma.service, query, {
    searchableFields: [
      "listingHeadline",
      "aboutService",
      "providerName",
      "city",
      "clinicName",
      "providerType",
    ],
    listSearchableFields: ["providerType"],
    defaultSort: {
      isFeatured: "desc",
      createdAt: "desc",
    },
    defaultLimit: 12,
    maxLimit: 50,
  });

  const toBool = (v) => v === "true" || v === true;
  const now = new Date();

  // -------------------------
  // APPLY BASE FILTERS USING BUILDER
  // -------------------------
  builder.search().sort().paginate();

  // -------------------------
  // CUSTOM FILTERS
  // -------------------------
  if (query.status) builder._where.status = query.status;
  if (query.serviceType) builder._where.serviceType = query.serviceType;
  if (query.isOnline !== undefined) builder._where.isOnline = toBool(query.isOnline);
  if (query.isFeatured !== undefined) builder._where.isFeatured = toBool(query.isFeatured);
  if (query.insuranceInPlace !== undefined) builder._where.insuranceInPlace = toBool(query.insuranceInPlace);
  if (query.isApproved !== undefined) builder._where.isApproved = toBool(query.isApproved);
  if (query.live === "true") builder._where.endDate = { gte: now };

  // -------------------------
  // DATE FILTERS
  // -------------------------
  if (query.fromDate) {
    const fromDate = new Date(query.fromDate);
    if (!isNaN(fromDate.getTime())) {
      fromDate.setHours(0, 0, 0, 0);
      if (!builder._where.createdAt) builder._where.createdAt = {};
      builder._where.createdAt.gte = fromDate;
    }
  }

  if (query.toDate) {
    const toDate = new Date(query.toDate);
    if (!isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      if (!builder._where.createdAt) builder._where.createdAt = {};
      builder._where.createdAt.lte = toDate;
    }
  }

  // -------------------------
  // SPORTS FILTER - CASE INSENSITIVE (Using both case options)
  // -------------------------
  let sportsFilter = [];

  if (query.sport) {
    sportsFilter = [query.sport];
  }

  if (query.sports) {
    sportsFilter = query.sports.split(",").map((item) => item.trim());
  }

  sportsFilter = sportsFilter.filter(Boolean);

  // If we have sports filter, apply it using case-insensitive matching
  if (sportsFilter.length > 0) {
    const sportsVariants = [
      ...new Set(sportsFilter.flatMap((sport) => getCaseVariants(sport))),
    ];

    // Never overwrite search OR conditions; this remains an AND-able field filter.
    builder._where.sports = {
      hasSome: sportsVariants,
    };
  }

  // -------------------------
  // EXECUTE FIRST FOR PAGINATION
  // -------------------------
  const result = await builder.execute("services");

  // Get all services with relations
  let servicesWithAllRelations = await prisma.service.findMany({
    where: builder._where,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          bio: true,
          address: true,
          organizationName: true,
          serviceTypes: true,
          aboutOrganization: true,
          sportsInterests: true,
        },
      },
      analytics: {
        select: {
          id: true,
          views: true,
          bookingLinkClicks: true,
          bookings: true,
          revenue: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      bookings: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          type: true,
          aboutMe: true,
          bookingDate: true,
          status: true,
          paymentStatus: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      messages: {
        select: {
          id: true,
          message: true,
          isReply: true,
          isRead: true,
          parentId: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
          replies: {
            select: {
              id: true,
              message: true,
              isReply: true,
              isRead: true,
              createdAt: true,
              updatedAt: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  avatar: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          bookings: true,
          messages: true,
        },
      },
    },
    skip: (result.meta.page - 1) * result.meta.limit,
    take: result.meta.limit,
    orderBy: builder._orderBy.length ? builder._orderBy : [{ createdAt: "desc" }],
  });

  // -------------------------
  // APPLY CASE-INSENSITIVE SPORTS FILTER ON RESULTS
  // -------------------------
  if (sportsFilter.length > 0) {
    const sportsLower = sportsFilter.map(s => s.toLowerCase());
    servicesWithAllRelations = servicesWithAllRelations.filter(service => {
      if (!service.sports || service.sports.length === 0) return false;
      // Check if ANY of the service's sports match ANY of the filter sports (case insensitive)
      return service.sports.some(serviceSport =>
        sportsLower.includes(serviceSport.toLowerCase())
      );
    });
  }

  // Transform each service with full data
  const transformedServices = servicesWithAllRelations.map(service => {
    const analyticsSummary = getAnalyticsRecord(service.analytics) || {
      views: 0,
      bookingLinkClicks: 0,
      bookings: 0,
      revenue: 0,
      rating: 0,
    };

    const totalMessages = service.messages?.length || 0;
    const unreadMessages = service.messages?.filter(msg => !msg.isRead).length || 0;
    const totalReplies = service.messages?.reduce((total, msg) => {
      return total + (msg.replies?.length || 0);
    }, 0) || 0;
    const unreadReplies = service.messages?.reduce((total, msg) => {
      return total + (msg.replies?.filter(reply => !reply.isRead).length || 0);
    }, 0) || 0;

    const totalBookings = service.bookings?.length || 0;
    const pendingBookings = service.bookings?.filter(b => b.status === "pending").length || 0;
    const confirmedBookings = service.bookings?.filter(b => b.status === "confirmed").length || 0;
    const completedBookings = service.bookings?.filter(b => b.status === "completed").length || 0;
    const cancelledBookings = service.bookings?.filter(b => b.status === "cancelled").length || 0;

    const messageThreads = service.messages?.filter(msg => !msg.parentId).map(msg => ({
      ...msg,
      replyCount: msg.replies?.length || 0,
    })) || [];

    return {
      ...service,
      analytics: analyticsSummary,
      bookingLinkClicks: analyticsSummary.bookingLinkClicks || 0,
      stats: {
        views: analyticsSummary.views,
        bookingLinkClicks: analyticsSummary.bookingLinkClicks || 0,
        totalRevenue: analyticsSummary.revenue,
        averageRating: analyticsSummary.rating,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalMessages,
        unreadMessages,
        totalReplies,
        unreadReplies,
      },
      bookingSummary: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      messageSummary: {
        total: totalMessages,
        unread: unreadMessages,
        totalReplies,
        unreadReplies,
        threads: messageThreads.length,
      },
      recentBookings: service.bookings?.slice(0, 5) || [],
      recentMessages: messageThreads.slice(0, 5),
      allBookings: service.bookings,
      allMessages: service.messages,
      messageThreads,
    };
  });

  return {
    services: transformedServices.map(transformServiceUrls),
    pagination: {
      totalPages: result.meta.totalPage,
      currentPage: result.meta.page,
      total: result.meta.total,
      limit: result.meta.limit,
      hasNext: result.meta.page < result.meta.totalPage,
      hasPrev: result.meta.page > 1,
    },
  };
}

export async function getServicesByProviderRole(query = {}) {
  const {
    page = 1,
    limit = 12,
    search,
    city,
    status,
    providerRole,
    sport,
    sports,
    fromDate,
    toDate,
    isOnline,
    isFeatured,
    isApproved,
    insuranceInPlace,
  } = query;

  const where = {};

  // -------------------------
  // SEARCH
  // -------------------------
  if (search) {
    where.OR = [
      { listingHeadline: { contains: search, mode: "insensitive" } },
      { providerName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { clinicName: { contains: search, mode: "insensitive" } },
      { aboutService: { contains: search, mode: "insensitive" } },
    ];
  }

  // -------------------------
  // BASIC FILTERS
  // -------------------------
  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (status) {
    where.status = status;
  }

  // -------------------------
  // BOOLEAN FILTERS
  // -------------------------
  const toBool = (v) => v === "true" || v === true;

  if (isOnline !== undefined) where.isOnline = toBool(isOnline);
  if (isFeatured !== undefined) where.isFeatured = toBool(isFeatured);
  if (isApproved !== undefined) where.isApproved = toBool(isApproved);
  if (insuranceInPlace !== undefined) where.insuranceInPlace = toBool(insuranceInPlace);

  // -------------------------
  // DATE FILTERS
  // -------------------------
  if (fromDate) {
    const fromDateObj = new Date(fromDate);
    if (!isNaN(fromDateObj.getTime())) {
      fromDateObj.setHours(0, 0, 0, 0);
      where.createdAt = {
        ...where.createdAt,
        gte: fromDateObj
      };
    }
  }

  if (toDate) {
    const toDateObj = new Date(toDate);
    if (!isNaN(toDateObj.getTime())) {
      toDateObj.setHours(23, 59, 59, 999);
      where.createdAt = {
        ...where.createdAt,
        lte: toDateObj
      };
    }
  }

  // -------------------------
  // SPORTS FILTER - CASE INSENSITIVE
  // -------------------------
  // Note: For true case-insensitive search, ensure sports are stored in lowercase in DB
  // For now, we'll store the sports filter to apply after query
  let sportsFilter = [];

  if (sport) {
    sportsFilter = [sport];
  }

  if (sports) {
    sportsFilter = sports.split(",").map(item => item.trim());
  }

  // Apply sports filter in where clause (case-sensitive)
  if (sportsFilter.length > 0) {
    // For single sport
    if (sportsFilter.length === 1) {
      where.sports = {
        has: sportsFilter[0]
      };
    } else {
      // For multiple sports, use OR condition
      where.OR = [
        ...(where.OR || []),
        ...sportsFilter.map(sport => ({
          sports: {
            has: sport
          }
        }))
      ];
    }
  }

  // -------------------------
  // ROLE FILTER (IMPORTANT)
  // -------------------------
  if (providerRole) {
    where.provider = {
      ...where.provider,
      role: providerRole, // "COACH" | "PROVIDER"
    };
  }

  // -------------------------
  // QUERY DB WITH ALL RELATIONS
  // -------------------------
  let [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            phone: true,
            role: true,
            bio: true,
            organizationName: true,
          },
        },
        analytics: {
          select: {
            views: true,
            bookingLinkClicks: true,
            bookings: true,
            revenue: true,
            rating: true,
          },
        },
        bookings: {
          where: { type: "booking" },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            type: true,
            status: true,
            bookingDate: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        messages: {
          where: { parentId: null },
          select: {
            id: true,
            message: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
            replies: {
              select: {
                id: true,
                message: true,
                isRead: true,
                createdAt: true,
                sender: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    role: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
              take: 3,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            bookings: true,
            messages: true,
          },
        },
      },
      skip: (page - 1) * Number(limit),
      take: Number(limit),
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.service.count({ where }),
  ]);

  // -------------------------
  // APPLY CASE-INSENSITIVE SPORTS FILTER ON RESULTS
  // -------------------------
  if (sportsFilter.length > 0) {
    const sportsLower = sportsFilter.map(s => s.toLowerCase());
    services = services.filter(service => {
      if (!service.sports || service.sports.length === 0) return false;
      // Check if ANY of the service's sports match ANY of the filter sports (case insensitive)
      return service.sports.some(serviceSport =>
        sportsLower.includes(serviceSport.toLowerCase())
      );
    });

    // Recalculate total after filtering
    total = services.length;
  }

  // Transform services with stats
  const transformedServices = services.map(service => {
    const transformed = transformServiceUrls(service);

    // Calculate stats
    const unreadMessages = service.messages?.filter(msg => !msg.isRead).length || 0;
    const unreadReplies = service.messages?.reduce((total, msg) => {
      return total + (msg.replies?.filter(reply => !reply.isRead).length || 0);
    }, 0) || 0;

    // Calculate booking stats
    const totalBookings = service._count?.bookings || 0;
    const pendingBookings = service.bookings?.filter(b => b.status === "pending").length || 0;
    const confirmedBookings = service.bookings?.filter(b => b.status === "confirmed").length || 0;
    const completedBookings = service.bookings?.filter(b => b.status === "completed").length || 0;
    const cancelledBookings = service.bookings?.filter(b => b.status === "cancelled").length || 0;

    return {
      ...transformed,
      stats: {
        views: getAnalyticsRecord(service.analytics)?.views || 0,
        bookingLinkClicks: getBookingLinkClicks(service.analytics),
        totalRevenue: getAnalyticsRecord(service.analytics)?.revenue || 0,
        averageRating: getAnalyticsRecord(service.analytics)?.rating || 0,
        totalBookings: totalBookings,
        pendingBookings: pendingBookings,
        confirmedBookings: confirmedBookings,
        completedBookings: completedBookings,
        cancelledBookings: cancelledBookings,
        totalMessages: service._count?.messages || 0,
        unreadMessages: unreadMessages + unreadReplies,
      },
      bookingSummary: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      recentBookings: service.bookings || [],
      recentMessages: service.messages || [],
    };
  });

  return {
    services: transformedServices,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    hasNext: Number(page) < Math.ceil(total / limit),
    hasPrev: Number(page) > 1,
  };
}

export async function getServiceById(serviceId, trackView = true, trackBookingLink = false) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          bio: true,
          address: true,
          organizationName: true,
          serviceTypes: true,
          aboutOrganization: true,
        },
      },
      analytics: true,
      bookings: {
        where: { type: "booking" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          type: true,
          aboutMe: true,
          bookingDate: true,
          status: true,
          paymentStatus: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },

      messages: {
        where: { parentId: null },
        select: {
          id: true,
          message: true,
          isReply: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          replies: {
            select: {
              id: true,
              message: true,
              isReply: true,
              isRead: true,
              createdAt: true,
              updatedAt: true,
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
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          bookings: true,
          messages: true,
        },
      },
    },
  });

  if (!service) throw { statusCode: 404, message: "Service not found" };
  if (trackView && service.isApproved) await trackServiceView(serviceId);
  if (trackBookingLink && service.bookingLink) {
    const clickResult = await trackServiceBookingLinkClick(serviceId);
    if (Array.isArray(service.analytics) && service.analytics[0]) {
      service.analytics[0].bookingLinkClicks = clickResult.bookingLinkClicks;
    } else if (service.analytics && !Array.isArray(service.analytics)) {
      service.analytics.bookingLinkClicks = clickResult.bookingLinkClicks;
    } else {
      service.analytics = [{ bookingLinkClicks: clickResult.bookingLinkClicks }];
    }
  }

  const transformed = transformServiceUrls(service);

  // Calculate additional stats
  const unreadMessages = service.messages?.filter(msg => !msg.isRead).length || 0;
  const unreadReplies = service.messages?.reduce((total, msg) => {
    return total + (msg.replies?.filter(reply => !reply.isRead).length || 0);
  }, 0) || 0;
  const analyticsRecord = getAnalyticsRecord(service.analytics);

  return {
    ...transformed,
    stats: {
      views: analyticsRecord?.views || 0,
      bookingLinkClicks: analyticsRecord?.bookingLinkClicks || 0,
      totalRevenue: analyticsRecord?.revenue || 0,
      averageRating: analyticsRecord?.rating || 0,
      totalBookings: service._count?.bookings || 0,
      totalMessages: service._count?.messages || 0,
      unreadMessages: unreadMessages + unreadReplies,
      totalReplies: service.messages?.reduce((sum, msg) => sum + (msg.replies?.length || 0), 0) || 0,
    },
    bookingSummary: {
      total: service._count?.bookings || 0,
      confirmed: service.bookings?.filter(b => b.status === "confirmed").length || 0,
      pending: service.bookings?.filter(b => b.status === "pending").length || 0,
      completed: service.bookings?.filter(b => b.status === "completed").length || 0,
      cancelled: service.bookings?.filter(b => b.status === "cancelled").length || 0,
    },
  };
}

export async function getProviderServices(providerId, filters = {}) {
  const { page = 1, limit = 20, status } = filters;
  const where = { providerId };
  if (status) where.status = status;

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
            messages: true
          }
        },
        analytics: {
          select: {
            views: true,
            bookingLinkClicks: true,
            bookings: true,
            revenue: true,
            rating: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        bookings: {
          where: { type: "booking" },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            status: true,
            bookingDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        messages: {
          where: { parentId: null },
          select: {
            id: true,
            message: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
            replies: {
              select: {
                id: true,
                message: true,
                isRead: true,
                createdAt: true,
              },
              orderBy: { createdAt: "asc" },
              take: 3,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.count({ where }),
  ]);

  const transformedServices = services.map(service => {
    const transformed = transformServiceUrls(service);

    // Calculate unread messages
    const unreadMessages = service.messages?.filter(msg => !msg.isRead).length || 0;
    const unreadReplies = service.messages?.reduce((total, msg) => {
      return total + (msg.replies?.filter(reply => !reply.isRead).length || 0);
    }, 0) || 0;

    return {
      ...transformed,
      stats: {
        views: getAnalyticsRecord(service.analytics)?.views || 0,
        bookingLinkClicks: getBookingLinkClicks(service.analytics),
        revenue: getAnalyticsRecord(service.analytics)?.revenue || 0,
        rating: service.analytics?.rating || 0,
        totalBookings: service._count?.bookings || 0,
        totalMessages: service._count?.messages || 0,
        unreadMessages: unreadMessages + unreadReplies,
      },
      recentBookings: service.bookings || [],
      recentMessages: service.messages || [],
    };
  });

  return {
    services: transformedServices,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
}


export async function createService(serviceData, req, logoPath = null) {
  // Clean and prepare the data
  const preparedData = { ...serviceData };

  console.log('prepare data', preparedData)

  // Handle duration - ensure it's a valid number
  if (preparedData.duration !== undefined && preparedData.duration !== null && preparedData.duration !== '') {
    const durationNum = parseInt(preparedData.duration);
    if (!isNaN(durationNum)) {
      preparedData.duration = durationNum;
    } else {
      delete preparedData.duration;
    }
  }

  // Ensure providerType is an array
  if (preparedData.providerType && !Array.isArray(preparedData.providerType)) {
    preparedData.providerType = [preparedData.providerType];
  }

  // Ensure sessionTypes is an array
  if (preparedData.sessionTypes && !Array.isArray(preparedData.sessionTypes)) {
    preparedData.sessionTypes = preparedData.sessionTypes.split(',').map(s => s.trim());
  }

  // Ensure suitableFor is an array
  if (preparedData.suitableFor && !Array.isArray(preparedData.suitableFor)) {
    preparedData.suitableFor = preparedData.suitableFor.split(',').map(s => s.trim());
  }

  // Ensure sports is an array
  if (preparedData.sports && !Array.isArray(preparedData.sports)) {
    preparedData.sports = preparedData.sports.split(',').map(s => s.trim());
  }

  // Ensure availableDays is an array
  if (preparedData.availableDays && !Array.isArray(preparedData.availableDays)) {
    preparedData.availableDays = preparedData.availableDays.split(',').map(s => s.trim());
  }

  // NEW: Handle the new fields - ensure they're strings
  if (preparedData.whoCanTakePart !== undefined) {
    preparedData.whoCanTakePart = String(preparedData.whoCanTakePart).trim();
  }

  if (preparedData.startTime !== undefined) {
    preparedData.startTime = String(preparedData.startTime).trim();
  }

  if (preparedData.endTime !== undefined) {
    preparedData.endTime = String(preparedData.endTime).trim();
  }

  // Handle field name typos - map sessionDay, timeSlot if they come as sessonDay or timeSlote
  if (preparedData.sessonDay) {
    preparedData.sessonDay = preparedData.sessonDay;
  }

  if (preparedData.timeSlote) {
    preparedData.timeSlote = preparedData.timeSlote;
  }

  if (preparedData.costMemebershipDetail) {
    preparedData.costMemebershipDetail = preparedData.costMemebershipDetail.trim();
  }

  preparedData.responseType = preparedData.responseType || "INTERESTED";
  delete preparedData.shareLink;

  // Build full address
  const fullAddress = [
    preparedData.addressLine1,
    preparedData.city,
    preparedData.postcode
  ].filter(Boolean).join(", ");

  try {

    const service = await prisma.service.create({
      data: {
        ...preparedData,
        fullAddress: fullAddress || null,
        logo: logoPath || null,
        providerId: req.user.id,
        providerName: req.user.name || "Unknown",
        contactName: req.user.name || null,
        providerPhone: req.user.phone || "",
        providerEmail: req.user.email || "",
        status: "PENDING",
        isApproved: false,
        // Use bookingLink from preparedData or set to null
        bookingLink: preparedData.bookingLink || null,
      },
    });

    const createdService = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        provider: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
    });

    const shareLink = generateSharingLink(service.id, req.user.role);

    try {
      const savedService = await prisma.service.update({
        where: { id: service.id },
        data: { shareLink },
        include: {
          provider: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
        },
      });
      return transformServiceUrls(savedService);
    } catch (saveShareLinkError) {
      console.error("shareLink save skipped:", saveShareLinkError.message);
      return transformServiceUrls({
        ...createdService,
        shareLink,
      });
    }
  } catch (error) {
    console.error("Error creating service:", error);
    throw {
      statusCode: 400,
      message: `Failed to create service: ${error.message}`,
    };
  }
}

// export async function createService(serviceData, req, logoPath = null) {
//   // Clean and prepare the data
//   const preparedData = { ...serviceData };

//   // Handle duration - ensure it's a valid number
//   if (preparedData.duration !== undefined && preparedData.duration !== null && preparedData.duration !== '') {
//     const durationNum = parseInt(preparedData.duration);
//     if (!isNaN(durationNum)) {
//       preparedData.duration = durationNum;
//     } else {
//       delete preparedData.duration;
//     }
//   }

//   // Ensure providerType is an array
//   if (preparedData.providerType && !Array.isArray(preparedData.providerType)) {
//     preparedData.providerType = [preparedData.providerType];
//   }

//   // Ensure sessionTypes is an array
//   if (preparedData.sessionTypes && !Array.isArray(preparedData.sessionTypes)) {
//     preparedData.sessionTypes = preparedData.sessionTypes.split(',').map(s => s.trim());
//   }

//   // Ensure suitableFor is an array
//   if (preparedData.suitableFor && !Array.isArray(preparedData.suitableFor)) {
//     preparedData.suitableFor = preparedData.suitableFor.split(',').map(s => s.trim());
//   }

//   // Ensure sports is an array
//   if (preparedData.sports && !Array.isArray(preparedData.sports)) {
//     preparedData.sports = preparedData.sports.split(',').map(s => s.trim());
//   }

//   // Ensure availableDays is an array
//   if (preparedData.availableDays && !Array.isArray(preparedData.availableDays)) {
//     preparedData.availableDays = preparedData.availableDays.split(',').map(s => s.trim());
//   }

//   // NEW: Handle the new fields - ensure they're strings
//   if (preparedData.whoCanTakePart !== undefined) {
//     preparedData.whoCanTakePart = String(preparedData.whoCanTakePart).trim();
//   }

//   if (preparedData.startTime !== undefined) {
//     preparedData.startTime = String(preparedData.startTime).trim();
//   }

//   if (preparedData.endTime !== undefined) {
//     preparedData.endTime = String(preparedData.endTime).trim();
//   }

//   // Handle field name typos - map sessionDay, timeSlot if they come as sessonDay or timeSlote
//   if (preparedData.sessonDay) {
//     preparedData.sessonDay = preparedData.sessonDay;
//   }

//   if (preparedData.timeSlote) {
//     preparedData.timeSlote = preparedData.timeSlote;
//   }

//   if (preparedData.costMemebershipDetail) {
//     preparedData.costMemebershipDetail = preparedData.costMemebershipDetail.trim();
//   }

//   preparedData.responseType = preparedData.responseType || "INTERESTED";

//   // Build full address
//   const fullAddress = [
//     preparedData.addressLine1,
//     preparedData.city,
//     preparedData.postcode
//   ].filter(Boolean).join(", ");

//   try {
//     const service = await prisma.service.create({
//       data: {
//         ...preparedData,
//         fullAddress: fullAddress || null,
//         logo: logoPath || null,
//         providerId: req.user.id,
//         providerName: req.user.name || "Unknown",
//         contactName: req.user.name || null,
//         providerPhone: req.user.phone || "",
//         providerEmail: req.user.email || "",
//         status: "PENDING",
//         isApproved: false,
//       },
//     });

//     // Generate booking link
//     const bookingLink = generateBookingLink(service.id, req.user.role);

//     const updatedService = await prisma.service.update({
//       where: { id: service.id },
//       data: { bookingLink },
//       include: {
//         provider: {
//           select: { id: true, name: true, email: true, avatar: true },
//         },
//       },
//     });

//     return transformServiceUrls(updatedService);
//   } catch (error) {
//     console.error("Error creating service:", error);
//     throw {
//       statusCode: 400,
//       message: `Failed to create service: ${error.message}`,
//     };
//   }
// }
export async function updateService(
  serviceId,
  updateData,
  userId,
  userRole,
  logoPath = null
) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw { statusCode: 404, message: "Service not found" };
  }

  if (userRole !== "ADMIN" && userRole !== "COACH" && userRole !== 'PROVIDER' && service.providerId !== userId) {
    throw {
      statusCode: 403,
      message: "Not authorized to update this service",
    };
  }

  const data = { ...updateData };
  delete data.shareLink;

  // Clean the data similar to create
  if (data.duration !== undefined) {
    const durationNum = parseInt(data.duration);
    data.duration = !isNaN(durationNum) ? durationNum : undefined;
  }

  // Handle array fields
  const arrayFields = ['sports', 'sessionTypes', 'suitableFor', 'providerType', 'availableDays'];
  arrayFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      data[field] = data[field].split(',').map(s => s.trim());
    }
  });

  // Handle boolean fields
  const booleanFields = ['insuranceInPlace', 'isOnline', 'womenOnly'];
  booleanFields.forEach(field => {
    if (data[field] !== undefined) {
      data[field] = data[field] === true || data[field] === "true";
    }
  });

  // NEW: Handle the new string fields
  const stringFields = ['whoCanTakePart', 'startTime', 'endTime'];
  stringFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = String(data[field]).trim();
    }
  });

  if (logoPath) {
    data.logo = logoPath;
  }

  // rebuild fullAddress
  if (data.addressLine1 || data.city || data.postcode) {
    data.fullAddress = [
      data.addressLine1 || service.addressLine1,
      data.city || service.city,
      data.postcode || service.postcode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data,
    include: {
      provider: {
        select: { id: true, name: true, email: true, avatar: true, role: true },
      },
    },
  });

  return transformServiceUrls(updatedService);
}

export async function deleteService(serviceId, userId, userRole) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw { statusCode: 404, message: "Service not found" };
  if (userRole !== "ADMIN" && service.providerId !== userId)
    throw { statusCode: 403, message: "Not authorized to delete this service" };
  await prisma.service.delete({ where: { id: serviceId } });
  return true;
}


export async function getAdminServices(filters = {}) {
  const { page = 1, limit = 20, status, sport, search } = filters;
  const where = {};
  if (status) where.status = status;
  if (sport) where.sports = { has: sport };
  if (search) {
    where.OR = [
      { listingHeadline: { contains: search, mode: "insensitive" } },
      { providerName: { contains: search, mode: "insensitive" } },
    ];
  }
  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        provider: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        analytics: { select: { views: true, bookingLinkClicks: true, bookings: true, revenue: true } },
        _count: { select: { bookings: true, messages: true } },
      },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.count({ where }),
  ]);
  const transformedServices = services.map(transformServiceUrls);
  return {
    services: transformedServices,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  };
}

export async function approveService(serviceId) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw { statusCode: 404, message: "Service not found" };
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { isApproved: true, status: "ACTIVE", rejectionReason: null },
    include: { provider: { select: { id: true, name: true, email: true } } },
  });
  await ensureAnalytics(serviceId);
  return transformServiceUrls(updated);
}
export async function rejectService(serviceId, reason, adminId) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw { statusCode: 404, message: "Service not found" };
  }

  // Check using enum values
  if (service.status === ServiceStatusEnum.BANNED) {
    throw {
      statusCode: 400,
      message: "Banned service cannot be rejected",
    };
  }

  // Check if already rejected (using a custom field or specific status)
  // Since there's no REJECTED in enum, you might need to track rejection separately
  if (service.rejectionReason && service.status === ServiceStatusEnum.INACTIVE) {
    throw {
      statusCode: 400,
      message: "Service is already rejected",
    };
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      isApproved: false,
      status: ServiceStatusEnum.INACTIVE,
      rejectionReason: reason.trim(),
    },
    include: {
      provider: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return transformServiceUrls(updated);
}

export async function featureService(serviceId) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw { statusCode: 404, message: "Service not found" };
  const toggled = !service.isFeatured;
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      isFeatured: toggled,
      // status: toggled ? "FEATURED" : "ACTIVE",
      featuredAt: toggled ? new Date() : null,
    },
  });
  return transformServiceUrls(updated);
}

export async function banService(serviceId, reason, adminId) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw { statusCode: 404, message: "Service not found" };
  }

  // idempotency protection
  if (service.status === "BANNED") {
    throw {
      statusCode: 400,
      message: "Service is already banned",
    };
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      isApproved: false,
      status: "BANNED",
      bannedReason: reason.trim(),
      bannedAt: new Date(),
    },
  });

  return transformServiceUrls(updated);
}


export async function bookNow(serviceId, userId) {
  const [service, user] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);
  if (!service) throw { statusCode: 404, message: "Service not found" };
  if (!service.isApproved)
    throw {
      statusCode: 400,
      message: "This service is not available for booking",
    };
  if (!user) throw { statusCode: 404, message: "User not found" };

  // Check if user already has a booking
  const existingBooking = await prisma.serviceBooking.findFirst({
    where: { serviceId, userId, type: "booking" },
  });
  if (existingBooking)
    throw { statusCode: 409, message: "You have already booked this service" };

  // Check if user has registered interest - if yes, remove it before booking
  const existingInterest = await prisma.serviceBooking.findFirst({
    where: { serviceId, userId, type: "interest" },
  });
  if (existingInterest) {
    await prisma.serviceBooking.delete({ where: { id: existingInterest.id } });
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      serviceId,
      userId,
      fullName: user.name || "",
      email: user.email,
      phoneNumber: user.phone || "",
      type: "booking",
      status: "pending",
      paymentStatus: "pending",
    },
    include: {
      service: { select: { id: true, listingHeadline: true, providerName: true } },
    },
  });

  //  Send notification to service provider
  await notificationService.createNotification(
    service.providerId,
    "BOOKING_CREATED",
    " New Booking Received",
    `${user.name} has booked "${service.listingHeadline}"`,
    {
      type: "BOOKING",
      action: "view_booking",
      actionUrl: `/provider/services/${serviceId}/bookings/${booking.id}`,
      serviceId: service.id,
      serviceName: service.listingHeadline,
      bookingId: booking.id,
      userId: userId,
      userName: user.name,
    }
  );

  return booking;
}

export async function registerInterest(serviceId, userId) {
  const [service, user] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);
  if (!service) throw { statusCode: 404, message: "Service not found" };
  if (!service.isApproved)
    throw { statusCode: 400, message: "This service is not available" };
  if (!user) throw { statusCode: 404, message: "User not found" };

  // Check if user already has a booking
  const existingBooking = await prisma.serviceBooking.findFirst({
    where: { serviceId, userId, type: "booking" },
  });
  if (existingBooking)
    throw {
      statusCode: 409,
      message: "You have already booked this service. Cannot register interest.",
    };

  // Check if user already has registered interest
  const existingInterest = await prisma.serviceBooking.findFirst({
    where: { serviceId, userId, type: "interest" },
  });
  if (existingInterest)
    throw {
      statusCode: 409,
      message: "You have already registered interest in this service",
    };

  const interest = await prisma.serviceBooking.create({
    data: {
      serviceId,
      userId,
      fullName: user.name || "",
      email: user.email,
      phoneNumber: user.phone || "",
      type: "interest",
      status: "pending",
      paymentStatus: "not_applicable",
    },
    include: {
      service: { select: { id: true, listingHeadline: true, providerName: true } },
    },
  });

  //  Send notification to service provider
  await notificationService.createNotification(
    service.providerId,
    "INTEREST_RECEIVED",
    " New Interest Received",
    `${user.name} is interested in "${service.listingHeadline}"`,
    {
      type: "INTEREST",
      action: "view_interest",
      actionUrl: `/provider/services/${serviceId}/interests/${interest.id}`,
      serviceId: service.id,
      serviceName: service.listingHeadline,
      interestId: interest.id,
      userId: userId,
      userName: user.name,
    }
  );

  return interest;
}

export async function getServiceBookings(serviceId, userId, userRole) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          messages: true,
        },
      },
    },
  });

  if (!service) throw { statusCode: 404, message: "Service not found" };

  if (userRole !== "ADMIN" && userRole !== "COACH" && userRole !== "PROVIDER" && service.providerId !== userId) {
    throw {
      statusCode: 403,
      message: "Not authorized to view bookings for this service",
    };
  }

  const bookings = await prisma.serviceBooking.findMany({
    where: { serviceId, type: "booking" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate booking statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    totalRevenue: service.analytics?.revenue || 0,
  };

  // Transform bookings data
  const transformedBookings = bookings.map(booking => ({
    id: booking.id,
    user: {
      id: booking.user?.id,
      name: booking.user?.name,
      email: booking.user?.email,
      phone: booking.user?.phone,
      avatar: booking.user?.avatar,
    },
    fullName: booking.fullName,
    email: booking.email,
    phoneNumber: booking.phoneNumber,
    aboutMe: booking.aboutMe,
    bookingDate: booking.bookingDate,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  }));

  return {
    success: true,
    data: {
      service: {
        id: service.id,
        listingHeadline: service.listingHeadline,
        aboutService: service.aboutService,
        providerName: service.providerName,
        provider: service.provider,
        logo: service.logo,
        city: service.city,
        sports: service.sports,
        isOnline: service.isOnline,
        status: service.status,
        isApproved: service.isApproved,
        totalBookings: service._count.bookings,
        totalMessages: service._count.messages,
      },
      bookings: transformedBookings,
      stats: stats,
    },
  };
}

export async function getServiceInterests(serviceId, userId, userRole) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          messages: true,
        },
      },
    },
  });

  if (!service) throw { statusCode: 404, message: "Service not found" };

  if (userRole !== "ADMIN" && service.providerId !== userId) {
    throw {
      statusCode: 403,
      message: "Not authorized to view interests for this service",
    };
  }

  const interests = await prisma.serviceBooking.findMany({
    where: { serviceId, type: "interest" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate interest statistics
  const stats = {
    total: interests.length,
    pending: interests.filter(i => i.status === "pending").length,
    contacted: interests.filter(i => i.status === "contacted").length,
    converted: interests.filter(i => i.status === "converted").length,
  };

  // Transform interests data
  const transformedInterests = interests.map(interest => ({
    id: interest.id,
    user: {
      id: interest.user?.id,
      name: interest.user?.name,
      email: interest.user?.email,
      phone: interest.user?.phone,
      avatar: interest.user?.avatar,
    },
    fullName: interest.fullName,
    email: interest.email,
    phoneNumber: interest.phoneNumber,
    aboutMe: interest.aboutMe,
    status: interest.status,
    notes: interest.notes,
    createdAt: interest.createdAt,
    updatedAt: interest.updatedAt,
  }));

  return {
    success: true,
    data: {
      service: {
        id: service.id,
        listingHeadline: service.listingHeadline,
        aboutService: service.aboutService,
        providerName: service.providerName,
        provider: service.provider,
        logo: service.logo,
        city: service.city,
        sports: service.sports,
        isOnline: service.isOnline,
        status: service.status,
        isApproved: service.isApproved,
        totalBookings: service._count.bookings,
        totalMessages: service._count.messages,
      },
      interests: transformedInterests,
      stats: stats,
    },
  };
}

export async function deleteServiceBooking(bookingId, userId, userRole) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        select: {
          providerId: true,
          listingHeadline: true,
        }
      }
    },
  });

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  // Check authorization
  const isServiceOwner = booking.service.providerId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isServiceOwner && !isAdmin) {
    throw {
      statusCode: 403,
      message: "Not authorized to delete this booking",
    };
  }

  // Cannot delete confirmed or completed bookings
  if (booking.status === "confirmed" || booking.status === "completed") {
    throw {
      statusCode: 400,
      message: `Cannot delete a ${booking.status} booking. Please cancel it first.`,
    };
  }

  // Delete the booking
  await prisma.serviceBooking.delete({
    where: { id: bookingId },
  });

  // Update analytics (decrement booking count)
  await prisma.serviceAnalytics.update({
    where: { serviceId: booking.serviceId },
    data: { bookings: { decrement: 1 } },
  }).catch(() => { }); // Ignore if analytics doesn't exist

  return {
    success: true,
    message: "Booking deleted successfully",
    deletedBooking: {
      id: booking.id,
      serviceId: booking.serviceId,
      serviceName: booking.service.listingHeadline,
      userName: booking.fullName,
      userEmail: booking.email,
    }
  };
}


export async function deleteServiceInterest(interestId, userId, userRole) {
  const interest = await prisma.serviceBooking.findUnique({
    where: { id: interestId },
    include: {
      service: {
        select: {
          providerId: true,
          listingHeadline: true,
        }
      }
    },
  });

  if (!interest) {
    throw { statusCode: 404, message: "Interest not found" };
  }

  // Check if it's actually an interest
  if (interest.type !== "interest") {
    throw {
      statusCode: 400,
      message: "This is not an interest record. Use booking delete API instead.",
    };
  }

  // Check authorization
  const isServiceOwner = interest.service.providerId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isServiceOwner && !isAdmin) {
    throw {
      statusCode: 403,
      message: "Not authorized to delete this interest",
    };
  }

  // Delete the interest
  await prisma.serviceBooking.delete({
    where: { id: interestId },
  });

  return {
    success: true,
    message: "Interest deleted successfully",
    deletedInterest: {
      id: interest.id,
      serviceId: interest.serviceId,
      serviceName: interest.service.listingHeadline,
      userName: interest.fullName,
      userEmail: interest.email,
    }
  };
}


export async function cancelBooking(bookingId, userId, userRole) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        select: {
          providerId: true,
          listingHeadline: true,
        }
      },
      user: true,
    },
  });

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  // Check authorization
  const isBookingOwner = booking.userId === userId;
  const isServiceOwner = booking.service.providerId === userId;
  const isAdmin = userRole === "ADMIN";

  if (!isBookingOwner && !isServiceOwner && !isAdmin) {
    throw {
      statusCode: 403,
      message: "Not authorized to cancel this booking",
    };
  }

  // Check if booking can be cancelled
  if (booking.status === "completed") {
    throw {
      statusCode: 400,
      message: "Completed bookings cannot be cancelled",
    };
  }

  if (booking.status === "cancelled") {
    throw {
      statusCode: 400,
      message: "Booking is already cancelled",
    };
  }

  const updatedBooking = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: {
      status: "cancelled",
      notes: booking.notes ? `${booking.notes}\nCancelled by user at ${new Date().toISOString()}` : `Cancelled by user at ${new Date().toISOString()}`
    },
  });

  // 🔔 Send notification to service provider (if user cancelled)
  if (isBookingOwner && !isServiceOwner) {
    await notificationService.createNotification(
      booking.service.providerId,
      "BOOKING_CANCELLED",
      "⚠️ Booking Cancelled",
      `${booking.user?.name || "A user"} has cancelled their booking for "${booking.service.listingHeadline}"`,
      {
        type: "BOOKING",
        action: "view_booking",
        actionUrl: `/provider/services/${booking.serviceId}/bookings/${bookingId}`,
        serviceId: booking.serviceId,
        serviceName: booking.service.listingHeadline,
        bookingId: bookingId,
        cancelledBy: "user",
      }
    );
  }

  return {
    success: true,
    message: "Booking cancelled successfully",
    booking: {
      id: updatedBooking.id,
      status: updatedBooking.status,
      cancelledAt: new Date().toISOString(),
    }
  };
}
export async function updateBookingStatus(bookingId, status, userId, userRole) {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      user: true
    },
  });

  if (!booking) {
    throw { statusCode: 404, message: "Booking not found" };
  }

  // centralized authorization logic
  const isOwner = booking.service.providerId === userId;
  const isAdmin = userRole === "ADMIN";
  const isProvider = userRole === "PROVIDER";

  if (!isAdmin && !isOwner && !isProvider) {
    throw {
      statusCode: 403,
      message: "Not authorized to update this booking",
    };
  }

  // business rule protection
  if (booking.status === "COMPLETED" && status !== "COMPLETED") {
    throw {
      statusCode: 400,
      message: "Completed booking cannot be changed",
    };
  }

  const updatedBooking = await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: { status },
    include: {
      service: { select: { id: true, listingHeadline: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // 🔔 Send notification to user based on status change
  if (updatedBooking.userId) {
    let type, title, message, actionUrl;

    switch (status) {
      case "confirmed":
        type = "BOOKING_CONFIRMED";
        title = "✅ Booking Confirmed";
        message = `Your booking for "${updatedBooking.service.listingHeadline}" has been confirmed!`;
        actionUrl = `/my-bookings/${bookingId}`;
        break;
      case "cancelled":
        type = "BOOKING_CANCELLED";
        title = "❌ Booking Cancelled";
        message = `Your booking for "${updatedBooking.service.listingHeadline}" has been cancelled.`;
        actionUrl = `/my-bookings/${bookingId}`;
        break;
      case "completed":
        type = "BOOKING_COMPLETED";
        title = "⭐ Service Completed";
        message = `Your service "${updatedBooking.service.listingHeadline}" has been completed. Please share your feedback!`;
        actionUrl = `/my-bookings/${bookingId}/review`;
        break;
      default:
        return updatedBooking;
    }

    await notificationService.createNotification(
      updatedBooking.userId,
      type,
      title,
      message,
      {
        type: "BOOKING",
        action: "view_booking",
        actionUrl: actionUrl,
        serviceId: updatedBooking.service.id,
        serviceName: updatedBooking.service.listingHeadline,
        bookingId: bookingId,
        status: status,
      }
    );
  }

  return updatedBooking;
}


export async function trackServiceBookingLinkClick(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, bookingLink: true },
  });

  if (!service) {
    throw { statusCode: 404, message: "Service not found" };
  }

  if (!service.bookingLink) {
    throw { statusCode: 404, message: "Booking link not found for this service" };
  }

  try {
    const analytics = await ensureAnalytics(serviceId);
    const updated = await prisma.serviceAnalytics.update({
      where: { id: analytics.id },
      data: { bookingLinkClicks: { increment: 1 } },
    });

    const destinationUrl =
      service.bookingLink.startsWith("http://") ||
        service.bookingLink.startsWith("https://")
        ? service.bookingLink
        : `${config.backendUrl}${service.bookingLink}`;

    return {
      bookingLink: destinationUrl,
      bookingLinkClicks: updated.bookingLinkClicks,
    };
  } catch (err) {
    console.error("trackServiceBookingLinkClick error:", err.message);
    throw {
      statusCode: 500,
      message: "Failed to track booking link click",
    };
  }
}

export async function trackServiceView(serviceId) {
  try {
    const analytics = await ensureAnalytics(serviceId);
    await prisma.serviceAnalytics.update({
      where: { id: analytics.id },
      data: { views: { increment: 1 } },
    });
  } catch (err) {
    console.error("trackServiceView error:", err.message);
  }
}

export async function trackServiceBooking(serviceId, revenue = 0) {
  try {
    const analytics = await ensureAnalytics(serviceId);
    await prisma.serviceAnalytics.update({
      where: { id: analytics.id },
      data: { bookings: { increment: 1 }, revenue: { increment: revenue } },
    });
  } catch (err) {
    console.error("trackServiceBooking error:", err.message);
  }
}

export async function getServiceAnalytics(providerId) {
  return prisma.service.findMany({
    where: { providerId },
    select: {
      id: true,
      listingHeadline: true,
      status: true,
      isApproved: true,
      analytics: true,
      _count: { select: { bookings: true, messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProviderDashboard(providerId) {
  const services = await prisma.service.findMany({
    where: { providerId },
    select: { id: true },
  });
  const serviceIds = services.map((s) => s.id);
  const [analytics, serviceCounts, recentBookings] = await Promise.all([
    prisma.serviceAnalytics.aggregate({
      where: { serviceId: { in: serviceIds } },
      _sum: { views: true, bookings: true, revenue: true },
      _avg: { rating: true },
    }),
    prisma.service.groupBy({
      by: ["status"],
      where: { providerId },
      _count: true,
    }),
    prisma.serviceBooking.findMany({
      where: { serviceId: { in: serviceIds } },
      include: { service: { select: { id: true, listingHeadline: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return { analytics, serviceCounts, recentBookings };
}

export { ensureAnalytics as createServiceAnalytics };

