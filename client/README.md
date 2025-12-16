# Inventory & POS Frontend

Custom React frontend untuk sistem inventory dan POS dengan Odoo 17 backend.

## Prerequisites

- Node.js 18+
- Backend middleware harus running di http://localhost:5000

## Installation

```bash
cd client
npm install
```

## Configuration

File `.env` sudah dikonfigurasi untuk connect ke middleware:
```env
VITE_API_URL=http://localhost:5000/api
```

Jika backend running di port/URL lain, ubah nilai ini.

## Running the App

Development mode:
```bash
npm run dev
```

Application akan running di `http://localhost:5173`

Build for production:
```bash
npm run build
```

## Features

### Login
- Login menggunakan credentials dari Odoo
- Automatic redirect berdasarkan role (admin or kasir)

### POS (Point of Sale)
- Product search dan selection
- Shopping cart management
- Payment processing
- Real-time stock updates ke Odoo

### Inventory Management (Admin Only)
- View all products
- Add new products
- Edit product details
- Delete (archive) products
- Stock management

### Dashboard (Admin Only)
- Today's sales statistics
- Monthly sales statistics
- Top selling products
- Low stock alerts
- Revenue overview

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── common/         # Reusable components
│   ├── contexts/           # React contexts (Auth)
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── App.jsx             # Main app with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/
├── index.html
└── package.json
```

## User Roles

**Admin**:
- Access to Dashboard
- Access to Inventory Management
- Access to POS

**Kasir** (Cashier):
- Access to POS only
- Cannot view Dashboard or Inventory

## Default Credentials

Menggunakan user credentials dari Odoo:
- Check dengan admin Odoo untuk username dan password

## Development Notes

- JWT tokens disimpan di localStorage
- Tokens expire setelah 24 jam
- Role-based routing enforcement
- Responsive design untuk desktop dan tablet
