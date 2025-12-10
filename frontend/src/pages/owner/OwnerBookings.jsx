import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { format } from 'date-fns';
import { Calendar, Package, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import '../Bookings.css';
import './Owner.css';

export default function OwnerBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const fetchBookings = async () => {
        try {
            const response = await bookingAPI.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined });
            setBookings(response.data.data);
        } catch (error) {
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        setActionLoading(id);
        try {
            await bookingAPI.updateStatus(id, status);
            toast.success(`Booking ${status}`);
            fetchBookings();
        } catch (error) {
            toast.error('Action failed');
        } finally {
            setActionLoading(null);
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
        <div className="owner-bookings-page">
            <div className="page-header">
                <div>
                    <h1>Booking Requests</h1>
                    <p>Manage rental requests for your equipment</p>
                </div>
            </div>

            <div className="filters-bar">
                <div className="tabs">
                    {['pending', 'approved', 'active', 'completed', 'all'].map((status) => (
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
                    <h3>No {statusFilter} bookings</h3>
                    <p>Booking requests will appear here</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="booking-card owner-booking">
                            <div className="booking-image">
                                {booking.equipment_image ? (
                                    <img src={booking.equipment_image} alt={booking.equipment_title} />
                                ) : (
                                    <div className="no-image">
                                        <Package size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="booking-content">
                                <div className="booking-header">
                                    <div>
                                        <span className="booking-number">#{booking.booking_number}</span>
                                        <h3>{booking.equipment_title}</h3>
                                    </div>
                                    <span className={`badge status-${booking.status}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="booking-details">
                                    <span>
                                        <Calendar size={16} />
                                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                                    </span>
                                </div>
                                <div className="renter-info">
                                    <span>Renter: {booking.renter_first_name} {booking.renter_last_name}</span>
                                </div>

                                {booking.status === 'pending' && (
                                    <div className="quick-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStatusUpdate(booking.id, 'approved')}
                                            disabled={actionLoading === booking.id}
                                        >
                                            {actionLoading === booking.id ? <Loader2 className="spinner" size={14} /> : <><CheckCircle size={14} /> Approve</>}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                            disabled={actionLoading === booking.id}
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                        <Link to={`/bookings/${booking.id}`} className="btn btn-ghost btn-sm">
                                            View Details
                                        </Link>
                                    </div>
                                )}

                                {booking.status === 'approved' && (
                                    <div className="quick-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStatusUpdate(booking.id, 'active')}
                                            disabled={actionLoading === booking.id}
                                        >
                                            Start Rental
                                        </button>
                                    </div>
                                )}

                                {booking.status === 'active' && (
                                    <div className="quick-actions">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                            disabled={actionLoading === booking.id}
                                        >
                                            Mark Complete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
