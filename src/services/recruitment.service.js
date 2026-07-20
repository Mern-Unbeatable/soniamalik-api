import prisma from '../config/database.js';

/**
 * Get all recruitments with pagination and filters
 */
export async function getAllRecruitments(filters) {
    const { page = 1, limit = 8000, status, positionType, search } = filters;

    const where = {};

    if (status) {
        where.status = status;
    }

    if (positionType) {
        where.positionType = positionType;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [recruitments, total] = await Promise.all([
        prisma.recruitment.findMany({
            where,
            include: {
                poster: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
        }),
        prisma.recruitment.count({ where }),
    ]);

    return { recruitments, total, page: parseInt(page), limit: parseInt(limit) };
}

/**
 * Get recruitment by ID
 */
export async function getRecruitmentById(recruitmentId) {
    const recruitment = await prisma.recruitment.findUnique({
        where: { id: recruitmentId },
        include: {
            poster: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
            applications: {
                include: {
                    recruitment: {
                        select: {
                            title: true,
                            position: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!recruitment) {
        throw { statusCode: 404, message: 'Recruitment not found' };
    }

    return recruitment;
}

/**
 * Create new recruitment
 */
export async function createRecruitment(recruitmentData, posterId) {
    const recruitment = await prisma.recruitment.create({
        data: {
            ...recruitmentData,
            posterId,
        },
        include: {
            poster: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return recruitment;
}

/**
 * Update recruitment
 */
export async function updateRecruitment(recruitmentId, updateData, userId, userRole) {
    const recruitment = await prisma.recruitment.findUnique({
        where: { id: recruitmentId },
    });

    if (!recruitment) {
        throw { statusCode: 404, message: 'Recruitment not found' };
    }

    if (userRole !== 'ADMIN' && recruitment.posterId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to update this recruitment' };
    }

    const updated = await prisma.recruitment.update({
        where: { id: recruitmentId },
        data: updateData,
        include: {
            poster: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return updated;
}

/**
 * Delete recruitment
 */
export async function deleteRecruitment(recruitmentId, userId, userRole) {
    const recruitment = await prisma.recruitment.findUnique({
        where: { id: recruitmentId },
    });

    if (!recruitment) {
        throw { statusCode: 404, message: 'Recruitment not found' };
    }

    if (userRole !== 'ADMIN' && recruitment.posterId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to delete this recruitment' };
    }

    await prisma.recruitment.delete({
        where: { id: recruitmentId },
    });

    return true;
}

/**
 * Apply to recruitment
 */
export async function applyToRecruitment(applicationData) {
    const { recruitmentId, applicantName, email, phone, resume, coverLetter } = applicationData;

    const recruitment = await prisma.recruitment.findUnique({
        where: { id: recruitmentId },
    });

    if (!recruitment) {
        throw { statusCode: 404, message: 'Recruitment not found' };
    }

    if (recruitment.status !== 'OPEN') {
        throw { statusCode: 400, message: 'Recruitment is not open for applications' };
    }

    if (recruitment.deadline && new Date(recruitment.deadline) < new Date()) {
        throw { statusCode: 400, message: 'Application deadline has passed' };
    }

    const application = await prisma.recruitmentApplication.create({
        data: {
            recruitmentId,
            applicantName,
            email,
            phone,
            resume,
            coverLetter,
        },
    });

    return application;
}

/**
 * Get applications for a recruitment
 */
export async function getRecruitmentApplications(recruitmentId, userId, userRole) {
    const recruitment = await prisma.recruitment.findUnique({
        where: { id: recruitmentId },
    });

    if (!recruitment) {
        throw { statusCode: 404, message: 'Recruitment not found' };
    }

    // Only poster and admin can view applications
    if (userRole !== 'ADMIN' && recruitment.posterId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to view applications' };
    }

    const applications = await prisma.recruitmentApplication.findMany({
        where: { recruitmentId },
        orderBy: { createdAt: 'desc' },
    });

    return applications;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(applicationId, status, userId, userRole) {
    const application = await prisma.recruitmentApplication.findUnique({
        where: { id: applicationId },
        include: {
            recruitment: true,
        },
    });

    if (!application) {
        throw { statusCode: 404, message: 'Application not found' };
    }

    // Only poster and admin can update application status
    if (userRole !== 'ADMIN' && application.recruitment.posterId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to update application status' };
    }

    const updated = await prisma.recruitmentApplication.update({
        where: { id: applicationId },
        data: { status },
    });

    return updated;
}
