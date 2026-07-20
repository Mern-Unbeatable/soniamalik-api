import prisma from "../config/database.js";

export async function suspendUser(userId, reason, adminId) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Only allow suspending regular users, not admins
  // Check if user is already suspended
  if (user.status === "SUSPENDED") {
    throw new Error("User is already suspended");
  }

  // Prevent admin from suspending themselves
  if (userId === adminId) {
    throw new Error("You cannot suspend yourself");
  }

  // Suspend the user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "SUSPENDED",
      suspensionReason: reason,
      suspendedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      suspensionReason: true,
      suspendedAt: true,
    },
  });

  return updatedUser;
}

export async function unsuspendUser(userId) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is suspended
  if (user.status !== "SUSPENDED") {
    throw new Error("User is not suspended");
  }

  // Unsuspend the user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      suspensionReason: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      suspensionReason: true,
      suspendedAt: true,
    },
  });

  return updatedUser;
}

export async function getSuspendedUsers(filters) {
  const { page = 1, limit = 20, search } = filters;

  const where = {
    status: "SUSPENDED",
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        suspensionReason: true,
        suspendedAt: true,
        avatar: true,
        createdAt: true,
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { suspendedAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
}



export async function getDashboardStats() {
  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Previous month for comparison (2 months ago to last month)
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Total Users
  const totalUsers = await prisma.user.count();

  // New Signups (last month)
  const newSignups = await prisma.user.count({
    where: {
      createdAt: { gte: lastMonth }
    }
  });

  // Previous month new signups for comparison
  const previousNewSignups = await prisma.user.count({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: lastMonth
      }
    }
  });

  // Live Listings (approved events + active services)
  const liveEvents = await prisma.event.count({
    where: { isApproved: true, status: "APPROVED" }
  });
  const liveServices = await prisma.service.count({
    where: { isApproved: true, status: "ACTIVE" }
  });
  const liveListings = liveEvents + liveServices;

  // Previous month live listings for comparison
  const previousLiveEvents = await prisma.event.count({
    where: {
      isApproved: true,
      status: "APPROVED",
      createdAt: { lt: lastMonth }
    }
  });
  const previousLiveServices = await prisma.service.count({
    where: {
      isApproved: true,
      status: "ACTIVE",
      createdAt: { lt: lastMonth }
    }
  });
  const previousLiveListings = previousLiveEvents + previousLiveServices;

  // Signed Kmps (users with phone number)
  const signedKmps = await prisma.user.count({
    where: { phone: { not: null } }
  });

  // Previous month signed Kmps
  const previousSignedKmps = await prisma.user.count({
    where: {
      phone: { not: null },
      createdAt: { lt: lastMonth }
    }
  });

  // Messages (last 30 days)
  const eventMessages = await prisma.eventMessage.count({
    where: { createdAt: { gte: lastMonth } }
  });
  const serviceMessages = await prisma.serviceMessage.count({
    where: { createdAt: { gte: lastMonth } }
  });
  const messages = eventMessages + serviceMessages;

  // Previous month messages
  const previousEventMessages = await prisma.eventMessage.count({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: lastMonth
      }
    }
  });
  const previousServiceMessages = await prisma.serviceMessage.count({
    where: {
      createdAt: {
        gte: twoMonthsAgo,
        lt: lastMonth
      }
    }
  });
  const previousMessages = previousEventMessages + previousServiceMessages;

  // Outbound Clicks (event views + service views)
  const eventViews = await prisma.eventAnalytics.aggregate({
    _sum: { views: true }
  });
  const serviceViews = await prisma.serviceAnalytics.aggregate({
    _sum: { views: true }
  });
  const outboundClicks = (eventViews._sum.views || 0) + (serviceViews._sum.views || 0);

  // Previous month outbound clicks
  const previousEventViews = await prisma.eventAnalytics.aggregate({
    _sum: { views: true },
    where: {
      event: {
        createdAt: { lt: lastMonth }
      }
    }
  });
  const previousServiceViews = await prisma.serviceAnalytics.aggregate({
    _sum: { views: true },
    where: {
      service: {
        createdAt: { lt: lastMonth }
      }
    }
  });
  const previousOutboundClicks = (previousEventViews._sum.views || 0) + (previousServiceViews._sum.views || 0);

  // Pending Approvals
  const pendingEvents = await prisma.event.count({
    where: { status: "PENDING" }
  });
  const pendingServices = await prisma.service.count({
    where: { status: "PENDING" }
  });
  const pendingProducts = await prisma.product.count({
    where: { status: "PENDING" }
  });
  const pendingApprovals = pendingEvents + pendingServices + pendingProducts;

  // Previous month pending approvals
  const previousPendingEvents = await prisma.event.count({
    where: {
      status: "PENDING",
      createdAt: { lt: lastMonth }
    }
  });
  const previousPendingServices = await prisma.service.count({
    where: {
      status: "PENDING",
      createdAt: { lt: lastMonth }
    }
  });
  const previousPendingProducts = await prisma.product.count({
    where: {
      status: "PENDING",
      createdAt: { lt: lastMonth }
    }
  });
  const previousPendingApprovals = previousPendingEvents + previousPendingServices + previousPendingProducts;

  // Flagged Items (banned events + banned services)
  const flaggedEvents = await prisma.event.count({
    where: { status: "BANNED" }
  });
  const flaggedServices = await prisma.service.count({
    where: { status: "BANNED" }
  });
  const flaggedItems = flaggedEvents + flaggedServices;

  // Previous month flagged items
  const previousFlaggedEvents = await prisma.event.count({
    where: {
      status: "BANNED",
      createdAt: { lt: lastMonth }
    }
  });
  const previousFlaggedServices = await prisma.service.count({
    where: {
      status: "BANNED",
      createdAt: { lt: lastMonth }
    }
  });
  const previousFlaggedItems = previousFlaggedEvents + previousFlaggedServices;

  // Calculate percentage change helper
  const getChange = (current, previous) => {
    if (previous === 0 && current === 0) return "0%";
    if (previous === 0) return "+100%";
    const change = ((current - previous) / previous) * 100;
    const rounded = Math.round(Math.abs(change));
    return `${change >= 0 ? "+" : "-"}${rounded}%`;
  };

  return {
    totalUsers: totalUsers.toString(),
    totalUsersChange: getChange(totalUsers, totalUsers - newSignups),
    newSignups: newSignups.toString(),
    newSignupsChange: getChange(newSignups, previousNewSignups),
    liveListings: liveListings.toString(),
    liveListingsChange: getChange(liveListings, previousLiveListings),
    signedKmps: signedKmps.toString(),
    signedKmpsChange: getChange(signedKmps, previousSignedKmps),
    messages: messages.toString(),
    messagesChange: getChange(messages, previousMessages),
    outboundClicks: outboundClicks.toString(),
    outboundClicksChange: getChange(outboundClicks, previousOutboundClicks),
    pendingApprovals: pendingApprovals.toString(),
    pendingApprovalsChange: getChange(pendingApprovals, previousPendingApprovals),
    flaggedItems: flaggedItems.toString(),
    flaggedItemsChange: getChange(flaggedItems, previousFlaggedItems)
  };
}

