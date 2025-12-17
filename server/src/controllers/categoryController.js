import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../services/categoryService.js';

export async function getCategories(req, res) {
    try {
        const categories = await getAllCategories();
        res.json(categories);
    } catch (error) {
        console.error('Get categories controller error:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getCategory(req, res) {
    try {
        const categoryId = parseInt(req.params.id);
        const category = await getCategoryById(categoryId);
        res.json(category);
    } catch (error) {
        console.error('Get category controller error:', error);
        res.status(404).json({ error: error.message });
    }
}

export async function createCategoryController(req, res) {
    try {
        const category = await createCategory(req.body);
        res.status(201).json(category);
    } catch (error) {
        console.error('Create category controller error:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function updateCategoryController(req, res) {
    try {
        const categoryId = parseInt(req.params.id);
        const category = await updateCategory(categoryId, req.body);
        res.json(category);
    } catch (error) {
        console.error('Update category controller error:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function deleteCategoryController(req, res) {
    try {
        const categoryId = parseInt(req.params.id);
        const result = await deleteCategory(categoryId);
        res.json(result);
    } catch (error) {
        console.error('Delete category controller error:', error);
        res.status(400).json({ error: error.message });
    }
}
