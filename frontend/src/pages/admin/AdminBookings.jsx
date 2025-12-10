import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { Calendar, Package, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import '../Bookings.css';
import './Admin.css';

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            const response = await adminAPI.getAllBookings({
                status: statusFilter !== 'all' ? statusFilter : undefined
            });
            setBookings(response.data.data);
        } catch (error) {
            toast.error('Failed to load bookings');
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
        <div className="admin-bookings-page">
            <div className="page-header">
                <div>
                    <h1>All Bookings</h1>
                    <p>View all platform bookings</p>
                </div>
            </div>

            <div className="filters-bar">
                <div className="tabs">
                    {['all', 'pending', 'approved', 'active', 'completed', 'rejected', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            className={`tab ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(status); setLoading(true); }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Calendar size={40} />
                    </div>
                    <h3>No bookings found</h3>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Booking #</th>
                                <th>Equipment</th>
                                <th>Renter</th>
                                <th>Owner</th>
                                <th>Dates</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>
                                        <span className="booking-number">#{booking.booking_number}</span>
                                    </td>
                                    <td>
                                        <div className="equipment-cell">
                                            <div className="equipment-thumb">
                                                {booking.equipment_image ? (
                                                    <img src={booking.equipment_image} alt={booking.equipment_title} />
                                                ) : (
                                                    <Package size={16} />
                                                )}
                                            </div>
                                            <span className="equipment-title">{booking.equipment_title}</span>
                                        </div>
                                    </td>
                                    <td>{booking.renter_first_name} {booking.renter_last_name}</td>
                                    <td>{booking.owner_first_name} {booking.owner_last_name}</td>
                                    <td>
                                        <div className="dates-cell">
                                            <span>{format(new Date(booking.start_date), 'MMM d')}</span>
                                            <span>-</span>
                                            <span>{format(new Date(booking.end_date), 'MMM d, yyyy')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge status-${booking.status}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/bookings/${booking.id}`} className="btn btn-ghost btn-sm">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