export async function getUserTrends(period = "year") {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    select: {
      createdAt: true,
      role: true
    }
  });

  // Initialize data structure
  const monthlyData = months.map(month => ({
    month,
    player: 0,
    provider: 0,
    sport: 0
  }));

  // Aggregate users by month and role
  users.forEach(user => {
    const monthIndex = user.createdAt.getMonth();
    const role = user.role;

    if (role === "USER") {
      monthlyData[monthIndex].player++;
    } else if (role === "PROVIDER") {
      monthlyData[monthIndex].provider++;
    } else if (role === "COACH") {
      monthlyData[monthIndex].sport++;
    }
  });

  // Calculate cumulative sums for trend lines
  let cumulativePlayer = 0;
  let cumulativeProvider = 0;
  let cumulativeSport = 0;

  monthlyData.forEach(data => {
    cumulativePlayer += data.player;
    cumulativeProvider += data.provider;
    cumulativeSport += data.sport;

    data.player = cumulativePlayer;
    data.provider = cumulativeProvider;
    data.sport = cumulativeSport;
  });

  return monthlyData;
}

export async function getDemandVsSupply() {
  // Get events by sport type (demand)
  const eventsBySport = await prisma.event.groupBy({
    by: ["sportType"],
    _count: true,
    where: {
      isApproved: true,
      status: "APPROVED",
      sportType: { not: null }
    }
  });

  // Get services by sport (supply) - using sports array field
  const services = await prisma.service.findMany({
    where: {
      isApproved: true,
      status: "ACTIVE"
    },
    select: {
      sports: true
    }
  });

  // Count services per sport (flatten the sports array)
  const serviceCounts = {};
  services.forEach(service => {
    if (service.sports && service.sports.length > 0) {
      service.sports.forEach(sport => {
        serviceCounts[sport] = (serviceCounts[sport] || 0) + 1;
      });
    }
  });

  // Get all unique sport types from events
  const sportTypes = eventsBySport.map(item => item.sportType).filter(Boolean);

  // Add sports from services that aren't in events
  Object.keys(serviceCounts).forEach(sport => {
    if (!sportTypes.includes(sport)) {
      sportTypes.push(sport);
    }
  });

  // If no sports data exists, return empty array
  if (sportTypes.length === 0) {
    return [];
  }

  // Get event counts per sport
  const eventCounts = {};
  eventsBySport.forEach(item => {
    if (item.sportType) {
      eventCounts[item.sportType] = item._count;
    }
  });

  // Calculate max values for percentage scaling
  const demandValues = sportTypes.map(sport => eventCounts[sport] || 0);
  const supplyValues = sportTypes.map(sport => serviceCounts[sport] || 0);
  const maxDemand = Math.max(...demandValues, 1);
  const maxSupply = Math.max(...supplyValues, 1);

  const result = sportTypes.map(sport => {
    let demand = eventCounts[sport] || 0;
    let supply = serviceCounts[sport] || 0;

    // Scale to percentage (0-100) based on actual max values
    const demandPercent = maxDemand > 0 ? Math.round((demand / maxDemand) * 100) : 0;
    const supplyPercent = maxSupply > 0 ? Math.round((supply / maxSupply) * 100) : 0;

    return {
      name: sport,
      demand: demandPercent,
      supply: supplyPercent
    };
  });

  // Sort by demand (highest first)
  return result.sort((a, b) => b.demand - a.demand);
}

