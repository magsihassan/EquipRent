import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookingStore, useAuthStore } from '../store';
import { format } from 'date-fns';
import { Package, Calendar, MapPin, Filter, Loader2 } from 'lucide-react';
import './Bookings.css';

export default function MyBookings() {
    const { bookings, isLoading, fetchBookings } = useBookingStore();
    const { user } = useAuthStore();
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = statusFilter === 'all'
        ? bookings
        : bookings.filter(b => b.status === statusFilter);

    const getStatusClass = (status) => `status-${status}`;

    if (isLoading) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={40} />
                <p>Loading bookings...</p>
            </div>
        );
    }

    return (
        <div className="bookings-page">
            {/* Filters */}
            <div className="filters-bar">
                <div className="tabs">
                    {['all', 'pending', 'approved', 'active', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            className={`tab ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => setStatusFilter(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Calendar size={40} />
                    </div>
                    <h3>No bookings found</h3>
                    <p>
                        {statusFilter === 'all'
                            ? "You haven't made any bookings yet"
                            : `No ${statusFilter} bookings`}
                    </p>
                    <Link to="/equipment" className="btn btn-primary">
                        Browse Equipment
                    </Link>
                </div>
            ) : (
                <div className="bookings-list">
                    {filteredBookings.map((booking) => (
                        <Link key={booking.id} to={`/bookings/${booking.id}`} className="booking-card">
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
                                    <span className={`badge ${getStatusClass(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="booking-details">
                                    <span>
                                        <Calendar size={16} />
                                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                                    </span>
                                    <span>
                                        <MapPin size={16} />
                                        {booking.equipment_city}
                                    </span>
                                </div>
                                <div className="booking-meta">
                                    <span className="owner-info">
                                        {user?.role === 'renter' ? (
                                            <>Owner: {booking.owner_first_name} {booking.owner_last_name}</>
                                        ) : (
                                            <>Renter: {booking.renter_first_name} {booking.renter_last_name}</>
                                        )}
                                    </span>
                                    <span className="booking-date">
                                        Booked on {format(new Date(booking.created_at), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
