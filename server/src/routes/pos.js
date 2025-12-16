import express from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    getPOSProducts
} from '../controllers/posController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/products', getPOSProducts);
router.post('/orders', createOrder);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);

export default router;
