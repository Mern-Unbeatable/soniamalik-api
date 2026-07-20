import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, optionalAuth, authorize, canPostThread } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { validate } from '../middlewares/validate.js';
import {
    getAllThreads,
    getThreadById,
    createThread,
    updateThread,
    deleteThread,
    createThreadReply,
    togglePinThread,
    toggleLockThread,
} from '../controllers/thread.controller.js';

const router = Router();

// Validation rules
const createThreadValidation = [
    body('title').notEmpty().trim().withMessage('Thread title is required'),
    body('content').notEmpty().trim().withMessage('Thread description/content is required'),
    body('category')
        .notEmpty()
        .isIn(['GENERAL', 'TRAINING', 'NUTRITION', 'INJURY', 'EQUIPMENT', 'EVENTS', 'SUPPORT', 'OTHER'])
        .withMessage('Valid category is required (GENERAL, TRAINING, NUTRITION, INJURY, EQUIPMENT, EVENTS, SUPPORT, OTHER)'),
];

const updateThreadValidation = [
    body('title').optional().notEmpty().trim().withMessage('Thread title cannot be empty'),
    body('content').optional().notEmpty().trim().withMessage('Thread content cannot be empty'),
    body('category')
        .optional()
        .isIn(['GENERAL', 'TRAINING', 'NUTRITION', 'INJURY', 'EQUIPMENT', 'EVENTS', 'SUPPORT', 'OTHER'])
        .withMessage('Invalid category'),
];

const createReplyValidation = [
    body('content').notEmpty().trim().withMessage('Reply content is required'),
];

router.get('/', optionalAuth, asyncHandler(getAllThreads));
router.get('/:id', optionalAuth, asyncHandler(getThreadById));

// Protected routes - only USER and ADMIN can post/comment
router.post('/', authenticate, canPostThread, createThreadValidation, validate, asyncHandler(createThread));
router.put('/:id', authenticate, canPostThread, updateThreadValidation, validate, asyncHandler(updateThread));
router.delete('/:id', authenticate, canPostThread, asyncHandler(deleteThread));
router.post('/:id/replies', authenticate, canPostThread, createReplyValidation, validate, asyncHandler(createThreadReply));

// Admin only routes
router.patch('/:id/pin', authenticate, authorize('ADMIN'), asyncHandler(togglePinThread));
router.patch('/:id/lock', authenticate, authorize('ADMIN'), asyncHandler(toggleLockThread));

export default router;

