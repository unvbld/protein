{
    "name": "POS Cashier Permissions",
    "summary": "Allow POS cashiers to perform operations without being redirected to backend",
    "description": """
    Provides additional permissions for POS cashiers to perform operations like 
    closing sessions without being redirected to the backend when errors occur.
    """,
    "version": "17.0.1.0.0",
    "category": "Point of Sale",
    "author": "Protein Project",
    "depends": [
        "base",
        "point_of_sale",
    ],
    "data": [
        "security/pos_cashier_security.xml",
    ],
    "demo": [],
    "installable": True,
    "auto_install": False,
    "license": "LGPL-3",
}