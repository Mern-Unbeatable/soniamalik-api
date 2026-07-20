import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { uploadSingleImage } from '../middlewares/upload.js';
import * as clubController from '../controllers/club.controller.js';

const router = Router();

/**
 * Coach Routes
 * GET /api/clubs/my - Get coach's own club
 * POST /api/clubs - Create club (one per coach)
 * PUT /api/clubs/:id - Update club (own club only)
 * PATCH /api/clubs/:id/stats - Update club statistics (own club only)
 */
router.get('/my', authenticate, authorize('COACH'), asyncHandler(clubController.getMyClub));

router.post(
    '/',
    authenticate,
    authorize('COACH'),
    uploadSingleImage('image', 'clubs'),
    asyncHandler(clubController.createClub)
);

router.put(
    '/:id',
    authenticate,
    authorize('COACH', 'ADMIN'),
    uploadSingleImage('image', 'clubs'),
    asyncHandler(clubController.updateClub)
);

router.patch(
    '/:id/stats',
    authenticate,
    authorize('COACH', 'ADMIN'),
    asyncHandler(clubController.updateClubStats)
);

/**
 * Public/Admin Routes
 * GET /api/clubs - Get all clubs (Admin: all clubs, Coach: own club)
 * GET /api/clubs/:id - Get club by ID
 * DELETE /api/clubs/:id - Delete club (Admin only)
 */
router.get('/', authenticate, asyncHandler(clubController.getAllClubs));

router.get('/:id', authenticate, asyncHandler(clubController.getClubById));

router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(clubController.deleteClub));

export default router;
