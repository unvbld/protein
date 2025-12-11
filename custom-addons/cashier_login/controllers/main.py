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