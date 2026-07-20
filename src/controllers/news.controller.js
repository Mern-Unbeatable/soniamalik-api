import * as newsService from '../services/news.service.js';
import { sendSuccess, sendError, sendPaginatedResponse } from '../utils/response.js';


export async function getAllNews(req, res) {
    try {
        const filters = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 12,
            status: req.query.status,
            search: req.query.search,
        };

        // If user is not admin, force PUBLISHED status
        if (!req.user || req.user.role !== 'ADMIN') {
            filters.status = 'PUBLISHED';
        }

        const result = await newsService.getAllNews(filters);

        return sendPaginatedResponse(res, 200, 'News retrieved successfully', result.news, {
            currentPage: result.page,
            totalPages: Math.ceil(result.total / result.limit),
            totalItems: result.total,
            itemsPerPage: result.limit,
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to retrieve news');
    }
}


export async function getNewsById(req, res) {
    try {
        const { id } = req.params;

        const news = await newsService.getNewsById(id);

        // If news is not published, only admin can view
        if (news.status !== 'PUBLISHED' && (!req.user || req.user.role !== 'ADMIN')) {
            return sendError(res, 403, 'This news article is not available');
        }

        return sendSuccess(res, 200, 'News retrieved successfully', news);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to retrieve news');
    }
}

export async function createNews(req, res) {
    try {
        const authorId = req.user.id;
        const newsData = {
            title: req.body.title,
            content: req.body.content,
            excerpt: req.body.excerpt,
            image: req.body.image, // Set by upload middleware
            status: req.body.status || 'DRAFT',
        };

        // If status is PUBLISHED, set publishedAt
        if (newsData.status === 'PUBLISHED') {
            newsData.publishedAt = new Date();
        }

        const news = await newsService.createNews(newsData, authorId);

        return sendSuccess(res, 201, 'News created successfully', news);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to create news');
    }
}

export async function updateNews(req, res) {
    try {
        const { id } = req.params;
        const updateData = {};

        // Only include fields that are provided
        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.content !== undefined) updateData.content = req.body.content;
        if (req.body.excerpt !== undefined) updateData.excerpt = req.body.excerpt;
        if (req.body.image !== undefined) updateData.image = req.body.image;
        if (req.body.status !== undefined) {
            updateData.status = req.body.status;

            // If changing status to PUBLISHED and not already published, set publishedAt
            if (req.body.status === 'PUBLISHED') {
                const existingNews = await newsService.getNewsById(id);
                if (!existingNews.publishedAt) {
                    updateData.publishedAt = new Date();
                }
            }
        }

        const news = await newsService.updateNews(id, updateData);

        return sendSuccess(res, 200, 'News updated successfully', news);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to update news');
    }
}


export async function deleteNews(req, res) {
    try {
        const { id } = req.params;

        await newsService.deleteNews(id);

        return sendSuccess(res, 200, 'News deleted successfully', null);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to delete news');
    }
}

export async function publishNews(req, res) {
    try {
        const { id } = req.params;

        const news = await newsService.publishNews(id);

        return sendSuccess(res, 200, 'News published successfully', news);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to publish news');
    }
}

export async function unpublishNews(req, res) {
    try {
        const { id } = req.params;

        const news = await newsService.unpublishNews(id);

        return sendSuccess(res, 200, 'News unpublished successfully', news);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message || 'Failed to unpublish news');
    }
}
