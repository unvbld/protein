{
    "name": "Auto POS Login",
    "summary": "Automatically redirect POS users to the cashier interface after login",
    "description": """
    This module automatically redirects users with POS Cashier permissions
    to the POS interface after successful login, instead of the standard backend.
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
        "views/templates.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "auto_pos_login/static/src/js/auto_pos_login.js",
        ],
    },
    "demo": [],
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}