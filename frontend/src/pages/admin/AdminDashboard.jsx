import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Package, CalendarDays, TrendingUp, CheckCircle, Clock, Loader2 } from 'lucide-react';
import './Admin.css';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getDashboard();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={40} />
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="page-header">
                <h1>Admin Dashboard</h1>
                <p>Overview of platform statistics</p>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="stat-icon users">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.users?.total || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{stats?.users?.renters || 0} Renters</span>
                        <span>{stats?.users?.owners || 0} Owners</span>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="stat-icon equipment">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.equipment?.total || 0}</span>
                        <span className="stat-label">Equipment Listed</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{stats?.equipment?.approved || 0} Approved</span>
                        <span>{stats?.equipment?.pending || 0} Pending</span>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="stat-icon bookings">
                        <CalendarDays size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.bookings?.total || 0}</span>
                        <span className="stat-label">Total Bookings</span>
                    </div>
                    <div className="stat-breakdown">
                        <span>{stats?.bookings?.active || 0} Active</span>
                        <span>{stats?.bookings?.completed || 0} Completed</span>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="stat-icon pending">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats?.pendingApprovals || 0}</span>
                        <span className="stat-label">Pending Approvals</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-sections">
                <div className="quick-section">
                    <h2>Quick Stats</h2>
                    <div className="quick-stats">
                        <div className="quick-stat">
                            <CheckCircle size={18} className="success" />
                            <span>Verified Users: {stats?.users?.verified || 0}</span>
                        </div>
                        <div className="quick-stat">
                            <Clock size={18} className="warning" />
                            <span>Unverified Users: {(stats?.users?.total || 0) - (stats?.users?.verified || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
