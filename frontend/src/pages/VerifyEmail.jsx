import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Truck, Loader2, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function VerifyEmail() {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', { email, otp });
            toast.success(response.data.message || 'Email verified successfully!');

            // Redirect to CNIC upload or pending page
            navigate('/registration-pending', {
                state: { email, requiresCNIC: response.data.data.requiresCNIC }
            });
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            await api.post('/auth/resend-otp', { email, purpose: 'email_verify' });
            toast.success('OTP resent successfully');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h1>Invalid Access</h1>
                            <p>Please register first to verify your email.</p>
                        </div>
                        <Link to="/register" className="btn btn-primary w-full">
                            Go to Register
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <Truck className="logo-icon" />
                            <span className="logo-text">EquipRent</span>
                        </Link>
                        <div className="verify-icon">
                            <Mail size={48} />
                        </div>
                        <h1>Verify Your Email</h1>
                        <p>We've sent a 6-digit OTP to <strong>{email}</strong></p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label htmlFor="otp">Enter OTP Code</label>
                            <input
                                id="otp"
                                type="text"
                                className="input otp-input"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="spinner" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResendOTP}
                                className="auth-link"
                                disabled={resendLoading}
                            >
                                {resendLoading ? 'Sending...' : 'Resend OTP'}
                            </button>
                        </p>
                    </div>

                    <Link to="/login" className="back-link">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
