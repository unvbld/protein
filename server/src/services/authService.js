import getOdooClient from './odooClient.js';
import jwt from 'jsonwebtoken';

/**
 * Authenticate user with Odoo and return JWT token
 */
export async function login(username, password) {
    try {
        const odooClient = getOdooClient();

        // Authenticate with Odoo
        const uid = await odooClient.authenticate(username, password);

        if (!uid) {
            throw new Error('Authentication failed');
        }

        // Get user information
        const userInfo = await odooClient.getUserInfo(uid);

        // Determine user role based on Odoo groups
        let role = 'kasir'; // Default role

        // Check if user is admin/manager
        const isInventoryManager = await odooClient.userHasGroup(uid, 'stock.group_stock_manager');
        const isPosManager = await odooClient.userHasGroup(uid, 'point_of_sale.group_pos_manager');

        if (isInventoryManager || isPosManager) {
            role = 'admin';
        }

        // Create JWT payload
        const payload = {
            id: uid,
            username: userInfo.login,
            name: userInfo.name,
            email: userInfo.email,
            role: role,
            odoo_uid: uid
        };

        // Generate JWT token
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

        return {
            token,
            user: {
                id: uid,
                username: userInfo.login,
                name: userInfo.name,
                email: userInfo.email,
                role: role
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        throw new Error('Invalid username or password');
    }
}

/**
 * Get current user info from Odoo
 */
export async function getCurrentUser(userId) {
    try {
        const odooClient = getOdooClient();

        const userInfo = await odooClient.getUserInfo(userId);

        // Determine role
        let role = 'kasir';
        const isInventoryManager = await odooClient.userHasGroup(userId, 'stock.group_stock_manager');
        const isPosManager = await odooClient.userHasGroup(userId, 'point_of_sale.group_pos_manager');

        if (isInventoryManager || isPosManager) {
            role = 'admin';
        }

        return {
            id: userId,
            username: userInfo.login,
            name: userInfo.name,
            email: userInfo.email,
            role: role
        };
    } catch (error) {
        console.error('Get current user error:', error);
        throw new Error('Failed to get user information');
    }
}
