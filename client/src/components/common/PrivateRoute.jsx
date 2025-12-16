import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // Redirect based on user role
        return <Navigate to={user.role === 'admin' ? '/dashboard' : '/pos'} replace />;
    }

    return children;
};

export default PrivateRoute;
