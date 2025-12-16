# Cara Menjalankan Odoo 17

## Opsi 1: Menggunakan Docker (Recommended & Simpel)

### Jalankan dengan single command:
```bash
docker run -d -e POSTGRES_USER=odoo -e POSTGRES_PASSWORD=odoo -e POSTGRES_DB=postgres --name db postgres:15

docker run -d -p 8069:8069 --name odoo --link db:db -t odoo:17
```

**Akses:** http://localhost:8069

---

## Opsi 2: Gunakan Docker Compose dari Project

Jika Docker sudah terinstall di Windows Anda:

```bash
# Build image
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f web
```

**Akses:** http://localhost:8070

---

## Opsi 3: Install Odoo Manual

Download dari https://www.odoo.com/page/download lalu install.

---

## Setelah Odoo Running

### 1. Setup Database Pertama Kali
- Buka browser ke http://localhost:8069 (atau 8070)
- Klik **"Manage Databases"**
- Create new database:
  - Database Name: `odoo`
  - Email: `admin@example.com`
  - Password: `admin`
  - Language: English
  - Country: Indonesia

### 2. Install Modules
Setelah login:
- Apps → Search "Inventory" → **Install**
- Apps → Search "Point of Sale" → **Install**
- Apps → Search "Sales" → **Install**

### 3. Buat User untuk Kasir
- Settings → Users & Companies → Users
- Create user baru:
  - Name: `Kasir 1`
  - Email: `kasir@example.com`
  - Access Rights:
    - ✅ Point of Sale / User
    - ❌ (uncheck yang lain)

### 4. Konfigurasi POS
- Point of Sale → Configuration → Point of Sale
- Create POS config baru
- Set payment methods (minimal cash)

---

## Update Backend .env

Edit file `server/.env`:

```env
# Jika pakai opsi 1
ODOO_URL=http://localhost:8069
ODOO_DB=odoo
ODOO_ADMIN_USERNAME=admin
ODOO_ADMIN_PASSWORD=admin

# Jika pakai opsi 2 (docker-compose dari project)
ODOO_URL=http://localhost:8070
ODOO_DB=odoo
ODOO_ADMIN_USERNAME=admin
ODOO_ADMIN_PASSWORD=admin
```

**Restart backend setelah update .env:**
- Ctrl+C di terminal server
- `npm run dev` lagi

---

## Troubleshooting

**Docker tidak jalan:**
- Pastikan Docker Desktop running
- Restart Docker Desktop
- Atau gunakan Odoo manual install

**Port sudah dipakai:**
```bash
# Stop container yang lama
docker stop odoo db
docker rm odoo db

# Jalankan ulang
```

**Database error:**
- Create database via browser: http://localhost:8069/web/database/manager
