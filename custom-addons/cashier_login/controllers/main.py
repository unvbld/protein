from odoo import http, _
from odoo.http import request
from odoo.addons.web.controllers.home import Home as BaseHome
import json
import logging

_logger = logging.getLogger(__name__)


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

    @http.route('/cashier/login/process', type='http', auth='public', methods=['POST'], website=True)
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

                # Debug: print user's groups
                user_group_ids = user.groups_id.ids
                _logger.info(f"User {user.login} has groups: {user_group_ids}")

                # Check if user has either POS user or POS manager permissions
                has_pos_access = False
                if pos_user_group and pos_user_group.id in user_group_ids:
                    has_pos_access = True
                    _logger.info(f"User {user.login} has POS User group")
                elif pos_manager_group and pos_manager_group.id in user_group_ids:
                    has_pos_access = True
                    _logger.info(f"User {user.login} has POS Manager group")
                else:
                    _logger.info(f"User {user.login} does NOT have POS access")

                if has_pos_access:
                    # User has POS permissions, find an appropriate POS configuration and redirect
                    pos_config = request.env['pos.config'].sudo().search([('active', '=', True)], limit=1)

                    if pos_config:
                        # Redirect to POS with config parameter
                        redirect_url = f'/pos/ui?config_id={pos_config.id}#cids={request.env.company.id}'
                        _logger.info(f"User {user.login} will be redirected to POS UI: {redirect_url}")
                    else:
                        # Fallback if no POS config is found
                        redirect_url = '/pos/ui'
                        _logger.info(f"No POS config found, redirecting user {user.login} to generic POS UI")

                    # Return a response that redirects to the POS
                    return request.redirect(redirect_url)
                else:
                    # If user doesn't have POS permissions, redirect to standard backend
                    _logger.info(f"User {user.login} will be redirected to web backend")
                    # Redirect to standard backend
                    return request.redirect('/web')
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