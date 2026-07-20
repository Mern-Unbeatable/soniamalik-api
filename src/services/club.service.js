import prisma from "../config/database.js";
//alif
export async function getAllClubs(filters, userId, userRole) {
  const { page = 1, limit = 8000, status, search } = filters;

  const where = {};

  // If user is a coach, only show their club
  if (userRole === "COACH" && userId) {
    where.coachId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { ownerName: { contains: search, mode: "insensitive" } },
      { fullAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.club.count({ where }),
  ]);

  return { clubs, total, page: parseInt(page), limit: parseInt(limit) };
}

export async function getClubById(clubId, userId, userRole) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!club) {
    throw { statusCode: 404, message: "Club not found" };
  }

  // If user is a coach, only allow viewing their own club
  if (userRole === "COACH" && club.coachId !== userId) {
    throw { statusCode: 403, message: "Not authorized to view this club" };
  }

  return club;
}

export async function getClubByCoachId(coachId) {
  const club = await prisma.club.findFirst({
    where: { coachId },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return club; // Can be null if coach hasn't created a club yet
}

export async function createClub(clubData, coachId) {
  // Check if coach already has a club
  const existingClub = await prisma.club.findFirst({
    where: { coachId },
  });

  if (existingClub) {
    throw {
      statusCode: 400,
      message:
        "You already have a club registered. Please update your existing club instead.",
    };
  }

  const club = await prisma.club.create({
    data: {
      ...clubData,
      coachId,
    },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return club;
}

/**
 * Update club
 */
export async function updateClub(clubId, updateData, userId, userRole) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
  });

  if (!club) {
    throw { statusCode: 404, message: "Club not found" };
  }

  // Only admin or club coach can update
  if (userRole !== "ADMIN" && club.coachId !== userId) {
    throw { statusCode: 403, message: "Not authorized to update this club" };
  }

  const updated = await prisma.club.update({
    where: { id: clubId },
    data: updateData,
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Delete club (Admin only)
 */
export async function deleteClub(clubId, userId, userRole) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
  });

  if (!club) {
    throw { statusCode: 404, message: "Club not found" };
  }

  // Only admin can delete
  if (userRole !== "ADMIN") {
    throw { statusCode: 403, message: "Only administrators can delete clubs" };
  }

  await prisma.club.delete({
    where: { id: clubId },
  });

  return true;
}

/**
 * Update club statistics
 */
export async function updateClubStats(clubId, statsData) {
  const updateFields = {};

  if (statsData.activePlayers !== undefined)
    updateFields.activePlayers = statsData.activePlayers;
  if (statsData.coachesCount !== undefined)
    updateFields.coachesCount = statsData.coachesCount;
  if (statsData.teamsCount !== undefined)
    updateFields.teamsCount = statsData.teamsCount;
  if (statsData.hostingSessions !== undefined)
    updateFields.hostingSessions = statsData.hostingSessions;

  const club = await prisma.club.update({
    where: { id: clubId },
    data: updateFields,
  });

  return club;
}