export async function getHighDemandAlerts() {
  // Get all events with their registrations and location
  const events = await prisma.event.findMany({
    where: {
      isApproved: true,
      status: "APPROVED",
      city: { not: null }
    },
    include: {
      _count: {
        select: { registrations: true }
      }
    }
  });

  // Get all services by location (supply) - using city field
  const services = await prisma.service.findMany({
    where: {
      isApproved: true,
      status: "ACTIVE",
      city: { not: null }
    },
    select: {
      city: true,
      sports: true
    }
  });

  // Group services by city and sport (using sports array)
  const supplyByLocation = {};
  services.forEach(service => {
    const sportsList = service.sports && service.sports.length > 0 ? service.sports : ["General"];
    sportsList.forEach(sport => {
      const key = `${service.city}|${sport}`;
      supplyByLocation[key] = (supplyByLocation[key] || 0) + 1;
    });
  });

  // Find high demand areas
  const alerts = [];
  const processed = new Set();

  for (const event of events) {
    const location = event.city;
    const sport = event.sportType || "Sports";
    const key = `${location}|${sport}`;

    if (processed.has(key)) continue;
    processed.add(key);

    const demand = event._count.registrations;
    const supply = supplyByLocation[key] || 0;

    // Alert if demand is high (>3 registrations) and supply is low (<2)
    if (demand > 3 && supply < 2) {
      alerts.push({
        sport: sport,
        location: location,
        demand: demand > 8 ? "Very High" : demand > 4 ? "High" : "Medium",
        supply: supply === 0 ? "None" : supply === 1 ? "Low" : "Limited"
      });
    }
  }

  // Return only real alerts (no mock data)
  return alerts.slice(0, 6);
}

