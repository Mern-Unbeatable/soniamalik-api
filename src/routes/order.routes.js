import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Get all orders - TODO: Implement' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Get order by ID - TODO: Implement' });
}));

router.post('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Create order - TODO: Implement' });
}));

router.put('/:id', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'Update order - TODO: Implement' });
}));

export default router;
