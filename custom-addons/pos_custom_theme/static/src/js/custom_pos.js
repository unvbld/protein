/** @odoo-module **/

import { PosStore } from "@point_of_sale/models";
import { patch } from "@web/core/utils/patch";

// Patch the PosStore to add custom functionality if needed
patch(PosStore.prototype, 'pos_custom_theme.PosStore', {
    // Example: Add custom initialization logic
    initializeAfterLoad() {
        // Call the original method
        this._super(...arguments);
        
        // Add any custom initialization here
        console.log("POS Custom Theme loaded");
    }
});