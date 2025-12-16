import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/pos'} /> : <Login />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute requiredRole="admin">
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <PrivateRoute requiredRole="admin">
            <Inventory />
          </PrivateRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <PrivateRoute>
            <POS />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
