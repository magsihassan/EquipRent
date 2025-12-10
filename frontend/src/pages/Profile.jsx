import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { User, Mail, Phone, MapPin, Building, Save, Loader2, Shield, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
    const { user, updateProfile } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        companyName: user?.companyName || '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        postalCode: user?.postalCode || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateProfile(formData);
        setLoading(false);

        if (result.success) {
            toast.success('Profile updated');
            setIsEditing(false);
        } else {
            toast.error(result.error || 'Failed to update profile');
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" />
                    ) : (
                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                    )}
                </div>
                <div className="profile-info">
                    <h1>{user?.firstName} {user?.lastName}</h1>
                    <span className="role-badge">{user?.role}</span>
                    {user?.isVerified && (
                        <span className="verified-badge">✓ Verified</span>
                    )}
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="card-header">
                        <h2>Personal Information</h2>
                        {!isEditing && (
                            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-grid">
                            <div className="input-group">
                                <label>First Name</label>
                                <div className="input-with-icon">
                                    <User size={18} />
                                    <input
                                        name="firstName"
                                        className="input"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Last Name</label>
                                <div className="input-with-icon">
                                    <User size={18} />
                                    <input
                                        name="lastName"
                                        className="input"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <input
                                        className="input"
                                        value={user?.email}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Phone</label>
                                <div className="input-with-icon">
                                    <Phone size={18} />
                                    <input
                                        name="phone"
                                        className="input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        placeholder="+92 300 1234567"
                                    />
                                </div>
                            </div>

                            {user?.role === 'owner' && (
                                <div className="input-group full-width">
                                    <label>Company Name</label>
                                    <div className="input-with-icon">
                                        <Building size={18} />
                                        <input
                                            name="companyName"
                                            className="input"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="input-group full-width">
                                <label>Address</label>
                                <div className="input-with-icon">
                                    <MapPin size={18} />
                                    <input
                                        name="address"
                                        className="input"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>City</label>
                                <select
                                    name="city"
                                    className="input"
                                    value={formData.city}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select city</option>
                                    <option value="Lahore">Lahore</option>
                                    <option value="Karachi">Karachi</option>
                                    <option value="Islamabad">Islamabad</option>
                                    <option value="Rawalpindi">Rawalpindi</option>
                                    <option value="Faisalabad">Faisalabad</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Postal Code</label>
                                <input
                                    name="postalCode"
                                    className="input"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="form-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? <Loader2 className="spinner" /> : <><Save size={18} /> Save Changes</>}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Security Section */}
                <div className="profile-card security-card">
                    <div className="card-header">
                        <h2>Security</h2>
                    </div>
                    <div className="security-content">
                        <Link to="/change-password" className="security-item">
                            <div className="security-item-icon">
                                <Shield size={20} />
                            </div>
                            <div className="security-item-info">
                                <h3>Change Password</h3>
                                <p>Update your password using OTP or current password</p>
                            </div>
                            <ChevronRight size={20} className="security-item-arrow" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
