# Inventory & POS System dengan Odoo 17

Sistem manajemen inventaris dan Point of Sale untuk toko alat tulis kantor dengan custom frontend dan Odoo 17 backend.

## 📋 Overview

Sistem ini menggantikan akses langsung ke Odoo backend dengan interface custom yang lebih sederhana dan user-friendly. Terdiri dari:

- **Backend Middleware** (Node.js + Express): API layer yang berkomunikasi dengan Odoo via XML-RPC
- **Frontend** (React + Vite): Custom UI yang clean dan mudah digunakan
- **Odoo 17**: Backend untuk data persistence, inventory management, dan POS operations

## 🎯 Fitur Utama

### Untuk Admin:
- ✅ Dashboard dengan statistik penjualan real-time
- ✅ Manajemen inventory (CRUD produk)
- ✅ Monitoring stok rendah
- ✅ Laporan produk terlaris
- ✅ Akses ke POS

### Untuk Kasir:
- ✅ Interface POS yang simpel dan cepat
- ✅ Search produk
- ✅ Shopping cart management
- ✅ Proses pembayaran
- ✅ **Tidak bisa** akses dashboard atau inventory management

## 🚀 Quick Start

### Prerequisites

1. **Odoo 17** harus sudah terinstall dan running
2. **Node.js** 18+ terinstall
3. **Odoo modules** yang diperlukan:
   - Inventory (`stock`)
   - Point of Sale (`point_of_sale`)
   - Sales (`sale`)

### Setup Odoo

1. Login ke Odoo sebagai administrator
2. Install required modules jika belum
3. Buat user roles:
   - **Admin**: Groups → `Inventory / Manager`, `Point of Sale / Manager`
   - **Kasir**: Groups → `Point of Sale / User`
4. Buat minimal 1 POS Configuration di Point of Sale → Configuration

### Setup Backend Middleware

```bash
cd server
npm install

# Copy dan edit .env
cp .env.example .env
# Edit .env dengan konfigurasi Odoo Anda:
# ODOO_URL=http://localhost:8069
# ODOO_DB=your_database_name
# ODOO_ADMIN_USERNAME=admin
# ODOO_ADMIN_PASSWORD=admin

npm run dev
```

Server akan running di `http://localhost:5000`

### Setup Frontend

```bash
cd client
npm install
npm run dev
```

Frontend akan running di `http://localhost:5173`

## 📁 Project Structure

```
protein/
├── server/                 # Backend middleware
│   ├── src/
│   │   ├── services/       # Odoo integration services
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & role check
│   │   └── server.js       # Main application
│   ├── .env                # Configuration
│   └── package.json
│
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── contexts/       # React contexts
│   │   └── App.jsx
│   ├── .env                # Frontend config
│   └── package.json
│
└── README.md               # This file
```

## 🔐 Authentication

Login menggunakan credentials dari Odoo:
- Username dan password sesuai user yang dibuat di Odoo
- Automatic role detection dari Odoo groups
- Session menggunakan JWT (expire 24 jam)

## 📸 Screenshots & Features

### Login Page
- Clean, simple login form
- Automatic redirect based on role

### POS Interface (Kasir & Admin)
- Product grid dengan search
- Shopping cart dengan quantity control
- Multiple payment methods (cash, card)
- Real-time stock updates ke Odoo

### Inventory Management (Admin Only)
- View all products dalam table
- Add/Edit/Delete products
- Stock management
- Low stock warnings

### Dashboard (Admin Only)
- Today's dan month's sales statistics
- Top selling products
- Low stock alerts
- Revenue overview

## 🛠 API Endpoints

**Authentication:**
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

**Products:**
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

**POS:**
- `GET /api/pos/products` - POS products
- `POST /api/pos/orders` - Create order
- `GET /api/pos/orders` - List orders

**Dashboard:**
- `GET /api/dashboard/stats` - Statistics
- `GET /api/dashboard/sales` - Sales data
- `GET /api/dashboard/top-products` - Top products
- `GET /api/dashboard/low-stock` - Low stock alerts

## ⚙️ Configuration

### Backend (.env)
```env
PORT=5000
ODOO_URL=http://localhost:8069
ODOO_DB=your_database_name
ODOO_ADMIN_USERNAME=admin
ODOO_ADMIN_PASSWORD=admin
JWT_SECRET=your-secret-key-here
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

**"Authentication failed"**
- Check Odoo URL and credentials
- Pastikan Odoo running
- Verify database name benar

**"No POS configuration found"**
- Login ke Odoo backend
- Buat POS configuration di Point of Sale → Configuration

**Products tidak muncul di POS**
- Set `available_in_pos = true` pada product di Odoo
- Atau create product melalui Inventory page

**Frontend tidak bisa connect**
- Pastikan backend middleware running
- Check CORS configuration
- Verify API URL di .env

## 📝 Development Notes

- Backend menggunakan Odoo XML-RPC untuk komunikasi
- Products di-archive (bukan delete) sesuai best practice Odoo
- POS sessions auto-created jika belum ada
- Role detection based on Odoo user groups
- Automatic stock deduction saat POS transaction

## 🔄 Workflow

1. User login via custom frontend
2. Credentials divalidasi via Odoo XML-RPC
3. JWT token di-issue oleh middleware
4. All operations di-forward ke Odoo via middleware
5. Data tetap tersimpan di Odoo (PostgreSQL)
6. Custom frontend hanya untuk tampilan yang lebih baik

## 📚 Further Documentation

- Backend API: `server/README.md`
- Frontend: `client/README.md`
- Odoo 17 Documentation: https://www.odoo.com/documentation/17.0/

## 🤝 Support

Untuk pertanyaan atau issues, silakan hubungi administrator sistem.

---

**Dibuat dengan ❤️ untuk menggantikan kompleksitas Odoo backend UI**