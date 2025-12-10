import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Truck, Upload, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function RegistrationPending() {
    const [cnicFront, setCnicFront] = useState(null);
    const [cnicBack, setCnicBack] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const frontInputRef = useRef();
    const backInputRef = useRef();
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || '';
    const requiresCNIC = location.state?.requiresCNIC !== false;

    const handleUpload = async () => {
        if (!cnicFront || !cnicBack) {
            toast.error('Please upload both front and back of your CNIC');
            return;
        }

        if (!email) {
            toast.error('Email not found. Please go back and register again.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('email', email);
        formData.append('cnicFront', cnicFront);
        formData.append('cnicBack', cnicBack);

        try {
            // Use public endpoint that doesn't require authentication
            await api.post('/auth/upload-cnic-public', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('CNIC uploaded successfully!');
            setUploaded(true);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card pending-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <Truck className="logo-icon" />
                            <span className="logo-text">EquipRent</span>
                        </Link>

                        {uploaded ? (
                            <>
                                <div className="pending-icon success">
                                    <CheckCircle size={64} />
                                </div>
                                <h1>Verification Submitted!</h1>
                                <p>Your CNIC has been uploaded. Our admin team will review your registration within 24-48 hours.</p>
                            </>
                        ) : requiresCNIC ? (
                            <>
                                <div className="pending-icon">
                                    <Upload size={64} />
                                </div>
                                <h1>Upload CNIC Verification</h1>
                                <p>To complete your registration, please upload clear photos of your CNIC (front and back).</p>
                            </>
                        ) : (
                            <>
                                <div className="pending-icon">
                                    <Clock size={64} />
                                </div>
                                <h1>Registration Pending</h1>
                                <p>Your account is pending admin approval. You'll receive an email once approved.</p>
                            </>
                        )}
                    </div>

                    {requiresCNIC && !uploaded && (
                        <div className="cnic-upload-section">
                            <div className="cnic-upload-grid">
                                <div className="cnic-upload-box">
                                    <input
                                        ref={frontInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setCnicFront(e.target.files[0])}
                                        hidden
                                    />
                                    <div
                                        className={`upload-area ${cnicFront ? 'has-file' : ''}`}
                                        onClick={() => frontInputRef.current.click()}
                                    >
                                        {cnicFront ? (
                                            <>
                                                <CheckCircle className="upload-check" />
                                                <span>{cnicFront.name}</span>
                                                <button
                                                    className="remove-file"
                                                    onClick={(e) => { e.stopPropagation(); setCnicFront(null); }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={32} />
                                                <span>CNIC Front</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="cnic-upload-box">
                                    <input
                                        ref={backInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setCnicBack(e.target.files[0])}
                                        hidden
                                    />
                                    <div
                                        className={`upload-area ${cnicBack ? 'has-file' : ''}`}
                                        onClick={() => backInputRef.current.click()}
                                    >
                                        {cnicBack ? (
                                            <>
                                                <CheckCircle className="upload-check" />
                                                <span>{cnicBack.name}</span>
                                                <button
                                                    className="remove-file"
                                                    onClick={(e) => { e.stopPropagation(); setCnicBack(null); }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={32} />
                                                <span>CNIC Back</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary btn-lg w-full"
                                onClick={handleUpload}
                                disabled={!cnicFront || !cnicBack || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Submit for Verification'}
                            </button>
                        </div>
                    )}

                    <div className="pending-info">
                        <h3>What's Next?</h3>
                        <ul>
                            <li>✓ Email verified</li>
                            <li>{uploaded ? '✓' : '○'} CNIC verification submitted</li>
                            <li>○ Admin approval (24-48 hours)</li>
                            <li>○ Start {email.includes('owner') ? 'listing equipment' : 'renting equipment'}!</li>
                        </ul>
                    </div>

                    <Link to="/login" className="btn btn-outline w-full mt-4">
                        Go to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
