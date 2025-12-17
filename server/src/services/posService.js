import getOdooClient from './odooClient.js';

/**
 * Create POS order in Odoo - Simplified without session management
 */
export async function createPOSOrder(orderData, userId) {
    try {
        const { items, payment_method = 'cash', customer_id = null } = orderData;

        if (!items || items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        console.log('📝 Creating POS order for user:', userId);
        console.log('Items:', items);

        // Calculate total and prepare order lines
        let totalAmount = 0;
        const orderLines = [];

        for (const item of items) {
            const product = await getOdooClient().read('product.product', [item.product_id], ['list_price', 'name']);
            if (!product || product.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }

            const price = product[0].list_price;
            const subtotal = price * item.quantity;
            totalAmount += subtotal;

            // Sale order line format: [0, 0, {values}]
            orderLines.push([0, 0, {
                product_id: item.product_id,
                product_uom_qty: item.quantity,
                price_unit: price,
                name: product[0].name
            }]);
        }

        console.log('💰 Total amount:', totalAmount);

        // Format date for Odoo: YYYY-MM-DD HH:MM:SS
        const now = new Date();
        const odooDate = now.toISOString().slice(0, 19).replace('T', ' ');

        // Create sale order (simpler than POS order with sessions)
        const orderNumber = `POS-${Date.now()}`;
        const orderValues = {
            partner_id: customer_id || 1, // Use default partner if no customer
            user_id: userId,
            date_order: odooDate,  // Fixed format
            order_line: orderLines,
            // Don't set state - let it be draft to avoid routing/delivery validation
            note: `POS Order - Payment: ${payment_method}`
        };
        console.log('🚀 Creating sale order...');
        const orderId = await getOdooClient().create('sale.order', orderValues);
        console.log('✅ Sale order created:', orderId);

        // Mark as paid without confirming (to avoid warehouse routing)
        try {
            await getOdooClient().write('sale.order', orderId, {
                state: 'sale',  // Mark as confirmed sale
                invoice_status: 'invoiced'  // Mark as invoiced
            });
            console.log('✅ Order marked as paid');
        } catch (e) {
            console.log('⚠️ Could not mark as paid:', e.message);
        }

        // Manually reduce stock for each item (since we bypass delivery)
        console.log('📦 Updating stock for sold items...');
        for (const item of items) {
            try {
                // Get current stock
                const product = await getOdooClient().read('product.product', [item.product_id], ['qty_available']);
                if (product && product.length > 0) {
                    const currentStock = product[0].qty_available;
                    const newStock = Math.max(0, currentStock - item.quantity);

                    console.log(`   Product ${item.product_id}: ${currentStock} → ${newStock}`);

                    // Find stock quant and update
                    const quants = await getOdooClient().searchRead(
                        'stock.quant',
                        [
                            ['product_id', '=', item.product_id],
                            ['location_id.usage', '=', 'internal']
                        ],
                        ['id', 'quantity'],
                        { limit: 1 }
                    );

                    if (quants.length > 0) {
                        await getOdooClient().write('stock.quant', quants[0].id, {
                            quantity: newStock
                        });
                    }
                }
            } catch (stockError) {
                console.error(`⚠️ Stock update failed for product ${item.product_id}:`, stockError.message);
            }
        }
        console.log('✅ Stock updated');

        // Get full order details
        const order = await getSaleOrderById(orderId);

        return {
            ...order,
            order_number: orderNumber
        };
    } catch (error) {
        console.error('❌ Create POS order error:', error);
        throw new Error('Failed to create POS order: ' + error.message);
    }
}

/**
 * Get sale order by ID
 */
async function getSaleOrderById(orderId) {
    try {
        const orders = await getOdooClient().read('sale.order', [parseInt(orderId)], [
            'id', 'name', 'date_order', 'user_id', 'partner_id',
            'amount_total', 'state', 'order_line'
        ]);

        if (!orders || orders.length === 0) {
            throw new Error('Order not found');
        }

        const order = orders[0];

        // Get order lines
        let items = [];
        if (order.order_line && order.order_line.length > 0) {
            const lines = await getOdooClient().read('sale.order.line', order.order_line, [
                'product_id', 'product_uom_qty', 'price_unit', 'price_subtotal'
            ]);

            items = lines.map(line => ({
                product_id: line.product_id[0],
                product_name: line.product_id[1],
                quantity: line.product_uom_qty,
                price: line.price_unit,
                subtotal: line.price_subtotal
            }));
        }

        return {
            id: order.id,
            order_number: order.name,
            date: order.date_order,
            cashier: order.user_id ? order.user_id[1] : null,
            customer: order.partner_id ? order.partner_id[1] : 'Walk-in Customer',
            total_amount: order.amount_total,
            amount_paid: order.amount_total,
            status: order.state,
            items: items
        };
    } catch (error) {
        console.error('Get sale order error:', error);
        throw error;
    }
}

/**
 * Get POS orders
 */
export async function getPOSOrders(filters = {}, userId, userRole) {
    try {
        const { page = 1, limit = 50, start_date, end_date } = filters;

        const domain = [];

        // If kasir, only show their own orders
        if (userRole === 'kasir') {
            domain.push(['user_id', '=', userId]);
        }

        if (start_date) {
            domain.push(['date_order', '>=', start_date]);
        }

        if (end_date) {
            domain.push(['date_order', '<=', end_date]);
        }

        const offset = (page - 1) * limit;
        const options = {
            offset: offset,
            limit: parseInt(limit),
            order: 'date_order desc'
        };

        const fields = [
            'id', 'name', 'date_order', 'user_id', 'partner_id',
            'amount_total', 'state'
        ];

        const orders = await getOdooClient().searchRead('sale.order', domain, fields, options);

        // Get total count
        const totalIds = await getOdooClient().search('sale.order', domain);
        const total = totalIds.length;

        const formattedOrders = orders.map(o => ({
            id: o.id,
            order_number: o.name,
            date: o.date_order,
            cashier: o.user_id ? o.user_id[1] : null,
            customer: o.partner_id ? o.partner_id[1] : 'Walk-in Customer',
            total_amount: o.amount_total,
            amount_paid: o.amount_total,
            status: o.state
        }));

        return {
            orders: formattedOrders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Get POS orders error:', error);
        throw new Error('Failed to fetch POS orders from Odoo');
    }
}

/**
 * Get POS order by ID
 */
export async function getPOSOrderById(orderId) {
    return getSaleOrderById(orderId);
}

/**
 * Get products available for POS
 */
export async function getPOSProducts(search = '') {
    try {
        const domain = [
            ['sale_ok', '=', true],
            ['available_in_pos', '=', true]
        ];

        if (search) {
            domain.push('|', '|',
                ['name', 'ilike', search],
                ['default_code', 'ilike', search],
                ['barcode', 'ilike', search]
            );
        }

        const fields = [
            'id', 'name', 'default_code', 'barcode', 'categ_id',
            'list_price', 'qty_available', 'uom_id', 'image_128', 'image_256'
        ];

        const products = await getOdooClient().searchRead('product.product', domain, fields, {
            limit: 100,
            order: 'name asc'
        });

        return products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.default_code || null,
            barcode: p.barcode || null,
            category_id: p.categ_id ? p.categ_id[0] : null,
            price: p.list_price,
            stock: p.qty_available,
            unit: p.uom_id ? p.uom_id[1] : 'Unit',
            image: p.image_128 || null,
            image_large: p.image_256 || null
        }));
    } catch (error) {
        console.error('Get POS products error:', error);
        throw new Error('Failed to fetch POS products from Odoo');
    }
}