export async function getTopLocationsByDemand(limit = 10) {
  // Get all events with registrations count
  const events = await prisma.event.findMany({
    where: {
      isApproved: true,
      status: "APPROVED",
      city: { not: null }
    },
    include: {
      _count: {
        select: { registrations: true }
      }
    }
  });

  // Aggregate demand by city
  const cityDemand = {};
  events.forEach(event => {
    const city = event.city;
    const demand = event._count.registrations;

    if (city) {
      cityDemand[city] = (cityDemand[city] || 0) + demand;
    }
  });

  // If no real data, return empty array
  if (Object.keys(cityDemand).length === 0) {
    return [];
  }

  // Convert to array and sort by demand
  const sortedLocations = Object.entries(cityDemand)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  // Calculate width percentages based on actual max value
  const maxValue = sortedLocations[0]?.value || 1;

  return sortedLocations.map(location => ({
    name: location.name,
    value: location.value,
    width: Math.min(Math.round((location.value / maxValue) * 70), 70)
  }));
}

export async function exportDashboardData() {
  const stats = await getDashboardStats();
  const trends = await getUserTrends();
  const demandSupply = await getDemandVsSupply();
  const locations = await getTopLocationsByDemand(10);

  // Create CSV content
  let csv = "=== DASHBOARD STATS ===\n";
  csv += "Metric,Value,Change\n";
  csv += `Total Users,${stats.totalUsers},${stats.totalUsersChange}\n`;
  csv += `New Signups,${stats.newSignups},${stats.newSignupsChange}\n`;
  csv += `Live Listings,${stats.liveListings},${stats.liveListingsChange}\n`;
  csv += `Signed Kmps,${stats.signedKmps},${stats.signedKmpsChange}\n`;
  csv += `Messages,${stats.messages},${stats.messagesChange}\n`;
  csv += `Outbound Clicks,${stats.outboundClicks},${stats.outboundClicksChange}\n`;
  csv += `Pending Approvals,${stats.pendingApprovals},${stats.pendingApprovalsChange}\n`;
  csv += `Flagged Items,${stats.flaggedItems},${stats.flaggedItemsChange}\n\n`;

  csv += "=== USER TRENDS ===\n";
  csv += "Month,Player,Provider,Sport Provider\n";
  trends.forEach(t => {
    csv += `${t.month},${t.player},${t.provider},${t.sport}\n`;
  });
  csv += "\n";

  csv += "=== DEMAND VS SUPPLY ===\n";
  csv += "Sport,Demand (%),Supply (%)\n";
  demandSupply.forEach(d => {
    csv += `${d.name},${d.demand},${d.supply}\n`;
  });
  csv += "\n";

  csv += "=== TOP LOCATIONS BY DEMAND ===\n";
  csv += "Location,Interest\n";
  locations.forEach(l => {
    csv += `${l.name},${l.value}\n`;
  });

  return csv;
}

export async function getConversionFunnel() {
  const eventViews = await prisma.eventAnalytics.aggregate({
    _sum: { views: true }
  });
  const serviceViews = await prisma.serviceAnalytics.aggregate({
    _sum: { views: true }
  });
  const totalVisits = (eventViews._sum.views || 0) + (serviceViews._sum.views || 0);

  const totalSearches = totalVisits;


  const uniqueEventViews = await prisma.event.count({
    where: { isApproved: true }
  });
  const uniqueServiceViews = await prisma.service.count({
    where: { isApproved: true }
  });
  const listingViews = uniqueEventViews + uniqueServiceViews;


  const eventInterests = await prisma.eventRegistration.count({
    where: { status: "interested" }
  });
  const serviceInterests = await prisma.serviceBooking.count({
    where: { type: "interest" }
  });
  const totalInterests = eventInterests + serviceInterests;


  const eventRegistrations = await prisma.eventRegistration.count({
    where: { status: { not: "interested" } }
  });
  const serviceBookings = await prisma.serviceBooking.count({
    where: { type: "booking" }
  });
  const totalContacts = eventRegistrations + serviceBookings;
  const visitsToSearch = totalSearches > 0 ? Math.round((totalSearches / totalVisits) * 100) : 0;
  const searchToListing = totalSearches > 0 ? Math.round((listingViews / totalSearches) * 100) : 0;
  const viewToInterest = listingViews > 0 ? Math.round((totalInterests / listingViews) * 100) : 0;
  const interestToContact = totalInterests > 0 ? Math.round((totalContacts / totalInterests) * 100) : 0;

  return [
    { label: "Visits to Search", percentage: visitsToSearch },
    { label: "Search to Listing View", percentage: searchToListing },
    { label: "View to Register Interest", percentage: viewToInterest },
    { label: "Interest to Contact", percentage: interestToContact }
  ];
}

