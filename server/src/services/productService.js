import getOdooClient from './odooClient.js';

/**
 * Get all products from Odoo
 */
export async function getAllProducts(filters = {}) {
    try {
        const { search, category, page = 1, limit = 50 } = filters;

        // Build domain for filtering
        const domain = [['sale_ok', '=', true]]; // Only products that can be sold

        if (search) {
            domain.push('|', '|',
                ['name', 'ilike', search],
                ['default_code', 'ilike', search],
                ['barcode', 'ilike', search]
            );
        }

        if (category) {
            domain.push(['categ_id', '=', parseInt(category)]);
        }

        const offset = (page - 1) * limit;
        const options = {
            offset: offset,
            limit: parseInt(limit),
            order: 'name asc'
        };

        // Fields to retrieve
        const fields = [
            'id',
            'name',
            'default_code',  // SKU/Internal Reference
            'barcode',
            'categ_id',      // Category
            'list_price',    // Sale Price
            'standard_price', // Cost
            'qty_available',  // Available Quantity
            'uom_id',        // Unit of Measure
            'description_sale',
            'image_128', 'image_256'      // Product image
        ];

        // Get products
        const products = await getOdooClient().searchRead('product.product', domain, fields, options);

        // Get total count
        const totalIds = await getOdooClient().search('product.product', domain);
        const total = totalIds.length;

        // Format response
        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.default_code || null,
            barcode: p.barcode || null,
            category: p.categ_id ? p.categ_id[1] : null,
            category_id: p.categ_id ? p.categ_id[0] : null,
            price: p.list_price,
            cost: p.standard_price,
            stock: p.qty_available,
            unit: p.uom_id ? p.uom_id[1] : 'Unit',
            description: p.description_sale || '',
            image: p.image_128, image_large: p.image_256 || null
        }));

        return {
            products: formattedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Get products error:', error);
        throw new Error('Failed to fetch products from Odoo');
    }
}

/**
 * Get product by ID
 */
export async function getProductById(productId) {
    try {
        const fields = [
            'id', 'name', 'default_code', 'barcode', 'categ_id',
            'list_price', 'standard_price', 'qty_available', 'uom_id',
            'description_sale', 'image_128', 'image_256'
        ];

        const products = await getOdooClient().read('product.product', [parseInt(productId)], fields);

        if (!products || products.length === 0) {
            throw new Error('Product not found');
        }

        const p = products[0];
        return {
            id: p.id,
            name: p.name,
            sku: p.default_code || null,
            barcode: p.barcode || null,
            category: p.categ_id ? p.categ_id[1] : null,
            category_id: p.categ_id ? p.categ_id[0] : null,
            price: p.list_price,
            cost: p.standard_price,
            stock: p.qty_available,
            unit: p.uom_id ? p.uom_id[1] : 'Unit',
            description: p.description_sale || '',
            image: p.image_128, image_large: p.image_256 || null
        };
    } catch (error) {
        console.error('Get product error:', error);
        throw error;
    }
}

/**
 * Create new product in Odoo
 */
export async function createProduct(productData) {
    try {
        const values = {
            name: productData.name,
            default_code: productData.sku || false,
            barcode: productData.barcode || false,
            categ_id: productData.category_id || 1, // Default category
            list_price: parseFloat(productData.price),
            standard_price: productData.cost ? parseFloat(productData.cost) : 0,
            type: 'product', // Stockable product
            sale_ok: true,
            purchase_ok: true
        };

        if (productData.description) {
            values.description_sale = productData.description;
        }

        const productId = await getOdooClient().create('product.product', values);

        // If stock is provided, create initial stock
        if (productData.stock && productData.stock > 0) {
            await updateProductStock(productId, productData.stock);
        }

        return await getProductById(productId);
    } catch (error) {
        console.error('Create product error:', error);
        throw new Error('Failed to create product in Odoo');
    }
}

/**
 * Update product in Odoo
 */
export async function updateProduct(productId, productData) {
    try {
        const values = {};

        if (productData.name !== undefined) values.name = productData.name;
        if (productData.sku !== undefined) values.default_code = productData.sku || false;
        if (productData.barcode !== undefined) values.barcode = productData.barcode || false;
        if (productData.category_id !== undefined) values.categ_id = productData.category_id;
        if (productData.price !== undefined && productData.price !== '') { const p = parseFloat(productData.price); if (!isNaN(p)) values.list_price = p; }
        if (productData.cost !== undefined && productData.cost !== '') { const c = parseFloat(productData.cost); if (!isNaN(c)) values.standard_price = c; }
        if (productData.description !== undefined) values.description_sale = productData.description;

        await getOdooClient().write('product.product', parseInt(productId), values);

        // Update stock if provided
        if (productData.stock !== undefined) {
            await updateProductStock(productId, productData.stock);
        }

        return await getProductById(productId);
    } catch (error) {
        console.error('Update product error:', error);
        throw new Error('Failed to update product in Odoo');
    }
}

/**
 * Delete (archive) product in Odoo
 */
export async function deleteProduct(productId) {
    try {
        // In Odoo, it's better to archive than delete
        await getOdooClient().write('product.product', parseInt(productId), {
            active: false
        });
        return { success: true, message: 'Product archived successfully' };
    } catch (error) {
        console.error('Delete product error:', error);
        throw new Error('Failed to delete product in Odoo');
    }
}

/**
 * Update product stock in Odoo
 */
async function updateProductStock(productId, newQty) {
  try {
    const product = await getOdooClient().read('product.product', [parseInt(productId)], ['type']);
    if (!product || product.length === 0 || product[0].type !== 'product') {
      console.log('? Skipping stock update (product not stockable or not found)');
      return false;
    }
    const existingQuants = await getOdooClient().searchRead('stock.quant', [['product_id', '=', parseInt(productId)], ['location_id.usage', '=', 'internal']], ['id'], { limit: 1 });
    if (existingQuants.length > 0) {
      await getOdooClient().write('stock.quant', existingQuants[0].id, { inventory_quantity: parseFloat(newQty) });
      try { await getOdooClient().execute('stock.quant', 'action_apply_inventory', [[existingQuants[0].id]]); } catch (e) {}
      console.log(' Stock updated');
      return true;
    } else {
      const locations = await getOdooClient().searchRead('stock.location', [['usage', '=', 'internal'], ['company_id', '!=', false]], ['id'], { limit: 1 });
      if (locations.length === 0) return false;
      const quantId = await getOdooClient().create('stock.quant', { product_id: parseInt(productId), location_id: locations[0].id, inventory_quantity: parseFloat(newQty) });
      if (quantId) { try { await getOdooClient().execute('stock.quant', 'action_apply_inventory', [[quantId]]); } catch (e) {} }
      console.log(' Stock created');
      return true;
    }
  } catch (error) {
    console.error('Update stock error:', error.message);
    return false;
  }
}

/**
 * Get product categories
 */
export async function getCategories() {
    try {
        const categories = await getOdooClient().searchRead(
            'product.category',
            [],
            ['id', 'name', 'parent_id'],
            { order: 'name asc' }
        );

        return categories.map(c => ({
            id: c.id,
            name: c.name,
            parent: c.parent_id ? c.parent_id[1] : null
        }));
    } catch (error) {
        console.error('Get categories error:', error);
        throw new Error('Failed to fetch categories from Odoo');
    }
}


