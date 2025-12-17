import getOdooClient from './odooClient.js';

/**
 * Get all product categories
 */
export async function getAllCategories() {
    try {
        const odooClient = getOdooClient();
        await odooClient.ensureAuthenticated();

        const categories = await odooClient.searchRead(
            'product.category',
            [],
            ['id', 'name', 'display_name'],
            { order: 'name asc' }
        );

        return categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            display_name: cat.display_name
        }));
    } catch (error) {
        console.error('Get categories error:', error);
        throw new Error('Failed to fetch categories');
    }
}

/**
 * Get category by ID
 */
export async function getCategoryById(categoryId) {
    try {
        const odooClient = getOdooClient();
        await odooClient.ensureAuthenticated();

        const categories = await odooClient.read('product.category', categoryId, ['id', 'name', 'display_name']);

        if (!categories || categories.length === 0) {
            throw new Error('Category not found');
        }

        return {
            id: categories[0].id,
            name: categories[0].name,
            display_name: categories[0].display_name
        };
    } catch (error) {
        console.error('Get category error:', error);
        throw new Error('Failed to fetch category');
    }
}

/**
 * Create new category
 */
export async function createCategory(categoryData) {
    try {
        const odooClient = getOdooClient();
        await odooClient.ensureAuthenticated();

        const { name } = categoryData;

        if (!name || name.trim() === '') {
            throw new Error('Category name is required');
        }

        console.log('📁 Creating category:', name);

        const categoryId = await odooClient.create('product.category', {
            name: name.trim()
        });

        console.log('✅ Category created with ID:', categoryId);

        return await getCategoryById(categoryId);
    } catch (error) {
        console.error('Create category error:', error);
        throw new Error('Failed to create category: ' + error.message);
    }
}

/**
 * Update category
 */
export async function updateCategory(categoryId, categoryData) {
    try {
        const odooClient = getOdooClient();
        await odooClient.ensureAuthenticated();

        const { name } = categoryData;

        if (!name || name.trim() === '') {
            throw new Error('Category name is required');
        }

        console.log('📝 Updating category:', categoryId);

        await odooClient.write('product.category', categoryId, {
            name: name.trim()
        });

        console.log('✅ Category updated');

        return await getCategoryById(categoryId);
    } catch (error) {
        console.error('Update category error:', error);
        throw new Error('Failed to update category: ' + error.message);
    }
}

/**
 * Delete category
 */
export async function deleteCategory(categoryId) {
    try {
        const odooClient = getOdooClient();
        await odooClient.ensureAuthenticated();

        // Check if category has products
        const products = await odooClient.searchRead(
            'product.product',
            [['categ_id', '=', categoryId]],
            ['id'],
            { limit: 1 }
        );

        if (products.length > 0) {
            throw new Error('Cannot delete category with assigned products');
        }

        console.log('🗑️ Deleting category:', categoryId);

        await odooClient.execute('product.category', 'unlink', [[categoryId]]);

        console.log('✅ Category deleted');

        return { success: true };
    } catch (error) {
        console.error('Delete category error:', error);
        throw new Error('Failed to delete category: ' + error.message);
    }
}
