import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import RegistrationPending from './pages/RegistrationPending';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';

// Protected Pages
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';

// Owner Pages
import MyEquipment from './pages/owner/MyEquipment';
import AddEquipment from './pages/owner/AddEquipment';
import EditEquipment from './pages/owner/EditEquipment';
import OwnerBookings from './pages/owner/OwnerBookings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEquipment from './pages/admin/AdminEquipment';
import AdminBookings from './pages/admin/AdminBookings';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    const { initAuth } = useAuthStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    return (
        <Router>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid rgba(148, 163, 184, 0.2)'
                    },
                    success: {
                        iconTheme: { primary: '#10b981', secondary: '#f1f5f9' }
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' }
                    }
                }}
            />

            <Routes>
                {/* Public Routes */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/equipment" element={<Equipment />} />
                    <Route path="/equipment/:id" element={<EquipmentDetail />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/registration-pending" element={<RegistrationPending />} />

                {/* Protected User Routes */}
                <Route element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/bookings" element={<MyBookings />} />
                    <Route path="/bookings/:id" element={<BookingDetail />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Owner Routes */}
                <Route element={
                    <ProtectedRoute roles={['owner', 'admin']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/my-equipment" element={<MyEquipment />} />
                    <Route path="/add-equipment" element={<AddEquipment />} />
                    <Route path="/edit-equipment/:id" element={<EditEquipment />} />
                    <Route path="/owner/bookings" element={<OwnerBookings />} />
                </Route>

                {/* Admin Routes */}
                <Route element={
                    <ProtectedRoute roles={['admin']}>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/equipment" element={<AdminEquipment />} />
                    <Route path="/admin/bookings" element={<AdminBookings />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
