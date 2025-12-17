import getOdooClient from './odooClient.js';

/**
 * Format product data from Odoo to our API format
 */
function formatProduct(p) {
    return {
        id: p.id,
        name: p.name,
        sku: p.default_code || '',
        barcode: p.barcode || '',
        category: p.categ_id ? p.categ_id[1] : 'Uncategorized',
        category_id: p.categ_id ? p.categ_id[0] : null,
        price: p.list_price || 0,
        cost: p.standard_price || 0,
        stock: p.qty_available || 0,
        unit: p.uom_id ? p.uom_id[1] : 'pcs',
        description: p.description_sale || '',
        image: p.image_128 || null,
        image_large: p.image_256 || null
    };
}

/**
 * Get all products from Odoo
 */
export async function getAllProducts() {
    try {
        const products = await getOdooClient().searchRead(
            'product.product',
            [['active', '=', true]],
            [
                'name', 'default_code', 'barcode', 'categ_id',
                'list_price', 'standard_price', 'qty_available',
                'uom_id', 'description_sale',
                'image_128', 'image_256'
            ]
        );

        return products.map(formatProduct);
    } catch (error) {
        console.error('Get all products error:', error);
        throw new Error('Failed to fetch products from Odoo');
    }
}

/**
 * Get single product by ID
 */
export async function getProductById(productId) {
    try {
        const products = await getOdooClient().read(
            'product.product',
            [parseInt(productId)],
            [
                'name', 'default_code', 'barcode', 'categ_id',
                'list_price', 'standard_price', 'qty_available',
                'uom_id', 'description_sale',
                'image_128', 'image_256'
            ]
        );

        if (!products || products.length === 0) {
            throw new Error('Product not found');
        }

        return formatProduct(products[0]);
    } catch (error) {
        console.error('Get product by ID error:', error);
        throw new Error('Failed to fetch product from Odoo');
    }
}

/**
 * Search products
 */
export async function searchProducts(searchTerm) {
    try {
        const domain = searchTerm
            ? ['|', '|', ['name', 'ilike', searchTerm], ['default_code', 'ilike', searchTerm], ['barcode', '=', searchTerm]]
            : [];

        domain.push(['active', '=', true]);

        const products = await getOdooClient().searchRead(
            'product.product',
            domain,
            [
                'name', 'default_code', 'barcode', 'categ_id',
                'list_price', 'standard_price', 'qty_available',
                'uom_id', 'description_sale',
                'image_128', 'image_256'
            ]
        );

        return products.map(formatProduct);
    } catch (error) {
        console.error('Search products error:', error);
        throw new Error('Failed to search products in Odoo');
    }
}

/**
 * Get products for POS
 */
export async function getPOSProducts(searchTerm = '') {
    try {
        const domain = [
            ['active', '=', true],
            ['sale_ok', '=', true],
            ['available_in_pos', '=', true]
        ];

        if (searchTerm) {
            domain.push('|', '|', ['name', 'ilike', searchTerm], ['default_code', 'ilike', searchTerm], ['barcode', '=', searchTerm]);
        }

        const products = await getOdooClient().searchRead(
            'product.product',
            domain,
            [
                'name', 'default_code', 'barcode', 'categ_id',
                'list_price', 'qty_available',
                'image_128', 'image_256'
            ]
        );

        return products.map(formatProduct);
    } catch (error) {
        console.error('Get POS products error:', error);
        throw new Error('Failed to fetch POS products from Odoo');
    }
}

/**
 * Create new product in Odoo
 */
export async function createProduct(productData) {
    try {
        console.log('📥 Creating product with data:', {
            name: productData.name,
            price: productData.price,
            stock: productData.stock,
            hasImage: !!productData.image
        });

        // Validate and parse numeric fields
        const price = parseFloat(productData.price);
        const cost = productData.cost && productData.cost !== '' ? parseFloat(productData.cost) : 0;

        if (isNaN(price)) {
            throw new Error('Invalid price value');
        }

        const values = {
            name: productData.name,
            default_code: productData.sku || false,
            barcode: productData.barcode || false,
            categ_id: productData.category_id ? parseInt(productData.category_id) : 1,
            list_price: price,
            standard_price: isNaN(cost) ? 0 : cost,
            type: 'product', // Stockable product
            sale_ok: true,
            available_in_pos: true, // Make available in POS by default
            purchase_ok: true
        };


        // Add image if provided
        if (productData.image) {
            const imageLength = productData.image.length;
            console.log('📸 Adding product image:');
            console.log('   - Base64 length:', imageLength, 'chars');
            console.log('   - Estimated size:', (imageLength * 0.75 / 1024).toFixed(2), 'KB');
            console.log('   - First 50 chars:', productData.image.substring(0, 50));

            values.image_128 = productData.image;
            values.image_256 = productData.image;
            values.image_1920 = productData.image;  // Also set full size
        } else {
            console.log('⚠️ No image provided in productData');
        }

        if (productData.description) {
            values.description_sale = productData.description;
        }

        console.log('🚀 Sending to Odoo, fields:', Object.keys(values));
        const productId = await getOdooClient().create('product.product', values);
        console.log('✅ Product created with ID:', productId);

        // If stock is provided, create initial stock
        if (productData.stock !== undefined && productData.stock !== '') {
            const stock = parseFloat(productData.stock);
            console.log('📦 Stock value:', stock, 'isNaN:', isNaN(stock));
            if (!isNaN(stock) && stock > 0) {
                console.log('🔄 Setting initial stock:', stock);
                const stockResult = await updateProductStock(productId, stock);
                console.log('📦 Stock update result:', stockResult);
            } else {
                console.log('⚠️ Stock not set - invalid or zero:', stock);
            }
        } else {
            console.log('⚠️ No stock provided');
        }

        const createdProduct = await getProductById(productId);
        console.log('✅ Final product:', { id: createdProduct.id, stock: createdProduct.stock, hasImage: !!createdProduct.image });
        return createdProduct;
    } catch (error) {
        console.error('❌ Create product error:', error);
        throw new Error('Failed to create product in Odoo: ' + error.message);
    }
}

