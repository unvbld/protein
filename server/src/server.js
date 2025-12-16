import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import posRoutes from './routes/pos.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Odoo Middleware Server is running',
        odoo_configured: !!(process.env.ODOO_URL && process.env.ODOO_DB)
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Inventory & POS Middleware Server Started');
    console.log('='.repeat(60));
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(``);
    console.log(`🔗 Odoo Configuration:`);
    console.log(`   URL: ${process.env.ODOO_URL || 'NOT SET'}`);
    console.log(`   DB: ${process.env.ODOO_DB || 'NOT SET'}`);
    console.log(``);
    console.log(`📊 API Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth/*`);
    console.log(`   - Products: http://localhost:${PORT}/api/products/*`);
    console.log(`   - POS: http://localhost:${PORT}/api/pos/*`);
    console.log(`   - Dashboard: http://localhost:${PORT}/api/dashboard/*`);
    console.log('='.repeat(60));
    console.log(`💡 Next Steps:`);
    console.log(`   1. Configure Odoo credentials in .env file`);
    console.log(`   2. Ensure Odoo is running at ${process.env.ODOO_URL || 'your-odoo-url'}`);
    console.log(`   3. Start the frontend application`);
    console.log('='.repeat(60));
});

export default app;
