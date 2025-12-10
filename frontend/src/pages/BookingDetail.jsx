import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookingStore, useAuthStore } from '../store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
    Package, Calendar, MapPin, User, Phone, Mail, Truck,
    CheckCircle, XCircle, Clock, Loader2, ArrowLeft
} from 'lucide-react';
import './BookingDetail.css';

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentBooking, isLoading, fetchBookingById, updateBookingStatus } = useBookingStore();
    const { user } = useAuthStore();
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchBookingById(id);
    }, [id]);

    const handleStatusUpdate = async (status, reason = null) => {
        setActionLoading(true);
        const result = await updateBookingStatus(id, status, { reason });
        setActionLoading(false);

        if (result.success) {
            toast.success(`Booking ${status}`);
            fetchBookingById(id);
            setShowRejectModal(false);
        } else {
            toast.error(result.error || 'Action failed');
        }
    };

    if (isLoading || !currentBooking) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={40} />
            </div>
        );
    }

    const booking = currentBooking;
    const isOwner = booking.owner_id === user?.id;
    const isRenter = booking.renter_id === user?.id;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="status-icon approved" />;
            case 'rejected': return <XCircle className="status-icon rejected" />;
            case 'active': return <Truck className="status-icon active" />;
            case 'completed': return <CheckCircle className="status-icon completed" />;
            case 'cancelled': return <XCircle className="status-icon cancelled" />;
            default: return <Clock className="status-icon pending" />;
        }
    };

    return (
        <div className="booking-detail-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} /> Back to Bookings
            </button>

            <div className="detail-header">
                <div className="header-info">
                    <span className="booking-number">Booking #{booking.booking_number}</span>
                    <h1>{booking.equipment_title}</h1>
                </div>
                <div className={`status-badge ${booking.status}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status}
                </div>
            </div>

            <div className="detail-grid">
                {/* Main Info */}
                <div className="detail-card">
                    <h2>Booking Details</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <Calendar size={18} />
                            <div>
                                <span className="label">Duration</span>
                                <span className="value">
                                    {format(new Date(booking.start_date), 'MMM d, yyyy')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <Clock size={18} />
                            <div>
                                <span className="label">Duration Type</span>
                                <span className="value">{booking.duration_type} ({booking.total_days} days)</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <MapPin size={18} />
                            <div>
                                <span className="label">Equipment Location</span>
                                <span className="value">{booking.equipment_city}</span>
                            </div>
                        </div>
                        {booking.include_operator && (
                            <div className="info-item">
                                <User size={18} />
                                <div>
                                    <span className="label">Operator</span>
                                    <span className="value">Included</span>
                                </div>
                            </div>
                        )}
                        {booking.include_transportation && (
                            <div className="info-item">
                                <Truck size={18} />
                                <div>
                                    <span className="label">Transportation</span>
                                    <span className="value">Requested</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {booking.renter_notes && (
                        <div className="notes-section">
                            <h3>Renter Notes</h3>
                            <p>{booking.renter_notes}</p>
                        </div>
                    )}

                    {booking.rejection_reason && (
                        <div className="notes-section rejection">
                            <h3>Rejection Reason</h3>
                            <p>{booking.rejection_reason}</p>
                        </div>
                    )}
                </div>

                {/* Contact Info */}
                <div className="detail-card">
                    <h2>{isRenter ? 'Owner Contact' : 'Renter Contact'}</h2>
                    <div className="contact-info">
                        <div className="contact-avatar">
                            {isRenter
                                ? `${booking.owner_first_name?.[0]}${booking.owner_last_name?.[0]}`
                                : `${booking.renter_first_name?.[0]}${booking.renter_last_name?.[0]}`
                            }
                        </div>
                        <div className="contact-details">
                            <h3>
                                {isRenter
                                    ? `${booking.owner_first_name} ${booking.owner_last_name}`
                                    : `${booking.renter_first_name} ${booking.renter_last_name}`
                                }
                            </h3>
                            {booking.owner_company && isRenter && (
                                <span className="company">{booking.owner_company}</span>
                            )}
                        </div>
                    </div>
                    <div className="contact-actions">
                        <a href={`mailto:${isRenter ? booking.owner_email : booking.renter_email}`} className="contact-btn">
                            <Mail size={16} /> Email
                        </a>
                        <a href={`tel:${isRenter ? booking.owner_phone : booking.renter_phone}`} className="contact-btn">
                            <Phone size={16} /> Call
                        </a>
                    </div>
                </div>

                {/* Actions */}
                {booking.status === 'pending' && isOwner && (
                    <div className="detail-card actions-card">
                        <h2>Actions Required</h2>
                        <p>Review this booking request and approve or reject it.</p>
                        <div className="action-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleStatusUpdate('approved')}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Loader2 className="spinner" /> : <><CheckCircle size={18} /> Approve</>}
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowRejectModal(true)}
                            >
                                <XCircle size={18} /> Reject
                            </button>
                        </div>
                    </div>
                )}

                {booking.status === 'approved' && isOwner && (
                    <div className="detail-card actions-card">
                        <h2>Start Rental</h2>
                        <p>Mark this booking as active when the equipment is handed over.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => handleStatusUpdate('active')}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="spinner" /> : 'Start Rental'}
                        </button>
                    </div>
                )}

                {booking.status === 'active' && isOwner && (
                    <div className="detail-card actions-card">
                        <h2>Complete Rental</h2>
                        <p>Mark this booking as completed when the equipment is returned.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => handleStatusUpdate('completed')}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="spinner" /> : 'Mark as Completed'}
                        </button>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Reject Booking</h2>
                            <button onClick={() => setShowRejectModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label>Reason for rejection</label>
                                <textarea
                                    className="input"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Explain why you're rejecting this booking..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleStatusUpdate('rejected', rejectReason)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <Loader2 className="spinner" /> : 'Reject Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
