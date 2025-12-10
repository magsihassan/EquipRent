import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../store';
import {
    LayoutDashboard, Package, CalendarDays, User, Bell, Settings,
    LogOut, Truck, Plus, Users, CheckSquare, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import './DashboardLayout.css';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const { unreadCount } = useNotificationStore();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Navigation items based on role
    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['renter', 'owner', 'admin'] },
        { path: '/bookings', icon: CalendarDays, label: 'My Bookings', roles: ['renter', 'owner', 'admin'] },
        { path: '/profile', icon: User, label: 'Profile', roles: ['renter', 'owner', 'admin'] },
    ];

    const ownerItems = [
        { divider: true, label: 'Owner', roles: ['owner'] },
        { path: '/my-equipment', icon: Package, label: 'My Equipment', roles: ['owner'] },
        { path: '/add-equipment', icon: Plus, label: 'Add Equipment', roles: ['owner'] },
        { path: '/owner/bookings', icon: CheckSquare, label: 'Booking Requests', roles: ['owner'] },
    ];

    const adminItems = [
        { divider: true, label: 'Admin', roles: ['admin'] },
        { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', roles: ['admin'] },
        { path: '/admin/users', icon: Users, label: 'Manage Users', roles: ['admin'] },
        { path: '/admin/equipment', icon: Package, label: 'Equipment Approval', roles: ['admin'] },
        { path: '/admin/bookings', icon: CalendarDays, label: 'All Bookings', roles: ['admin'] },
    ];

    const allItems = [...navItems, ...ownerItems, ...adminItems].filter(
        item => item.roles?.includes(user?.role)
    );

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="logo">
                        <Truck className="logo-icon" />
                        {sidebarOpen && <span className="logo-text">EquipRent</span>}
                    </Link>
                    <button className="sidebar-toggle desktop" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <ChevronRight />
                    </button>
                    <button className="sidebar-toggle mobile" onClick={() => setMobileOpen(false)}>
                        <X />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {allItems.map((item, index) => (
                        item.divider ? (
                            sidebarOpen && (
                                <div key={index} className="nav-divider">
                                    <span>{item.label}</span>
                                </div>
                            )
                        ) : (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                            >
                                <item.icon size={20} />
                                {sidebarOpen && <span>{item.label}</span>}
                            </Link>
                        )
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item" onClick={handleLogout}>
                        <LogOut size={20} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Top Bar */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <h1 className="page-title">
                            {allItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="header-right">
                        <Link to="/dashboard" className="header-btn notification-btn">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </Link>

                        <Link to="/profile" className="user-info">
                            <div className="avatar">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{user?.firstName} {user?.lastName}</span>
                                <span className="user-role">{user?.role}</span>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
