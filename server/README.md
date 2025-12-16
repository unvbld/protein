# Inventory & POS Middleware Server

Backend API middleware yang menghubungkan custom frontend dengan Odoo 17.

## Prerequisites

- Node.js 18 atau lebih baru
- Odoo 17 instance yang running
- Akses ke Odoo database

## Installation

```bash
cd server
npm install
```

## Configuration

1. Copy `.env.example` ke `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` dan isi dengan konfigurasi Odoo Anda:
```env
ODOO_URL=http://localhost:8069
ODOO_DB=your_database_name
ODOO_ADMIN_USERNAME=admin
ODOO_ADMIN_PASSWORD=admin
JWT_SECRET=your-secret-key-here
```

## Odoo Setup Requirements

Pastikan di Odoo sudah terinstall dan dikonfigurasi:

1. **Required Modules**:
   - Inventory (`stock`)
   - Point of Sale (`point_of_sale`)
   - Sales (`sale`)

2. **User Roles**:
   - Admin: Beri groups `Inventory / Manager` dan `Point of Sale / Manager`
   - Kasir: Beri group `Point of Sale / User`

3. **POS Configuration**:
   - Buat minimal 1 POS Config di Odoo
   - Set payment methods di POS Config

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan running di `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan Odoo credentials
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Products (Admin only untuk write)
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Archive product (admin)

### POS
- `GET /api/pos/products` - Products for POS
- `POST /api/pos/orders` - Create order
- `GET /api/pos/orders` - List orders
- `GET /api/pos/orders/:id` - Get order

### Dashboard (Admin only)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/sales?period=week` - Sales data
- `GET /api/dashboard/top-products?limit=10` - Top products
- `GET /api/dashboard/low-stock?threshold=20` - Low stock alerts

## Testing

Test connection:
```bash
curl http://localhost:5000/health
```

Test login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

## Project Structure

```
server/
├── src/
│   ├── services/        # Odoo integration services
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth & role check middleware
│   └── server.js        # Main application
├── package.json
└── .env
```

## Troubleshooting

**Error: "Authentication failed"**
- Verify Odoo URL is correct and accessible
- Check database name
- Verify username and password

**Error: "No POS configuration found"**
- Login to Odoo backend
- Go to Point of Sale → Configuration → Point of Sale
- Create a new POS configuration

**Error: Connection refused**
- Make sure Odoo is running
- Check if Odoo URL and port are correct

## Development Notes

- JWT tokens expire in 24 hours
- Role detection based on Odoo user groups
- Products are archived, not deleted (Odoo best practice)
- POS sessions are auto-created if not exists
