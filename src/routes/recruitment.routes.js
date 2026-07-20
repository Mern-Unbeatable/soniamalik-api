import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Get all recruitments - TODO: Implement' });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Get recruitment by ID - TODO: Implement' });
}));

router.post('/', authenticate, authorize('COACH', 'ADMIN'), asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Create recruitment - TODO: Implement' });
}));

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Update recruitment - TODO: Implement' });
}));

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Delete recruitment - TODO: Implement' });
}));

router.post('/:id/apply', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Apply to recruitment - TODO: Implement' });
}));

export default router;
