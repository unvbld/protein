# Quick Setup Guide

## 🚀 Langkah-langkah Setup

### 1. Persiapan Odoo 17

#### Install Modules (jika belum):
1. Login ke Odoo sebagai admin
2. Buka **Apps**
3. Install modules berikut:
   - [ ] **Inventory** (stock)
   - [ ] **Point of Sale** (point_of_sale)
   - [ ] **Sales** (sale)

#### Konfigurasi POS:
1. Buka **Point of Sale → Configuration → Point of Sale**
2. Klik **Create**
3. Isi nama POS (contoh: "POS Toko 1")
4. Set payment methods (minimal cash)
5. Save

#### Buat User Roles:

**Admin User:**
1. **Settings → Users & Companies → Users**
2. Create atau edit user
3. Set groups:
   - ✅ Inventory / Manager
   - ✅ Point of Sale / Manager
   - ✅ Sales / Administrator

**Kasir User:**
1. Create user baru untuk kasir
2. Set groups:
   - ✅ Point of Sale / User
   - ❌ Jangan beri akses Inventory atau Dashboard

---

### 2. Backend Setup

```bash
# Masuk ke folder server
cd server

# Install dependencies
npm install

# Edit file .env
# Buka .env dengan text editor dan sesuaikan:
# ODOO_URL=http://localhost:8069  (atau IP server Odoo Anda)
# ODOO_DB=nama_database_odoo_anda
# ODOO_ADMIN_USERNAME=admin  (atau username admin Anda)
# ODOO_ADMIN_PASSWORD=password_admin_anda
# JWT_SECRET=ganti-dengan-string-random-yang-panjang

# Jalankan server
npm run dev

# Server akan running di http://localhost:5000
# Jika berhasil, Anda akan lihat:
# ✓ Server running on http://localhost:5000
# ✓ Odoo Configuration: URL: http://localhost:8069, DB: your_db
```

**Tes Backend:**
```bash
# Test health check
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin\"}"

# Jika berhasil, akan ada response dengan token
```

---

### 3. Frontend Setup

```bash
# Buka terminal baru (jangan tutup terminal server)
# Masuk ke folder client
cd client

# Install dependencies
npm install

# Jalankan frontend
npm run dev

# Frontend akan running di http://localhost:5173
# Buka browser dan akses http://localhost:5173
```

---

### 4. Testing

#### Login sebagai Admin:
1. Buka `http://localhost:5173`
2. Login dengan admin credentials dari Odoo
3. Seharusnya redirect ke **Dashboard**
4. Check menu: Dashboard, Inventory, POS semua ada

#### Test Inventory:
1. Klik **Inventory**
2. Klik **+ Tambah Produk**
3. Isi form (nama, harga, stok)
4. Klik **Tambah**
5. Produk muncul di table

#### Test POS:
1. Klik **POS**
2. Search produk
3. Klik produk untuk add to cart
4. Adjust quantity
5. Klik **Bayar**
6. Pilih **Cash** atau **Card**
7. Transaksi berhasil
8. **Verify di Odoo**: Buka Point of Sale → Orders, transaksi harus ada

#### Login sebagai Kasir:
1. Logout (klik tombol Logout)
2. Login dengan kasir credentials
3. Seharusnya langsung masuk ke **POS**
4. Menu lain (Dashboard, Inventory) tidak ada
5. Test create transaction

---

### 5. Troubleshooting

**Frontend tidak bisa connect ke backend:**
- Check apakah backend running di port 5000
- Check `.env` di client, pastikan `VITE_API_URL=http://localhost:5000/api`
- Restart frontend: Ctrl+C, lalu `npm run dev` lagi

**Backend tidak bisa connect ke Odoo:**
- Check apakah Odoo running
- Verify URL Odoo di `.env` backend
- Test akses Odoo di browser: `http://localhost:8069`
- Check database name dan credentials

**"No POS configuration found":**
- Buat POS config di Odoo (lihat langkah 1)

**Products tidak muncul di POS:**
- Di Odoo, buka product
- Set "Available in POS" = checked
- Atau create products via Inventory page di custom frontend

**Authentication failed:**
- Verify username dan password benar
- Check apakah user exists di Odoo
- Check database name di .env

---

## 📱 Usage Tips

**Untuk Admin:**
- Gunakan Dashboard untuk monitoring sales
- Kelola inventory via Inventory page
- Check low stock alerts secara berkala

**Untuk Kasir:**
- Focus di POS interface
- Gunakan search untuk cari produk cepat
- Adjust quantity sebelum checkout

**Keyboard Shortcuts (Coming Soon):**
- Enter = Focus search
- F10 = Quick checkout

---

## 🔄 Production Deployment

Untuk deployment ke production:

1. **Backend:**
   - Set `NODE_ENV=production`
   - Ganti `JWT_SECRET` dengan string yang sangat random
   - Setup HTTPS dengan reverse proxy (nginx)
   - Configure proper CORS origins

2. **Frontend:**
   - Run `npm run build`
   - Deploy build folder ke static hosting
   - Update `VITE_API_URL` ke production backend URL

3. **Odoo:**
   - Pastikan accessible secara external
   - Setup firewall rules yang proper
   - Regular backups

---

## 📞 Support

Untuk pertanyaan atau issues:
1. Check troubleshooting section
2. Check logs di terminal (backend & frontend)
3. Hubungi administrator sistem

---

**Created with ❤️ to simplify Odoo for toko alat tulis kantor**
