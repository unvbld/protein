import * as posService from '../services/posService.js';

export const createOrder = async (req, res) => {
    try {
        const order = await posService.createPOSOrder(req.body, req.user.odoo_uid);
        res.status(201).json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const result = await posService.getPOSOrders(req.query, req.user.odoo_uid, req.user.role);
        res.json(result);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch orders' });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await posService.getPOSOrderById(req.params.id);

        // Check if kasir is trying to access other's order
        if (req.user.role === 'kasir' && order.cashier !== req.user.name) {
            return res.status(403).json({ error: 'Access forbidden' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

export const getPOSProducts = async (req, res) => {
    try {
        const products = await posService.getPOSProducts(req.query.search || '');
        res.json(products);
    } catch (error) {
        console.error('Get POS products error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch POS products' });
    }
};
