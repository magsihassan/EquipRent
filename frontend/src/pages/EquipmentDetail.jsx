import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEquipmentStore, useAuthStore, useBookingStore } from '../store';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
    MapPin, Star, Calendar, Clock, User, Phone, Mail, Truck, Shield,
    ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import './EquipmentDetail.css';

const API_URL = 'http://localhost:5000';

export default function EquipmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentEquipment, isLoading, fetchEquipmentById, clearCurrentEquipment } = useEquipmentStore();
    const { isAuthenticated, user } = useAuthStore();
    const { createBooking } = useBookingStore();

    const [selectedImage, setSelectedImage] = useState(0);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        durationType: 'daily',
        includeOperator: false,
        includeTransportation: false,
        deliveryAddress: '',
        renterNotes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEquipmentById(id);
        return () => clearCurrentEquipment();
    }, [id]);

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error('Please login to book equipment');
            navigate('/login');
            return;
        }

        setSubmitting(true);
        const result = await createBooking({
            equipmentId: id,
            ...bookingData
        });

        setSubmitting(false);

        if (result.success) {
            toast.success('Booking request submitted!');
            setShowBookingModal(false);
            navigate('/bookings');
        } else {
            toast.error(result.error || 'Failed to create booking');
        }
    };

    if (isLoading || !currentEquipment) {
        return (
            <div className="loading-state">
                <Loader2 className="spinner" size={40} />
                <p>Loading equipment details...</p>
            </div>
        );
    }

    const equipment = currentEquipment;
    const images = equipment.images || [];
    const reviews = equipment.reviews || [];

    return (
        <div className="equipment-detail-page">
            <div className="container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <Link to="/equipment">Equipment</Link>
                    <ChevronRight size={16} />
                    <span>{equipment.title}</span>
                </nav>

                <div className="detail-layout">
                    {/* Left Column - Images & Info */}
                    <div className="detail-main">
                        {/* Image Gallery */}
                        <div className="image-gallery">
                            <div className="main-image">
                                {images.length > 0 ? (
                                    <img src={`${API_URL}${images[selectedImage]?.image_url}`} alt={equipment.title} />
                                ) : (
                                    <div className="no-image">
                                        <Truck size={60} />
                                    </div>
                                )}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            className="gallery-nav prev"
                                            onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                                            disabled={selectedImage === 0}
                                        >
                                            <ChevronLeft />
                                        </button>
                                        <button
                                            className="gallery-nav next"
                                            onClick={() => setSelectedImage(Math.min(images.length - 1, selectedImage + 1))}
                                            disabled={selectedImage === images.length - 1}
                                        >
                                            <ChevronRight />
                                        </button>
                                    </>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="thumbnail-row">
                                    {images.map((img, i) => (
                                        <button
                                            key={img.id}
                                            className={`thumbnail ${i === selectedImage ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(i)}
                                        >
                                            <img src={`${API_URL}${img.image_url}`} alt={`View ${i + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Equipment Details */}
                        <div className="detail-section">
                            <h2>Description</h2>
                            <p>{equipment.description || 'No description provided.'}</p>
                        </div>

                        {/* Specifications */}
                        {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
                            <div className="detail-section">
                                <h2>Specifications</h2>
                                <div className="specs-grid">
                                    {Object.entries(equipment.specifications).map(([key, value]) => (
                                        <div key={key} className="spec-item">
                                            <span className="spec-label">{key}</span>
                                            <span className="spec-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Features */}
                        <div className="detail-section">
                            <h2>Features</h2>
                            <div className="features-list">
                                <div className={`feature-item ${equipment.has_operator ? 'available' : ''}`}>
                                    {equipment.has_operator ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    Operator Available
                                </div>
                                <div className={`feature-item ${equipment.has_transportation ? 'available' : ''}`}>
                                    {equipment.has_transportation ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    Transportation Service
                                </div>
                                <div className={`feature-item ${equipment.auto_approve_bookings ? 'available' : ''}`}>
                                    {equipment.auto_approve_bookings ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                    Instant Booking
                                </div>
                            </div>
                        </div>

                        {/* Reviews */}
                        <div className="detail-section">
                            <h2>Reviews ({reviews.length})</h2>
                            {reviews.length > 0 ? (
                                <div className="reviews-list">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="review-card">
                                            <div className="review-header">
                                                <div className="reviewer-info">
                                                    <div className="avatar">
                                                        {review.first_name?.[0]}{review.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <span className="reviewer-name">
                                                            {review.first_name} {review.last_name}
                                                        </span>
                                                        <div className="rating">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={14}
                                                                    className={`star ${i < review.rating ? 'filled' : ''}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="review-date">
                                                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            {review.title && <h4>{review.title}</h4>}
                                            <p>{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-reviews">No reviews yet</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Booking Card */}
                    <div className="detail-sidebar">
                        <div className="booking-card">
                            <div className="price-display">
                                <span className="daily-rate">Rs. {equipment.daily_rate?.toLocaleString()}</span>
                                <span className="period">/ day</span>
                            </div>

                            {equipment.weekly_rate && (
                                <div className="alt-rates">
                                    <span>Rs. {equipment.weekly_rate?.toLocaleString()} / week</span>
                                    {equipment.hourly_rate && (
                                        <span>Rs. {equipment.hourly_rate?.toLocaleString()} / hour</span>
                                    )}
                                </div>
                            )}

                            <div className="rating-display">
                                <Star size={18} className="star filled" />
                                <span>{equipment.average_rating || 0}</span>
                                <span className="review-count">({reviews.length} reviews)</span>
                            </div>

                            <button
                                className="btn btn-primary btn-lg w-full"
                                onClick={() => setShowBookingModal(true)}
                                disabled={!equipment.is_available || equipment.owner_id === user?.id}
                            >
                                {equipment.owner_id === user?.id ? 'Your Equipment' :
                                    equipment.is_available ? 'Request to Book' : 'Not Available'}
                            </button>

                            <div className="location-info">
                                <MapPin size={18} />
                                <span>{equipment.city}, {equipment.address || 'Pakistan'}</span>
                            </div>
                        </div>

                        {/* Owner Card */}
                        <div className="owner-card">
                            <h3>Equipment Owner</h3>
                            <div className="owner-info">
                                <div className="avatar avatar-lg">
                                    {equipment.owner_first_name?.[0]}{equipment.owner_last_name?.[0]}
                                </div>
                                <div className="owner-details">
                                    <span className="owner-name">
                                        {equipment.owner_first_name} {equipment.owner_last_name}
                                    </span>
                                    {equipment.owner_company && (
                                        <span className="owner-company">{equipment.owner_company}</span>
                                    )}
                                    {equipment.owner_verified && (
                                        <span className="verified-badge">
                                            <Shield size={14} /> Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Book Equipment</h2>
                            <button onClick={() => setShowBookingModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleBookingSubmit} className="modal-body">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={bookingData.startDate}
                                        onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                        min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={bookingData.endDate}
                                        onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                                        min={bookingData.startDate}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Duration Type</label>
                                <select
                                    className="input"
                                    value={bookingData.durationType}
                                    onChange={(e) => setBookingData({ ...bookingData, durationType: e.target.value })}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            {equipment.has_operator && (
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={bookingData.includeOperator}
                                        onChange={(e) => setBookingData({ ...bookingData, includeOperator: e.target.checked })}
                                    />
                                    Include Operator (+Rs. {equipment.operator_rate_per_day?.toLocaleString()}/day)
                                </label>
                            )}

                            {equipment.has_transportation && (
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={bookingData.includeTransportation}
                                        onChange={(e) => setBookingData({ ...bookingData, includeTransportation: e.target.checked })}
                                    />
                                    Request Transportation
                                </label>
                            )}

                            {bookingData.includeTransportation && (
                                <div className="input-group">
                                    <label>Delivery Address</label>
                                    <textarea
                                        className="input"
                                        value={bookingData.deliveryAddress}
                                        onChange={(e) => setBookingData({ ...bookingData, deliveryAddress: e.target.value })}
                                        placeholder="Enter delivery location"
                                        rows={2}
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label>Notes for Owner (optional)</label>
                                <textarea
                                    className="input"
                                    value={bookingData.renterNotes}
                                    onChange={(e) => setBookingData({ ...bookingData, renterNotes: e.target.value })}
                                    placeholder="Any special requirements..."
                                    rows={3}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <Loader2 className="spinner" /> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
