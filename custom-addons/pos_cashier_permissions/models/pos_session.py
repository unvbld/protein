from odoo import models, api, _
from odoo.exceptions import AccessError, UserError


class PosSession(models.Model):
    _inherit = 'pos.session'

    @api.model
    def create(self, vals):
        """Override create to ensure POS users can open sessions"""
        # Allow POS users to create sessions
        return super().create(vals)

    def action_pos_session_closing_control(self):
        """Override to handle closing session errors gracefully"""
        try:
            return super().action_pos_session_closing_control()
        except (AccessError, UserError) as e:
            # Instead of letting the error go to backend, handle it in POS
            raise UserError(_("You don't have the necessary permissions to close this session. Please contact an administrator."))

    def action_pos_session_validate(self):
        """Override to handle validation errors gracefully"""
        try:
            return super().action_pos_session_validate()
        except (AccessError, UserError) as e:
            # Handle the error in a POS-friendly way
            raise UserError(_("You don't have the necessary permissions to validate this session. Please contact an administrator."))