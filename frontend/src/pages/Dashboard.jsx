import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useBookingStore, useNotificationStore } from '../store';
import {
    CalendarDays, Package, Clock, CheckCircle, XCircle,
    ArrowRight, Bell, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuthStore();
    const { bookings, fetchBookings } = useBookingStore();
    const { notifications, fetchNotifications, markAsRead } = useNotificationStore();

    useEffect(() => {
        fetchBookings({ limit: 5 });
        fetchNotifications();
    }, []);

    const recentBookings = bookings.slice(0, 5);
    const recentNotifications = notifications.slice(0, 5);

    const getStatusClass = (status) => `status-${status}`;

    return (
        <div className="dashboard-page">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-content">
                    <h1>Welcome back, {user?.firstName}!</h1>
                    <p>Here's what's happening with your account</p>
                </div>
                <div className="quick-actions">
                    {user?.role === 'owner' && (
                        <Link to="/add-equipment" className="btn btn-primary">
                            <Package size={18} />
                            Add Equipment
                        </Link>
                    )}
                    <Link to="/equipment" className="btn btn-secondary">
                        Browse Equipment
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {bookings.filter(b => b.status === 'pending').length}
                        </span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon active">
                        <CalendarDays size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {bookings.filter(b => b.status === 'active').length}
                        </span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon completed">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {bookings.filter(b => b.status === 'completed').length}
                        </span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon total">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{bookings.length}</span>
                        <span className="stat-label">Total Bookings</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Recent Bookings */}
                <div className="card dashboard-card">
                    <div className="card-header">
                        <h2>Recent Bookings</h2>
                        <Link to="/bookings" className="view-all">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="card-body">
                        {recentBookings.length > 0 ? (
                            <div className="booking-list">
                                {recentBookings.map((booking) => (
                                    <Link key={booking.id} to={`/bookings/${booking.id}`} className="booking-item">
                                        <div className="booking-image">
                                            {booking.equipment_image ? (
                                                <img src={booking.equipment_image} alt={booking.equipment_title} />
                                            ) : (
                                                <Package size={24} />
                                            )}
                                        </div>
                                        <div className="booking-info">
                                            <h4>{booking.equipment_title}</h4>
                                            <span className="booking-dates">
                                                {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <span className={`badge ${getStatusClass(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-small">
                                <p>No bookings yet</p>
                                <Link to="/equipment" className="btn btn-primary btn-sm">
                                    Browse Equipment
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="card dashboard-card">
                    <div className="card-header">
                        <h2>Notifications</h2>
                        <button onClick={() => { }} className="view-all">
                            Mark all read
                        </button>
                    </div>
                    <div className="card-body">
                        {recentNotifications.length > 0 ? (
                            <div className="notification-list">
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.is_read ? '' : 'unread'}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="notification-icon">
                                            <Bell size={18} />
                                        </div>
                                        <div className="notification-content">
                                            <h4>{notification.title}</h4>
                                            <p>{notification.message}</p>
                                            <span className="notification-time">
                                                {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-small">
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
