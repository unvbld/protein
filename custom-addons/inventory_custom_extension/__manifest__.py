{
    'name': 'Inventory Custom Extension',
    'version': '1.0',
    'summary': 'Custom fields for product inventory (grosir/bon/status)',
    'author': 'Oliver Leon',
    'license': 'LGPL-3',
    'category': 'Inventory',
    'depends': ['stock', 'product'],
    'data': [
        'views/product_inherit_view.xml',
    ],
    'installable': True,
    'application': False,
}