export async function getContactMetadata(filters = {}) {
  const { page = 1, limit = 20, search } = filters;
  const skip = (page - 1) * limit;

  // Get all services with their message stats
  const services = await prisma.service.findMany({
    where: {
      isApproved: true,
      ...(search && {
        OR: [
          { listingHeadline: { contains: search, mode: "insensitive" } },
          { providerName: { contains: search, mode: "insensitive" } }
        ]
      })
    },
    select: {
      id: true,
      listingHeadline: true,
      providerName: true,
      providerId: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      messages: {
        select: {
          id: true,
          createdAt: true,
          isRead: true,
          parentId: true,
          replies: {
            select: {
              id: true,
              createdAt: true,
              senderId: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: true,
          bookings: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: parseInt(limit)
  });

  // Get all events with their message stats
  const events = await prisma.event.findMany({
    where: {
      isApproved: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { organizerName: { contains: search, mode: "insensitive" } }
        ]
      })
    },
    select: {
      id: true,
      title: true,
      organizerName: true,
      organizerId: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      },
      messages: {
        select: {
          id: true,
          createdAt: true,
          isReply: true,
          parentId: true,
          replies: {
            select: {
              id: true,
              createdAt: true,
              userId: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: true,
          registrations: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: parseInt(limit)
  });

  // Process service data
  const serviceMetadata = services.map(service => {
    const rootMessages = service.messages.filter(m => !m.parentId);
    let totalReplies = 0;
    let responseTimes = [];

    rootMessages.forEach(msg => {
      const replies = msg.replies || [];
      totalReplies += replies.length;

      // Calculate response time for first reply
      if (replies.length > 0) {
        const responseTime = new Date(replies[0].createdAt) - new Date(msg.createdAt);
        responseTimes.push(responseTime);
      }
    });

    const totalMessages = service.messages.length;
    const unanswered = rootMessages.filter(msg => msg.replies.length === 0).length;

    // Calculate average response time in minutes or hours
    let avgResponse = "N/A";
    if (responseTimes.length > 0) {
      const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const avgMinutes = Math.floor(avgMs / 60000);
      if (avgMinutes < 60) {
        avgResponse = `${avgMinutes}m`;
      } else {
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;
        avgResponse = `${hours}h ${minutes}m`;
      }
    }

    return {
      id: service.id,
      type: "service",
      listing: service.listingHeadline || "Untitled Service",
      provider: service.providerName,
      providerId: service.providerId,
      providerDetails: service.provider,
      received: totalMessages,
      replies: totalReplies,
      avgResponse: avgResponse,
      unanswered: unanswered,
      flagged: service._count.bookings || 0
    };
  });

  // Process event data
  const eventMetadata = events.map(event => {
    const rootMessages = event.messages.filter(m => !m.parentId && !m.isReply);
    let totalReplies = 0;
    let responseTimes = [];

    rootMessages.forEach(msg => {
      const replies = msg.replies || [];
      totalReplies += replies.length;

      if (replies.length > 0) {
        const responseTime = new Date(replies[0].createdAt) - new Date(msg.createdAt);
        responseTimes.push(responseTime);
      }
    });

    const totalMessages = event.messages.length;
    const unanswered = rootMessages.filter(msg => msg.replies.length === 0).length;

    let avgResponse = "N/A";
    if (responseTimes.length > 0) {
      const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const avgMinutes = Math.floor(avgMs / 60000);
      if (avgMinutes < 60) {
        avgResponse = `${avgMinutes}m`;
      } else {
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;
        avgResponse = `${hours}h ${minutes}m`;
      }
    }

    return {
      id: event.id,
      type: "event",
      listing: event.title || "Untitled Event",
      provider: event.organizerName,
      providerId: event.organizerId,
      providerDetails: event.organizer,
      received: totalMessages,
      replies: totalReplies,
      avgResponse: avgResponse,
      unanswered: unanswered,
      flagged: event._count.registrations || 0
    };
  });

  // Combine and sort by received count (highest first)
  const allMetadata = [...serviceMetadata, ...eventMetadata]
    .sort((a, b) => b.received - a.received);

  const total = allMetadata.length;

  return {
    data: allMetadata,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get register interests for admin dashboard (event registrations + service bookings)
 */
export async function getRegisterInterests(filters = {}) {
  const { page = 1, limit = 20, status, search, sport } = filters;
  const skip = (page - 1) * limit;

  // Get service bookings (type: booking)
  const serviceBookings = await prisma.serviceBooking.findMany({
    where: {
      type: "booking",
      ...(status && { status }),
      ...(sport && {
        service: {
          sports: { has: sport }
        }
      }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          {
            service: {
              listingHeadline: { contains: search, mode: "insensitive" }
            }
          }
        ]
      })
    },
    include: {
      service: {
        select: {
          id: true,
          listingHeadline: true,
          sports: true,
          providerName: true,
          providerId: true,
          city: true,
          location: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: parseInt(limit)
  });

  // Get event registrations (status not equal to "interested")
  const eventRegistrations = await prisma.eventRegistration.findMany({
    where: {
      status: { not: "interested" },
      ...(status && { status }),
      ...(sport && {
        event: {
          sportType: { contains: sport, mode: "insensitive" }
        }
      }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          {
            event: {
              title: { contains: search, mode: "insensitive" }
            }
          }
        ]
      })
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          sportType: true,
          organizerName: true,
          organizerId: true,
          city: true,
          venueName: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: parseInt(limit)
  });

  // Process service bookings
  const processedServices = serviceBookings.map(booking => {
    // Calculate response time (time between booking creation and now)
    const createdAt = new Date(booking.createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - createdAt) / 60000);

    let responseTime = "";
    if (diffMinutes < 60) {
      responseTime = `${diffMinutes}m`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      responseTime = `${hours}h`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      responseTime = `${days}d`;
    }

    return {
      id: booking.id,
      type: "service",
      userId: booking.userId || booking.user?.id,
      userName: booking.user?.name || booking.fullName,
      userEmail: booking.user?.email || booking.email,
      userPhone: booking.user?.phone || booking.phoneNumber,
      listingId: booking.serviceId,
      listing: booking.service?.listingHeadline || "Unknown Service",
      sport: booking.service?.sports?.[0] || "Not specified",
      location: booking.service?.city || booking.service?.location || "Not specified",
      date: new Date(booking.createdAt).toLocaleDateString('en-GB'),
      responseTime: responseTime,
      provider: booking.service?.providerName || "Unknown Provider",
      providerId: booking.service?.providerId,
      status: booking.status === "pending" ? "Pending" :
        booking.status === "confirmed" ? "Contacted" :
          booking.status === "completed" ? "Completed" :
            booking.status === "cancelled" ? "Cancelled" : "Pending",
      originalStatus: booking.status,
      originalData: booking
    };
  });

  // Process event registrations
  const processedEvents = eventRegistrations.map(registration => {
    const createdAt = new Date(registration.createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now - createdAt) / 60000);

    let responseTime = "";
    if (diffMinutes < 60) {
      responseTime = `${diffMinutes}m`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      responseTime = `${hours}h`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      responseTime = `${days}d`;
    }

    return {
      id: registration.id,
      type: "event",
      userId: registration.userId || registration.user?.id,
      userName: registration.user?.name || registration.fullName,
      userEmail: registration.user?.email || registration.email,
      userPhone: registration.user?.phone || registration.phoneNumber,
      listingId: registration.eventId,
      listing: registration.event?.title || "Unknown Event",
      sport: registration.event?.sportType || "Not specified",
      location: registration.event?.city || registration.event?.venueName || "Not specified",
      date: new Date(registration.createdAt).toLocaleDateString('en-GB'),
      responseTime: responseTime,
      provider: registration.event?.organizerName || "Unknown Organizer",
      providerId: registration.event?.organizerId,
      status: registration.status === "pending" ? "Pending" :
        registration.status === "confirmed" ? "Contacted" :
          registration.status === "completed" ? "Completed" :
            registration.status === "cancelled" ? "Cancelled" : "Pending",
      originalStatus: registration.status,
      originalData: registration
    };
  });

  // Combine and sort by date (newest first)
  const allInterests = [...processedServices, ...processedEvents]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = allInterests.length;
  const start = skip;
  const end = start + parseInt(limit);
  const paginatedData = allInterests.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}