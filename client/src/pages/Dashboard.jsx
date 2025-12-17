import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { dashboard as dashboardAPI } from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, topRes, lowStockRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getTopProducts(5),
                dashboardAPI.getLowStock(20)
            ]);

            setStats(statsRes.data);
            setTopProducts(topRes.data);
            setLowStock(lowStockRes.data);
        } catch (error) {
            console.error('Load dashboard error:', error);
            alert('Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <Navbar />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Navbar />

            <div className="content-container">
                <div className="page-header">
                    <h1>Dashboard</h1>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div className="stat-content">
                            <div className="stat-label">Penjualan Hari Ini</div>
                            <div className="stat-value">{stats?.today?.sales_count || 0}</div>
                            <div className="stat-subtitle">
                                Rp {(stats?.today?.revenue || 0).toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div className="stat-content">
                            <div className="stat-label">Penjualan Bulan Ini</div>
                            <div className="stat-value">{stats?.this_month?.sales_count || 0}</div>
                            <div className="stat-subtitle">
                                Rp {(stats?.this_month?.revenue || 0).toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div className="stat-content">
                            <div className="stat-label">Total Produk</div>
                            <div className="stat-value">{stats?.inventory?.total_products || 0}</div>
                            <div className="stat-subtitle">
                                {stats?.inventory?.low_stock_count || 0} produk stok rendah
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div className="stat-content">
                            <div className="stat-label">Total Revenue</div>
                            <div className="stat-value">
                                Rp {((stats?.total_revenue || 0) / 1000000).toFixed(1)}jt
                            </div>
                            <div className="stat-subtitle">Semua waktu</div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>🏆 Top 5 Produk Terlaris</h3>
                        <div className="table-container">
                            <table className="data-table compact">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Terjual</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="3">Belum ada data</td>
                                        </tr>
                                    ) : (
                                        topProducts.map((product, idx) => (
                                            <tr key={idx}>
                                                <td>{product.product_name}</td>
                                                <td>{product.total_sold}</td>
                                                <td>Rp {product.total_revenue.toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Stok Rendah</h3>
                        <div className="table-container">
                            <table className="data-table compact">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Stok</th>
                                        <th>Harga</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStock.length === 0 ? (
                                        <tr>
                                            <td colSpan="3">Semua stok aman</td>
                                        </tr>
                                    ) : (
                                        lowStock.map((product) => (
                                            <tr key={product.id}>
                                                <td>{product.name}</td>
                                                <td className="low-stock">{product.stock}</td>
                                                <td>Rp {product.price.toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
