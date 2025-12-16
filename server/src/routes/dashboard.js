import express from 'express';
import {
    getStats,
    getSalesData,
    getTopProducts,
    getLowStock
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// All dashboard routes require admin role
router.use(authenticate, requireAdmin);

router.get('/stats', getStats);
router.get('/sales', getSalesData);
router.get('/top-products', getTopProducts);
router.get('/low-stock', getLowStock);

export default router;
