import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useEquipmentStore, useAuthStore } from '../store';
import { getImageUrl } from '../services/api';
import {
    Search, ArrowRight, Shield, Clock, MapPin, Star,
    Truck, Users, CheckCircle, ChevronRight
} from 'lucide-react';
import './Home.css';

export default function Home() {
    const { categories, fetchCategories, equipment, fetchEquipment } = useEquipmentStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        fetchCategories();
        fetchEquipment({ limit: 6 });
    }, []);

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-glow" />
                <div className="container">
                    <div className="hero-content">
                        <span className="hero-badge">
                            <Star size={14} /> Pakistan's #1 Equipment Rental Platform
                        </span>
                        <h1 className="hero-title">
                            Rent Construction Equipment
                            <span className="gradient-text"> With Confidence</span>
                        </h1>
                        <p className="hero-subtitle">
                            Find excavators, loaders, cranes, and more from verified owners across Pakistan.
                            Easy booking, reliable equipment, transparent reviews.
                        </p>

                        <div className="hero-search">
                            <div className="search-box">
                                <Search className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search equipment (e.g., Excavator, Loader, Crane...)"
                                    className="search-input"
                                />
                                <select className="search-select">
                                    <option value="">All Cities</option>
                                    <option value="lahore">Lahore</option>
                                    <option value="karachi">Karachi</option>
                                    <option value="islamabad">Islamabad</option>
                                    <option value="rawalpindi">Rawalpindi</option>
                                </select>
                                <Link to="/equipment" className="btn btn-primary btn-lg">
                                    Search
                                </Link>
                            </div>
                        </div>

                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-value">500+</span>
                                <span className="stat-label">Equipment Listed</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat">
                                <span className="stat-value">200+</span>
                                <span className="stat-label">Verified Owners</span>
                            </div>
                            <div className="stat-divider" />
                            <div className="stat">
                                <span className="stat-value">1000+</span>
                                <span className="stat-label">Successful Rentals</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="section categories-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Browse by Category</h2>
                        <Link to="/equipment" className="view-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="categories-grid">
                        {categories.slice(0, 8).map((category) => (
                            <Link
                                key={category.id}
                                to={`/equipment?category=${category.id}`}
                                className="category-card"
                            >
                                <div className="category-icon">{category.icon || '🏗️'}</div>
                                <h3>{category.name}</h3>
                                <span className="category-count">{category.equipment_count || 0} available</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Equipment */}
            <section className="section featured-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Equipment</h2>
                        <Link to="/equipment" className="view-all">
                            View All <ChevronRight size={18} />
                        </Link>
                    </div>

                    <div className="equipment-grid">
                        {equipment.slice(0, 6).map((item) => (
                            <Link key={item.id} to={`/equipment/${item.id}`} className="equipment-card">
                                <div className="equipment-image">
                                    {item.primary_image ? (
                                        <img src={getImageUrl(item.primary_image)} alt={item.title} />
                                    ) : (
                                        <div className="no-image">
                                            <Truck size={40} />
                                        </div>
                                    )}
                                    {item.has_operator && (
                                        <span className="badge badge-primary operator-badge">With Operator</span>
                                    )}
                                </div>
                                <div className="equipment-info">
                                    <h3>{item.title}</h3>
                                    <div className="equipment-meta">
                                        <span className="location">
                                            <MapPin size={14} /> {item.city}
                                        </span>
                                        {item.average_rating > 0 && (
                                            <span className="rating">
                                                <Star size={14} className="star filled" /> {item.average_rating}
                                            </span>
                                        )}
                                    </div>
                                    <div className="equipment-footer">
                                        <div className="price">
                                            <span className="amount">Rs. {item.daily_rate?.toLocaleString()}</span>
                                            <span className="period">/ day</span>
                                        </div>
                                        <span className="view-btn">View Details</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section features-section">
                <div className="container">
                    <div className="section-header centered">
                        <h2>Why Choose EquipRent?</h2>
                        <p>The most trusted platform for construction equipment rental in Pakistan</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Shield size={28} />
                            </div>
                            <h3>Verified Owners</h3>
                            <p>All equipment owners are verified with CNIC and business documentation</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Clock size={28} />
                            </div>
                            <h3>Flexible Duration</h3>
                            <p>Rent hourly, daily, weekly, or monthly based on your project needs</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <MapPin size={28} />
                            </div>
                            <h3>Pan-Pakistan Coverage</h3>
                            <p>Find equipment in major cities across Pakistan with delivery options</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Users size={28} />
                            </div>
                            <h3>Operators Available</h3>
                            <p>Many listings include trained operators for hassle-free operation</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Star size={28} />
                            </div>
                            <h3>Transparent Reviews</h3>
                            <p>Real reviews from real renters to help you make informed decisions</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <CheckCircle size={28} />
                            </div>
                            <h3>Easy Booking</h3>
                            <p>Simple online booking with instant confirmation or owner approval</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2>Have Equipment to Rent?</h2>
                            <p>Join hundreds of owners earning from their idle construction equipment</p>
                            <div className="cta-buttons">
                                <Link to="/register" className="btn btn-accent btn-lg">
                                    List Your Equipment <ArrowRight size={20} />
                                </Link>
                                <Link to="/equipment" className="btn btn-secondary btn-lg">
                                    Browse Equipment
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
