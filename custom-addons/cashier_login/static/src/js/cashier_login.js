/** @odoo-module **/

import { registry } from "@web/core/registry";

// Add a redirect after successful login for cashier login page
registry.category("actions").add("cashier_login.post_login", {
    start: async function () {
        // Check if we're on the cashier login page and successfully logged in
        if (window.location.pathname === '/cashier/login' && session.uid) {
            // Check if user has POS access
            const user = await rpc({
                model: 'res.users',
                method: 'read',
                args: [[session.uid], ['groups_id']],
            });
            
            // Check if user has POS user or POS manager permissions
            const posUserGroup = await rpc({
                model: 'ir.model.data',
                method: 'xmlid_to_res_id',
                args: ['point_of_sale.group_pos_user'],
            });
            
            const posManagerGroup = await rpc({
                model: 'ir.model.data',
                method: 'xmlid_to_res_id',
                args: ['point_of_sale.group_pos_manager'],
            });
            
            const hasPOSAccess = user[0].groups_id.includes(posUserGroup) || 
                                 user[0].groups_id.includes(posManagerGroup);
            
            if (hasPOSAccess) {
                // Check if there's an active POS session
                const posSessions = await rpc({
                    model: 'pos.session',
                    method: 'search_read',
                    domain: [['state', '=', 'opened'], ['user_id', '=', session.uid]],
                    fields: ['id'],
                });
                
                if (posSessions.length > 0) {
                    // Redirect to the first opened POS session
                    window.location.href = `/pos/ui#session_access/${posSessions[0].id}`;
                } else {
                    // Redirect to POS UI
                    window.location.href = '/pos/ui';
                }
            } else {
                // If user doesn't have POS access, redirect to standard backend
                window.location.href = '/web';
            }
        }
    }
});