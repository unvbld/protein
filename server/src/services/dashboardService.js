import getOdooClient from './odooClient.js';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().slice(0, 7);

        // Today's sales
        const todayOrders = await getOdooClient().searchRead(
            'pos.order',
            [['date_order', '>=', today + ' 00:00:00'], ['state', 'in', ['paid', 'done', 'invoiced']]],
            ['amount_total']
        );

        const todaySales = {
            count: todayOrders.length,
            revenue: todayOrders.reduce((sum, o) => sum + o.amount_total, 0)
        };

        // This month's sales
        const monthOrders = await getOdooClient().searchRead(
            'pos.order',
            [['date_order', '>=', thisMonth + '-01 00:00:00'], ['state', 'in', ['paid', 'done', 'invoiced']]],
            ['amount_total']
        );

        const monthSales = {
            count: monthOrders.length,
            revenue: monthOrders.reduce((sum, o) => sum + o.amount_total, 0)
        };

        // Low stock products (qty < 20)
        const lowStockIds = await getOdooClient().search('product.product', [
            ['type', '=', 'product'],
            ['qty_available', '<', 20]
        ]);

        // Total products
        const totalProductIds = await getOdooClient().search('product.product', [
            ['sale_ok', '=', true]
        ]);

        // Total revenue (all time)
        const allOrders = await getOdooClient().searchRead(
            'pos.order',
            [['state', 'in', ['paid', 'done', 'invoiced']]],
            ['amount_total']
        );

        const totalRevenue = allOrders.reduce((sum, o) => sum + o.amount_total, 0);

        return {
            today: {
                sales_count: todaySales.count,
                revenue: todaySales.revenue
            },
            this_month: {
                sales_count: monthSales.count,
                revenue: monthSales.revenue
            },
            inventory: {
                total_products: totalProductIds.length,
                low_stock_count: lowStockIds.length
            },
            total_revenue: totalRevenue
        };
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        throw new Error('Failed to fetch dashboard statistics from Odoo');
    }
}

/**
 * Get sales data for charts
 */
export async function getSalesData(period = 'week') {
    try {
        let startDate;
        const endDate = new Date();

        if (period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        } else {
            // year
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 12);
        }

        const orders = await getOdooClient().searchRead(
            'pos.order',
            [
                ['date_order', '>=', startDate.toISOString()],
                ['state', 'in', ['paid', 'done', 'invoiced']]
            ],
            ['date_order', 'amount_total']
        );

        // Group by date
        const salesByDate = {};
        orders.forEach(order => {
            const date = order.date_order.split(' ')[0];
            if (!salesByDate[date]) {
                salesByDate[date] = {
                    date: date,
                    sales_count: 0,
                    revenue: 0
                };
            }
            salesByDate[date].sales_count++;
            salesByDate[date].revenue += order.amount_total;
        });

        // Convert to array and sort
        const salesData = Object.values(salesByDate).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        return salesData;
    } catch (error) {
        console.error('Get sales data error:', error);
        throw new Error('Failed to fetch sales data from Odoo');
    }
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit = 10) {
    try {
        // Get all order lines
        const orderLines = await getOdooClient().searchRead(
            'pos.order.line',
            [],
            ['product_id', 'qty', 'price_subtotal']
        );

        // Group by product
        const productStats = {};
        orderLines.forEach(line => {
            const productId = line.product_id[0];
            const productName = line.product_id[1];

            if (!productStats[productId]) {
                productStats[productId] = {
                    product_id: productId,
                    product_name: productName,
                    total_sold: 0,
                    total_revenue: 0
                };
            }

            productStats[productId].total_sold += line.qty;
            productStats[productId].total_revenue += line.price_subtotal;
        });

        // Convert to array, sort by quantity sold, and limit
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.total_sold - a.total_sold)
            .slice(0, limit);

        // Get current stock for these products
        for (const product of topProducts) {
            const productData = await getOdooClient().read('product.product', [product.product_id], ['qty_available']);
            product.current_stock = productData[0].qty_available;
        }

        return topProducts;
    } catch (error) {
        console.error('Get top products error:', error);
        throw new Error('Failed to fetch top products from Odoo');
    }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(threshold = 20) {
    try {
        const products = await getOdooClient().searchRead(
            'product.product',
            [
                ['type', '=', 'product'],
                ['qty_available', '<', threshold],
                ['sale_ok', '=', true]
            ],
            ['id', 'name', 'default_code', 'qty_available', 'list_price'],
            { order: 'qty_available asc' }
        );

        return products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.default_code || null,
            stock: p.qty_available,
            price: p.list_price
        }));
    } catch (error) {
        console.error('Get low stock products error:', error);
        throw new Error('Failed to fetch low stock products from Odoo');
    }
}
