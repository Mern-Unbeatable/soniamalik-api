import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { uploadSingleImage } from '../middlewares/upload.js';
import * as newsController from '../controllers/news.controller.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(newsController.getAllNews));
router.get('/:id', optionalAuth, asyncHandler(newsController.getNewsById));

/**
 * Admin Routes
 * POST /api/news - Create news article (with optional image upload)
 * PUT /api/news/:id - Update news article (with optional image upload)
 * DELETE /api/news/:id - Delete news article
 * PATCH /api/news/:id/publish - Publish news article (set status to PUBLISHED)
 * PATCH /api/news/:id/unpublish - Unpublish news article (set status to DRAFT)
 */
router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    uploadSingleImage('image', 'news'),
    asyncHandler(newsController.createNews)
);

router.put(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    uploadSingleImage('image', 'news'),
    asyncHandler(newsController.updateNews)
);

router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(newsController.deleteNews));

router.patch('/:id/publish', authenticate, authorize('ADMIN'), asyncHandler(newsController.publishNews));

router.patch('/:id/unpublish', authenticate, authorize('ADMIN'), asyncHandler(newsController.unpublishNews));

export default router;
