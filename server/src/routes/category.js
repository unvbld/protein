import express from 'express';
import {
    getCategories,
    getCategory,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all categories (all authenticated users)
router.get('/', getCategories);

// Get single category
router.get('/:id', getCategory);

// Create category (admin only)
router.post('/', requireRole('admin'), createCategoryController);

// Update category (admin only)
router.put('/:id', requireRole('admin'), updateCategoryController);

// Delete category (admin only)
router.delete('/:id', requireRole('admin'), deleteCategoryController);

export default router;
