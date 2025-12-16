import * as dashboardService from '../services/dashboardService.js';

export const getStats = async (req, res) => {
    try {
        const stats = await dashboardService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
    }
};

export const getSalesData = async (req, res) => {
    try {
        const data = await dashboardService.getSalesData(req.query.period || 'week');
        res.json(data);
    } catch (error) {
        console.error('Get sales data error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch sales data' });
    }
};

export const getTopProducts = async (req, res) => {
    try {
        const products = await dashboardService.getTopProducts(parseInt(req.query.limit) || 10);
        res.json(products);
    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch top products' });
    }
};

export const getLowStock = async (req, res) => {
    try {
        const products = await dashboardService.getLowStockProducts(parseInt(req.query.threshold) || 20);
        res.json(products);
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch low stock products' });
    }
};
