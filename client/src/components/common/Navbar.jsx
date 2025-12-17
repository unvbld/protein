import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            logout();
        }
    };

    if (!user) return null;

    // Role-based menu visibility
    const canViewDashboard = user.role === 'admin';
    const canViewInventory = user.role === 'admin';
    const canViewPOS = true; // All roles can access POS

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1>📦 Inventory & POS</h1>
                </div>

                <div className="navbar-menu">
                    {canViewDashboard && (
                        <Link to="/dashboard" className="nav-link">
                            📊 Dashboard
                        </Link>
                    )}
                    {canViewInventory && (
                        <Link to="/inventory" className="nav-link">
                            📦 Inventory
                        </Link>
                    )}
                    {canViewPOS && (
                        <Link to="/pos" className="nav-link">
                            💰 POS
                        </Link>
                    )}
                </div>

                <div className="navbar-user">
                    <span className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role.toUpperCase()}</span>
                    </span>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
