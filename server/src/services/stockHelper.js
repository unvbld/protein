/**
 * Update product stock in Odoo
 */
async function updateProductStock(productId, newQty) {
    try {
        // First check if product is stockable
        const product = await getOdooClient().read('product.product', [parseInt(productId)], ['type']);

        if (!product || product.length === 0) {
            console.warn('Product not found for stock update');
            return false;
        }

        if (product[0].type !== 'product') {
            console.log(`ℹ️ Product type is '${product[0].type}', not stockable. Skipping stock update.`);
            return false;
        }

        // Update stock using stock.quant
        // First, search for existing quant for this product
        const existingQuants = await getOdooClient().searchRead(
            'stock.quant',
            [
                ['product_id', '=', parseInt(productId)],
                ['location_id.usage', '=', 'internal']
            ],
            ['id', 'location_id', 'quantity'],
            { limit: 1 }
        );

        if (existingQuants.length > 0) {
            // Update existing quant
            await getOdooClient().write('stock.quant', existingQuants[0].id, {
                inventory_quantity: parseFloat(newQty)
            });

            // Apply inventory adjustment
            try {
                await getOdooClient().execute('stock.quant', 'action_apply_inventory', [[existingQuants[0].id]]);
            } catch (applyError) {
                console.warn('Could not apply inventory, but quantity updated');
            }

            console.log(`✅ Stock updated for product ${productId}: ${newQty}`);
            return true;
        } else {
            // Get default warehouse location
            const locations = await getOdooClient().searchRead(
                'stock.location',
                [['usage', '=', 'internal'], ['company_id', '!=', false]],
                ['id'],
                { limit: 1 }
            );

            if (locations.length === 0) {
                console.warn('No warehouse location found, skipping stock update');
                return false;
            }

            const locationId = locations[0].id;

            // Create new quant
            const quantId = await getOdooClient().create('stock.quant', {
                product_id: parseInt(productId),
                location_id: locationId,
                inventory_quantity: parseFloat(newQty)
            });

            // Apply inventory
            if (quantId) {
                try {
                    await getOdooClient().execute('stock.quant', 'action_apply_inventory', [[quantId]]);
                } catch (applyError) {
                    console.warn('Could not apply inventory, but quant created');
                }
            }

            console.log(`✅ Stock created for product ${productId}: ${newQty}`);
            return true;
        }
    } catch (error) {
        console.error('Update stock error:', error);
        console.warn('Failed to update stock, but product update will continue...');
        return false;
    }
}

export { updateProductStock };
