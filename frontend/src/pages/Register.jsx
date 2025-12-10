import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'renter',
        companyName: '',
        city: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', formData);
            toast.success(response.data.message || 'Registration initiated! Please verify your email.');

            // Redirect to OTP verification page
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card register-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <Truck className="logo-icon" />
                            <span className="logo-text">EquipRent</span>
                        </Link>
                        <h1>Create Account</h1>
                        <p>Join thousands of users renting equipment</p>
                    </div>

                    <div className="verification-notice">
                        <Shield size={18} />
                        <span>All registrations require email verification and admin approval</span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Role Selection */}
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'renter' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, role: 'renter' })}
                            >
                                <span>🔧</span>
                                I want to rent
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'owner' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, role: 'owner' })}
                            >
                                <span>🏗️</span>
                                I have equipment
                            </button>
                        </div>

                        <div className="form-row">
                            <div className="input-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    className="input"
                                    placeholder="Enter first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    className="input"
                                    placeholder="Enter last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="input"
                                placeholder="+92 300 1234567"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {formData.role === 'owner' && (
                            <>
                                <div className="input-group">
                                    <label htmlFor="companyName">Company Name</label>
                                    <input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        className="input"
                                        placeholder="Your business name"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="city">City *</label>
                                    <select
                                        id="city"
                                        name="city"
                                        className="input"
                                        value={formData.city}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select city</option>
                                        <option value="Lahore">Lahore</option>
                                        <option value="Karachi">Karachi</option>
                                        <option value="Islamabad">Islamabad</option>
                                        <option value="Rawalpindi">Rawalpindi</option>
                                        <option value="Faisalabad">Faisalabad</option>
                                        <option value="Multan">Multan</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className="form-row">
                            <div className="input-group">
                                <label htmlFor="password">Password *</label>
                                <div className="password-input">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="input"
                                        placeholder="Create password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirmPassword">Confirm Password *</label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="input"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="spinner" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
