import prisma from '../config/database.js';

/**
 * Get all threads with pagination and filters
 */
export async function getAllThreads(filters) {
    const { page = 1, limit = 8000, category, status, search } = filters;

    const where = {};

    if (category) {
        where.category = category;
    }

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [threads, total] = await Promise.all([
        prisma.thread.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' },
            ],
        }),
        prisma.thread.count({ where }),
    ]);

    return { threads, total, page: parseInt(page), limit: parseInt(limit) };
}

export async function getThreadById(threadId) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
            replies: {
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!thread) {
        throw { statusCode: 404, message: 'Thread not found' };
    }

    // Increment view count
    await prisma.thread.update({
        where: { id: threadId },
        data: {
            views: {
                increment: 1,
            },
        },
    });

    return thread;
}


export async function createThread(threadData, authorId) {
    const thread = await prisma.thread.create({
        data: {
            ...threadData,
            authorId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return thread;
}

export async function updateThread(threadId, updateData, userId, userRole) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
    });

    if (!thread) {
        throw { statusCode: 404, message: 'Thread not found' };
    }

    if (userRole !== 'ADMIN' && thread.authorId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to update this thread' };
    }

    const updatedThread = await prisma.thread.update({
        where: { id: threadId },
        data: updateData,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return updatedThread;
}

export async function deleteThread(threadId, userId, userRole) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
    });

    if (!thread) {
        throw { statusCode: 404, message: 'Thread not found' };
    }

    if (userRole !== 'ADMIN' && thread.authorId !== userId) {
        throw { statusCode: 403, message: 'Not authorized to delete this thread' };
    }

    await prisma.thread.delete({
        where: { id: threadId },
    });

    return true;
}

export async function createThreadReply(threadId, content, authorId) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
    });

    if (!thread) {
        throw { statusCode: 404, message: 'Thread not found' };
    }

    if (thread.isLocked) {
        throw { statusCode: 400, message: 'Thread is locked' };
    }

    const reply = await prisma.threadReply.create({
        data: {
            threadId,
            content,
            authorId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    return reply;
}

export async function togglePinThread(threadId) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
    });

    if (!thread) {
        throw { statusCode: 404, message: 'Thread not found' };
    }

    const updated = await prisma.thread.update({
        where: { id: threadId },
        data: {
            isPinned: !thread.isPinned,
        },
    });

    return updated;
}

export async function toggleLockThread(threadId) {
    const thread = await prisma.thread.findUnique({
        where: { id: threadId },
    });

    if (!thread) {
        throw { statusCode: 404, message: 'Thread not found' };
    }

    const updated = await prisma.thread.update({
        where: { id: threadId },
        data: {
            isLocked: !thread.isLocked,
        },
    });

    return updated;
}
