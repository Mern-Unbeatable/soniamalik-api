import prisma from "../config/database.js";


export async function createInterestRequest(userId, data) {
    const {
        sportName,
        otherSportName,
        level,
        preferredDays,
        preference,
        wantToHelpStart
    } = data;

    if (!sportName) {
        throw { statusCode: 400, message: "Sport name is required" };
    }

    if (sportName === "Other" && !otherSportName) {
        throw { statusCode: 400, message: "Please specify the sport name" };
    }

    const interestRequest = await prisma.userInterestRequest.create({
        data: {
            userId,
            sportName,
            otherSportName: sportName === "Other" ? otherSportName : null,
            level,
            preferredDays: preferredDays || [],
            preference,
            wantToHelpStart: wantToHelpStart || false,
            status: "PENDING"
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true
                }
            }
        }
    });

    return interestRequest;
}


export async function getAllInterestRequests(filters = {}) {
    const { page = 1, limit = 20, status, sportName } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
        where.status = status;
    }

    if (sportName) {
        where.sportName = sportName;
    }

    const [requests, total] = await Promise.all([
        prisma.userInterestRequest.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        createdAt: true
                    }
                }
            }
        }),
        prisma.userInterestRequest.count({ where })
    ]);

    return {
        requests,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
}


export async function getUserInterestRequests(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        prisma.userInterestRequest.findMany({
            where: { userId },
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        }),
        prisma.userInterestRequest.count({ where: { userId } })
    ]);

    return {
        requests,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        }
    };
}


export async function getInterestRequestById(requestId, userId, userRole) {
    const request = await prisma.userInterestRequest.findUnique({
        where: { id: requestId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                    createdAt: true
                }
            }
        }
    });

    if (!request) {
        throw { statusCode: 404, message: "Interest request not found" };
    }

    // Check authorization: user can view their own, admin can view all
    if (request.userId !== userId && userRole !== "ADMIN") {
        throw { statusCode: 403, message: "Not authorized to view this request" };
    }

    return request;
}


export async function updateRequestStatus(requestId, status, adminNotes = null) {
    const request = await prisma.userInterestRequest.findUnique({
        where: { id: requestId }
    });

    if (!request) {
        throw { statusCode: 404, message: "Interest request not found" };
    }

    const validStatuses = ["PENDING", "CONTACTED", "RESOLVED"];
    if (!validStatuses.includes(status)) {
        throw { statusCode: 400, message: "Invalid status" };
    }

    const updatedRequest = await prisma.userInterestRequest.update({
        where: { id: requestId },
        data: {
            status,
            adminNotes: adminNotes || undefined,
            updatedAt: new Date()
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            }
        }
    });

    return updatedRequest;
}


export async function deleteInterestRequest(requestId, userId, userRole) {
    const request = await prisma.userInterestRequest.findUnique({
        where: { id: requestId }
    });

    if (!request) {
        throw { statusCode: 404, message: "Interest request not found" };
    }

    if (request.userId !== userId && userRole !== "ADMIN") {
        throw { statusCode: 403, message: "Not authorized to delete this request" };
    }

    await prisma.userInterestRequest.delete({
        where: { id: requestId }
    });

    return { success: true, message: "Interest request deleted successfully" };
}

