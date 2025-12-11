from odoo import _
from odoo.http import request
from odoo.exceptions import AccessDenied
from odoo.addons.web.controllers.home import Home as BaseHome
import werkzeug.utils


class Home(BaseHome):

    def _login_redirect(self, uid, redirect=None):
        """Override the login redirect method to send POS users directly to POS"""

        # Get the user record
        user = request.env['res.users'].sudo().browse(uid)

        # Check if the user has POS Cashier permissions
        # POS Cashier group is typically identified by the 'point_of_sale.group_pos_user' XML ID
        pos_user_group = request.env.ref('point_of_sale.group_pos_user', raise_if_not_found=False)
        pos_manager_group = request.env.ref('point_of_sale.group_pos_manager', raise_if_not_found=False)

        # Check if user has either POS user or POS manager permissions
        has_pos_access = False
        if pos_user_group and pos_user_group.id in user.groups_id.ids:
            has_pos_access = True
        elif pos_manager_group and pos_manager_group.id in user.groups_id.ids:
            has_pos_access = True

        if has_pos_access:
            # User has POS permissions, redirect to POS
            pos_session = request.env['pos.session'].sudo().search([
                ('state', '=', 'opened'),
                ('config_id', '!=', False),
                ('user_id', '=', uid)
            ], limit=1)

            # If a POS session exists for this user, redirect to it
            if pos_session:
                return f'/pos/ui#session_access/{pos_session.id}'

            # If no specific session exists but user has POS access, redirect to POS main page
            return '/pos/ui'

        # If user doesn't have POS permissions, use default behavior
        return super()._login_redirect(uid, redirect)