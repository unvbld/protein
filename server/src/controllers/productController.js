import * as productService from '../services/productService.js';

export const getAllProducts = async (req, res) => {
    try {
        const result = await productService.getAllProducts(req.query);
        res.json(result);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch products' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const createProduct = async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: error.message || 'Failed to create product' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: error.message || 'Failed to update product' });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await productService.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};
