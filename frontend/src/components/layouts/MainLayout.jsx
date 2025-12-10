import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../store';
import {
    Menu, X, Search, Bell, User, LogIn, ChevronDown,
    Truck, Settings, LogOut
} from 'lucide-react';
import './MainLayout.css';

export default function MainLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuthStore();
    const { unreadCount } = useNotificationStore();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="main-layout">
            {/* Header */}
            <header className="header">
                <div className="container header-content">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <Truck className="logo-icon" />
                        <span className="logo-text">EquipRent</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="nav-desktop">
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                            Home
                        </Link>
                        <Link to="/equipment" className={`nav-link ${isActive('/equipment') ? 'active' : ''}`}>
                            Browse Equipment
                        </Link>
                        {isAuthenticated && user?.role === 'owner' && (
                            <Link to="/my-equipment" className={`nav-link ${isActive('/my-equipment') ? 'active' : ''}`}>
                                My Equipment
                            </Link>
                        )}
                    </nav>

                    {/* Actions */}
                    <div className="header-actions">
                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <Link to="/dashboard" className="btn btn-ghost btn-icon notification-btn">
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">{unreadCount}</span>
                                    )}
                                </Link>

                                {/* User Menu */}
                                <div className="dropdown">
                                    <button
                                        className="user-menu-trigger"
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    >
                                        <div className="avatar">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </div>
                                        <span className="user-name">{user?.firstName}</span>
                                        <ChevronDown size={16} />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="dropdown-menu">
                                            <Link to="/dashboard" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <User size={16} />
                                                Dashboard
                                            </Link>
                                            <Link to="/bookings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <Truck size={16} />
                                                My Bookings
                                            </Link>
                                            <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <Settings size={16} />
                                                Profile
                                            </Link>
                                            {user?.role === 'admin' && (
                                                <Link to="/admin" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                    <Settings size={16} />
                                                    Admin Panel
                                                </Link>
                                            )}
                                            <div className="dropdown-divider" />
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    logout();
                                                    setUserMenuOpen(false);
                                                }}
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost">
                                    <LogIn size={18} />
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="mobile-menu">
                        <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            Home
                        </Link>
                        <Link to="/equipment" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                            Browse Equipment
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    Dashboard
                                </Link>
                                <Link to="/bookings" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    My Bookings
                                </Link>
                                <button
                                    className="mobile-nav-link"
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link to="/register" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <Link to="/" className="logo">
                                <Truck className="logo-icon" />
                                <span className="logo-text">EquipRent</span>
                            </Link>
                            <p className="footer-description">
                                Pakistan's premier platform for renting construction equipment.
                                Find excavators, loaders, cranes, and more from trusted owners.
                            </p>
                        </div>

                        <div className="footer-links">
                            <h4>Quick Links</h4>
                            <Link to="/equipment">Browse Equipment</Link>
                            <Link to="/register">List Your Equipment</Link>
                            <Link to="/login">Login</Link>
                        </div>

                        <div className="footer-links">
                            <h4>Categories</h4>
                            <Link to="/equipment?category=excavators">Excavators</Link>
                            <Link to="/equipment?category=loaders">Loaders</Link>
                            <Link to="/equipment?category=cranes">Cranes</Link>
                            <Link to="/equipment?category=bulldozers">Bulldozers</Link>
                        </div>

                        <div className="footer-links">
                            <h4>Contact</h4>
                            <p>Email: info@equiprent.pk</p>
                            <p>Phone: +92 300 1234567</p>
                            <p>Lahore, Pakistan</p>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p>&copy; 2024 EquipRent. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
