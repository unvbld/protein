import getOdooClient from './odooClient.js';

/**
 * Create POS order in Odoo
 */
export async function createPOSOrder(orderData, userId) {
    try {
        const { items, payment_method = 'cash', customer_id = null } = orderData;

        if (!items || items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        // Get POS session (or create one if needed)
        const session = await getOrCreatePOSSession(userId);

        // Calculate total
        let totalAmount = 0;
        const orderLines = [];

        for (const item of items) {
            const product = await getOdooClient().read('product.product', [item.product_id], ['list_price']);
            if (!product || product.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }

            const price = product[0].list_price;
            const subtotal = price * item.quantity;
            totalAmount += subtotal;

            // POS order line format: [0, 0, {values}]
            orderLines.push([0, 0, {
                product_id: item.product_id,
                qty: item.quantity,
                price_unit: price,
                price_subtotal: subtotal,
                price_subtotal_incl: subtotal
            }]);
        }

        // Create POS order
        const orderValues = {
            session_id: session.id,
            user_id: userId,
            partner_id: customer_id || false,
            lines: orderLines,
            amount_total: totalAmount,
            amount_tax: 0,
            amount_paid: totalAmount,
            amount_return: 0,
            state: 'paid'
        };

        const orderId = await getOdooClient().create('pos.order', orderValues);

        // Create payment
        await getOdooClient().create('pos.payment', {
            pos_order_id: orderId,
            amount: totalAmount,
            payment_method_id: await getPaymentMethodId(session.id, payment_method)
        });

        // Get full order details
        const order = await getPOSOrderById(orderId);

        return order;
    } catch (error) {
        console.error('Create POS order error:', error);
        throw new Error('Failed to create POS order: ' + error.message);
    }
}

/**
 * Get or create POS session for user
 */
async function getOrCreatePOSSession(userId) {
    try {
        // Search for open session
        const sessions = await getOdooClient().searchRead(
            'pos.session',
            [['state', '=', 'opened'], ['user_id', '=', userId]],
            ['id', 'name', 'config_id'],
            { limit: 1 }
        );

        if (sessions.length > 0) {
            return sessions[0];
        }

        // No open session, get POS config
        const configs = await getOdooClient().searchRead(
            'pos.config',
            [],
            ['id', 'name'],
            { limit: 1 }
        );

        if (configs.length === 0) {
            throw new Error('No POS configuration found. Please create a POS config in Odoo first.');
        }

        // Create new session
        const sessionId = await getOdooClient().create('pos.session', {
            config_id: configs[0].id,
            user_id: userId
        });

        // Open the session
        await getOdooClient().execute('pos.session', 'action_pos_session_open', [[sessionId]]);

        const session = await getOdooClient().read('pos.session', [sessionId], ['id', 'name', 'config_id']);
        return session[0];
    } catch (error) {
        console.error('Get/Create POS session error:', error);
        throw error;
    }
}

/**
 * Get payment method ID
 */
async function getPaymentMethodId(sessionId, methodType = 'cash') {
    try {
        const session = await getOdooClient().read('pos.session', [sessionId], ['config_id']);
        const configId = session[0].config_id[0];

        // Get payment methods for this POS config
        const config = await getOdooClient().read('pos.config', [configId], ['payment_method_ids']);

        if (config[0].payment_method_ids && config[0].payment_method_ids.length > 0) {
            // Return first payment method (typically cash)
            return config[0].payment_method_ids[0];
        }

        throw new Error('No payment methods configured for this POS');
    } catch (error) {
        console.error('Get payment method error:', error);
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
            'amount_total', 'amount_paid', 'state', 'session_id'
        ];

        const orders = await getOdooClient().searchRead('pos.order', domain, fields, options);

        // Get total count
        const totalIds = await getOdooClient().search('pos.order', domain);
        const total = totalIds.length;

        const formattedOrders = orders.map(o => ({
            id: o.id,
            order_number: o.name,
            date: o.date_order,
            cashier: o.user_id ? o.user_id[1] : null,
            customer: o.partner_id ? o.partner_id[1] : 'Walk-in Customer',
            total_amount: o.amount_total,
            amount_paid: o.amount_paid,
            status: o.state,
            session: o.session_id ? o.session_id[1] : null
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
    try {
        const orders = await getOdooClient().read('pos.order', [parseInt(orderId)], [
            'id', 'name', 'date_order', 'user_id', 'partner_id',
            'amount_total', 'amount_paid', 'state', 'session_id', 'lines'
        ]);

        if (!orders || orders.length === 0) {
            throw new Error('Order not found');
        }

        const order = orders[0];

        // Get order lines
        let items = [];
        if (order.lines && order.lines.length > 0) {
            const lines = await getOdooClient().read('pos.order.line', order.lines, [
                'product_id', 'qty', 'price_unit', 'price_subtotal'
            ]);

            items = lines.map(line => ({
                product_id: line.product_id[0],
                product_name: line.product_id[1],
                quantity: line.qty,
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
            amount_paid: order.amount_paid,
            status: order.state,
            session: order.session_id ? order.session_id[1] : null,
            items: items
        };
    } catch (error) {
        console.error('Get POS order error:', error);
        throw error;
    }
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
            'id', 'name', 'default_code', 'barcode',
            'list_price', 'qty_available', 'uom_id', 'image_128'
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
            price: p.list_price,
            stock: p.qty_available,
            unit: p.uom_id ? p.uom_id[1] : 'Unit',
            image: p.image_128 || null
        }));
    } catch (error) {
        console.error('Get POS products error:', error);
        throw new Error('Failed to fetch POS products from Odoo');
    }
}
