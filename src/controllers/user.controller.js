import { sendSuccess, sendError, sendPaginatedResponse } from '../utils/response.js';
import * as userService from '../services/user.service.js';

export async function getAllUsers(req, res) {
    try {
        const { users, total, page, limit } = await userService.getAllUsers(req.query);
        return sendPaginatedResponse(res, users, page, limit, total);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}



export async function getUserById(req, res) {
    try {
        const { id } = req.params;

        // Check authorization
        if (!userService.canAccessUser(req.user, id)) {
            return sendError(res, 403, 'Access denied');
        }

        const user = await userService.getUserById(id);

        // If requesting own profile, return all data
        // If admin viewing other user, you might want to limit some fields
        const isOwnProfile = req.user.id === id;

        return sendSuccess(res, 200, 'User retrieved successfully', {
            user,
            isOwnProfile // Optional: let frontend know if it's own profile
        });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}
export async function getMyProfile(req, res) {
    try {
        // Get the authenticated user's ID from the token
        const userId = req.user.id;

        const user = await userService.getUserById(userId);
        return sendSuccess(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function updateUser(req, res) {
    try {
        const { id } = req.params;

        // Check authorization
        if (!userService.canAccessUser(req.user, id)) {
            return sendError(res, 403, 'Access denied');
        }

        const user = await userService.updateUser(id, req.body);
        return sendSuccess(res, 200, 'User updated successfully', { user });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}


export async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user.id === id) {
            return sendError(res, 400, 'You cannot delete your own account');
        }

        await userService.deleteUser(id);
        return sendSuccess(res, 200, 'User deleted successfully');
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function updateBillingAddress(req, res) {
    try {
        const { id } = req.params;

        // Check authorization - user can only update their own address
        if (!userService.canAccessUser(req.user, id)) {
            return sendError(res, 403, 'Access denied');
        }

        const user = await userService.updateBillingAddress(id, req.body);
        return sendSuccess(res, 200, 'Billing address updated successfully', { user });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}


export async function updateShippingAddress(req, res) {
    try {
        const { id } = req.params;

        // Check authorization - user can only update their own address
        if (!userService.canAccessUser(req.user, id)) {
            return sendError(res, 403, 'Access denied');
        }

        const user = await userService.updateShippingAddress(id, req.body);
        return sendSuccess(res, 200, 'Shipping address updated successfully', { user });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}
/**
 * Get user's comments with replies
 */
export async function getUserComments(req, res) {
    try {
        const userId = req.user.id; // Get authenticated user ID from token
        console.log('Fetching comments for user:', userId);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await userService.getUserCommentsWithReplies(userId, page, limit);
        return sendSuccess(res, 200, 'User comments retrieved successfully', result);
    } catch (error) {
        console.error('Error in getUserComments:', error);
        return sendError(res, error.statusCode || 500, error.message);
    }
}

/**
 * Get user's replies
 */
export async function getUserReplies(req, res) {
    try {
        const userId = req.user.id; // Get authenticated user ID from token
        console.log('Fetching replies for user:', userId);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await userService.getUserRepliesWithContext(userId, page, limit);
        return sendSuccess(res, 200, 'User replies retrieved successfully', result);
    } catch (error) {
        console.error('Error in getUserReplies:', error);
        return sendError(res, error.statusCode || 500, error.message);
    }
}