import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @returns {string} - JWT token
 */
export function generateToken(userId) {
    return jwt.sign({ userId }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
export function verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
}