/**
 * Update product in Odoo
 */
export async function updateProduct(productId, productData) {
    try {
        console.log('📝 Updating product', productId, 'with data:', {
            ...productData,
            image: productData.image ? 'HAS_IMAGE' : 'NO_IMAGE'
        });

        const values = {};

        if (productData.name !== undefined) values.name = productData.name;
        if (productData.sku !== undefined) values.default_code = productData.sku || false;
        if (productData.barcode !== undefined) values.barcode = productData.barcode || false;
        if (productData.category_id !== undefined) {
            values.categ_id = productData.category_id ? parseInt(productData.category_id) : 1;
        }
        if (productData.price !== undefined && productData.price !== '') {
            const p = parseFloat(productData.price);
            if (!isNaN(p)) values.list_price = p;
        }
        if (productData.cost !== undefined && productData.cost !== '') {
            const c = parseFloat(productData.cost);
            if (!isNaN(c)) values.standard_price = c;
        }
        if (productData.description !== undefined) values.description_sale = productData.description;

        // Update image if provided
        if (productData.image !== undefined) {
            if (productData.image) {
                const imageLength = productData.image.length;
                console.log('📸 Updating product image:');
                console.log('   - Base64 length:', imageLength, 'chars');
                console.log('   - Estimated size:', (imageLength * 0.75 / 1024).toFixed(2), 'KB');
                console.log('   - First 50 chars:', productData.image.substring(0, 50));

                values.image_128 = productData.image;
                values.image_256 = productData.image;
                values.image_1920 = productData.image;
            } else {
                console.log('⚠️ Image is explicitly set to null/empty - removing image');
                values.image_128 = false;
                values.image_256 = false;
                values.image_1920 = false;
            }
        } else {
            console.log('ℹ️ Image not in update data - keeping existing image');
        }

        console.log('🔄 Updating product, fields:', Object.keys(values));
        await getOdooClient().write('product.product', parseInt(productId), values);
        console.log('✅ Product updated');

        // Update stock if provided
        if (productData.stock !== undefined && productData.stock !== '') {
            const stock = parseFloat(productData.stock);
            if (!isNaN(stock)) {
                console.log('🔄 Updating stock to:', stock);
                await updateProductStock(productId, stock);
            }
        }

        return await getProductById(productId);
    } catch (error) {
        console.error('❌ Update product error:', error);
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
        console.log('📦 updateProductStock called with:', { productId, newQty });

        // First check if product is stockable
        const product = await getOdooClient().read('product.product', [parseInt(productId)], ['type']);
        console.log('Product type check:', product);

        if (!product || product.length === 0 || product[0].type !== 'product') {
            console.log('⚠️ Skipping stock update (product not stockable or not found)');
            return false;
        }

        // Get the default warehouse location (WH/Stock)
        const locations = await getOdooClient().searchRead(
            'stock.location',
            [
                ['usage', '=', 'internal'],
                ['name', '=', 'Stock']  // Default stock location
            ],
            ['id', 'name'],
            { limit: 1 }
        );

        console.log('Stock location found:', locations);

        if (locations.length === 0) {
            console.log('⚠️ No stock location found, trying any internal location');
            const anyLocation = await getOdooClient().searchRead(
                'stock.location',
                [['usage', '=', 'internal']],
                ['id', 'name'],
                { limit: 1 }
            );

            if (anyLocation.length === 0) {
                console.log('❌ No internal location found at all');
                return false;
            }
            locations[0] = anyLocation[0];
        }

        const locationId = locations[0].id;
        console.log('Using location ID:', locationId);

        // Search for existing quant
        const existingQuants = await getOdooClient().searchRead(
            'stock.quant',
            [
                ['product_id', '=', parseInt(productId)],
                ['location_id', '=', locationId]
            ],
            ['id', 'quantity', 'reserved_quantity'],
            { limit: 1 }
        );

        console.log('Existing quants:', existingQuants);

        const qty = parseFloat(newQty);

        if (existingQuants.length > 0) {
            // Update existing quant - simply update quantity
            console.log('Updating existing quant:', existingQuants[0].id, 'to quantity:', qty);
            await getOdooClient().write('stock.quant', existingQuants[0].id, {
                quantity: qty
            });
            console.log('✅ Stock updated to:', qty);
            return true;
        } else {
            // Create new quant with quantity directly
            console.log('Creating new quant with quantity:', qty);
            const quantId = await getOdooClient().create('stock.quant', {
                product_id: parseInt(productId),
                location_id: locationId,
                quantity: qty
            });

            console.log('✅ Stock quant created:', quantId, 'with qty:', qty);
            return true;
        }
    } catch (error) {
        console.error('❌ Update stock error:', error);
        console.error('Error details:', error.faultString || error.message);
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
            ['id', 'name'],
            { order: 'name ASC' }
        );
        return categories;
    } catch (error) {
        console.error('Get categories error:', error);
        throw new Error('Failed to fetch categories from Odoo');
    }
}
