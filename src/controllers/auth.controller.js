import { sendSuccess, sendError } from '../utils/response.js';
import * as authService from '../services/auth.service.js';


export async function register(req, res) {
    try {
        const result = await authService.registerUser(req.body);
        return sendSuccess(res, 201, 'User registered successfully', result);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}


export async function login(req, res) {
    try {
        const result = await authService.loginUser(req.body);
        return sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function getCurrentUser(req, res) {
    try {
        const user = await authService.getUserById(req.user.id);
        return sendSuccess(res, 200, 'User retrieved successfully', { user });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function logout(req, res) {
    return sendSuccess(res, 200, 'Logout successful');
}

export async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body;
        const result = await authService.verifyEmail(email, code);
        return sendSuccess(res, 200, 'Email verified successfully', { user: result });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}


export async function resendVerification(req, res) {
    try {
        const { email } = req.body;
        const result = await authService.resendVerificationEmail(email);
        return sendSuccess(res, 200, result.message);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const result = await authService.forgotPassword(email);
        return sendSuccess(res, 200, result.message);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function verifyOTP(req, res) {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyOTP(email, otp);
        return sendSuccess(res, 200, result.message, { email: result.email });
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await authService.resetPassword(email, otp, newPassword);
        return sendSuccess(res, 200, result.message);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}

export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
        return sendSuccess(res, 200, result.message);
    } catch (error) {
        return sendError(res, error.statusCode || 500, error.message);
    }
}
