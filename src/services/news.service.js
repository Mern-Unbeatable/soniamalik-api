import prisma from '../config/database.js';

/**
 * Get all news with pagination and filters
 */
export async function getAllNews(filters) {
    const { page = 1, limit = 8000, status, search } = filters;

    const where = {};

    if (status) {
        where.status = status;
    } else {
        // By default, show only published news to non-admin users
        where.status = 'PUBLISHED';
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [news, total] = await Promise.all([
        prisma.news.findMany({
            where,
            skip: (page - 1) * limit,
            take: parseInt(limit),
            orderBy: { publishedAt: 'desc' },
        }),
        prisma.news.count({ where }),
    ]);

    return { news, total, page: parseInt(page), limit: parseInt(limit) };
}

/**
 * Get news by ID
 */

export async function getNewsById(newsId) {
    const news = await prisma.news.findUnique({
        where: { id: newsId },
    });

    if (!news) {
        throw { statusCode: 404, message: 'News not found' };
    }

    // Increment view count
    await prisma.news.update({
        where: { id: newsId },
        data: {
            views: {
                increment: 1,
            },
        },
    });

    return news;
}

/**
 * Create news article (Admin only)
 */
export async function createNews(newsData, authorId) {
    const news = await prisma.news.create({
        data: {
            ...newsData,
            authorId,
        },
    });

    return news;
}



export async function updateNews(newsId, updateData) {
    const news = await prisma.news.findUnique({
        where: { id: newsId },
    });

    if (!news) {
        throw { statusCode: 404, message: 'News not found' };
    }

    const updated = await prisma.news.update({
        where: { id: newsId },
        data: updateData,
    });

    return updated;
}


export async function deleteNews(newsId) {
    const news = await prisma.news.findUnique({
        where: { id: newsId },
    });

    if (!news) {
        throw { statusCode: 404, message: 'News not found' };
    }

    await prisma.news.delete({
        where: { id: newsId },
    });

    return true;
}

export async function publishNews(newsId) {
    const news = await prisma.news.update({
        where: { id: newsId },
        data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
        },
    });

    return news;
}



export async function unpublishNews(newsId) {
    const news = await prisma.news.update({
        where: { id: newsId },
        data: {
            status: 'DRAFT',
            publishedAt: null,
        },
    });

    return news;
}
