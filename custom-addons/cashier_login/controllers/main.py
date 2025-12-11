from odoo import http
from odoo.http import request
from odoo.addons.web.controllers.home import Home as BaseHome
import json


class CashierLoginController(BaseHome):

    @http.route('/cashier/login', type='http', auth='public', website=True)
    def cashier_login(self, redirect=None, **kw):
        """
        Custom login page for cashiers
        """
        # Render a custom login page template
        return request.render('cashier_login.cashier_login', {
            'redirect': redirect,
            'error': kw.get('error', ''),
            'login': kw.get('login', ''),
        })

    @http.route('/cashier/login/process', type='http', auth='public', methods=['POST'], csrf=False, website=True)
    def cashier_login_post(self, redirect=None, **post):
        """
        Process the login for cashiers
        """
        # Get the login credentials
        login = post.get('login', '')
        password = post.get('password', '')

        if not login or not password:
            return request.render('cashier_login.cashier_login', {
                'error': 'Please enter both email and password',
                'login': login,
            })

        # Authenticate the user
        try:
            request.env.cr.execute(
                "SELECT id FROM res_users WHERE login=%s AND active=True",
                [login]
            )
            user_results = request.env.cr.fetchall()

            if not user_results:
                return request.render('cashier_login.cashier_login', {
                    'error': 'Invalid email or password',
                    'login': login,
                })

            # Attempt to authenticate
            uid = request.session.authenticate(request.session.db, login, password)

            if uid:
                # User authenticated successfully
                # Check if user has POS permissions before redirect
                user = request.env['res.users'].sudo().browse(uid)

                # Check if user has POS Cashier permissions
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
                        return http.redirect(f'/pos/ui#session_access/{pos_session.id}')

                    # If no specific session exists but user has POS access, redirect to POS main page
                    return http.redirect('/pos/ui')

                # If user doesn't have POS permissions, redirect to standard backend
                return http.redirect('/web')
            else:
                # Authentication failed
                return request.render('cashier_login.cashier_login', {
                    'error': 'Invalid email or password',
                    'login': login,
                })

        except Exception as e:
            # Error during authentication
            return request.render('cashier_login.cashier_login', {
                'error': 'Authentication error occurred',
                'login': login,
            })