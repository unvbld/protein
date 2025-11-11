FROM odoo:17.0

# opsional: pastikan pip & tools siap kalau butuh dep python tambahan
USER root
RUN pip install --no-cache-dir psycopg2-binary
USER odoo

# Odoo official image otomatis baca /etc/odoo/odoo.conf dan addons_path di dalamnya
