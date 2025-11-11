from odoo import models, fields

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    price_grosir = fields.Float(string="Harga Grosir")
    price_bon = fields.Float(string="Harga Bon")
    status_barang = fields.Selection(
        [('available', 'Tersedia'), ('habis', 'Habis'), ('titip', 'Titip')],
        string="Status Barang",
        default='available'
    )
    keterangan = fields.Text(string="Keterangan")
