import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            // Redirect based on role
            if (result.user.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/pos');
            }
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-split-container">
                {/* Left Sidebar - Dark Blue */}
                <div className="login-sidebar">
                    <div className="login-sidebar-content">
                        <div className="login-brand">
                            <h1>SIGWAN ATK</h1>
                        </div>
                        <div className="login-sidebar-icon">
                            <svg width="200" height="200" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="30" y="20" width="60" height="80" rx="4" fill="white" opacity="0.9" />
                                <rect x="40" y="35" width="40" height="6" rx="2" fill="#1e40af" />
                                <rect x="40" y="50" width="40" height="6" rx="2" fill="#1e40af" />
                                <rect x="40" y="65" width="25" height="6" rx="2" fill="#1e40af" />
                            </svg>
                        </div>
                        <div className="login-sidebar-title">
                            <h2>Point of Sale</h2>
                            <p>Sistem Manajemen Toko</p>
                        </div>
                    </div>
                </div>

                {/* Right Form Area - White */}
                <div className="login-form-area">
                    <div className="login-form-container">
                        <div className="login-form-header">
                            <span className="login-subtitle">SISTEM MANAJEMEN</span>
                            <h2>Sign in</h2>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Masukkan username"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-login" disabled={loading}>
                                {loading ? 'Loading...' : 'Sign In'}
                            </button>
                        </form>

                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
