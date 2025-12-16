import * as authService from '../services/authService.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await authService.login(username, password);
        res.json(result);
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message || 'Invalid credentials' });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await authService.getCurrentUser(req.user.odoo_uid);
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user information' });
    }
};

export const logout = (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: 'Logged out successfully' });
};
