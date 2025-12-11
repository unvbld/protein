{
    "name": "POS Custom Theme",
    "summary": "Custom theme for Odoo POS interface",
    "description": """
    Provides custom styling for the Point of Sale interface to make it more attractive
    and user-friendly for cashiers.
    """,
    "version": "17.0.1.0.0",
    "category": "Point of Sale",
    "author": "Protein Project",
    "depends": [
        "base",
        "point_of_sale",
    ],
    "data": [],
    "assets": {
        "point_of_sale.assets": {
            "before": [
                "point_of_sale/static/src/css/pos.css",
            ],
            "append": [
                "pos_custom_theme/static/src/css/custom_pos.css",
                "pos_custom_theme/static/src/js/custom_pos.js",
            ]
        }
    },
    "demo": [],
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}