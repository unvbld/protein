/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

// Function to check if user has POS access and redirect if needed
async function checkAndRedirectPOS() {
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
        // Check if we're on the home/dashboard page (where redirect should happen)
        if (window.location.pathname === '/web' || window.location.pathname === '/web/') {
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
        }
    }
}

// Wait for DOM to be ready and then check
document.addEventListener('DOMContentLoaded', function() {
    // Give a little time for Odoo to load
    setTimeout(checkAndRedirectPOS, 1000);
});

// Also check after widgets are loaded
registry.category("actions").add("auto_pos_login.check_and_redirect", {
    start: async function () {
        checkAndRedirectPOS();
    }
});