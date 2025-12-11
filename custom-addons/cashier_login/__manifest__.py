{
    "name": "Cashier Direct Login",
    "summary": "Provides a direct login interface for cashiers that redirects to POS",
    "description": """
    This module provides a special login page for cashiers that 
    redirects them directly to the POS interface after login.
    """,
    "version": "17.0.1.0.0",
    "category": "Point of Sale",
    "author": "Protein Project",
    "depends": [
        "base",
        "point_of_sale",
        "web",
    ],
    "data": [
        "views/cashier_login_template.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "cashier_login/static/src/js/cashier_login.js",
        ],
        "web.assets_common": [
            "cashier_login/static/src/scss/login_style.scss",
        ],
    },
    "demo": [],
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}