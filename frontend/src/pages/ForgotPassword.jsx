import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Truck, Loader2, ArrowLeft, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const passedEmail = location.state?.email || '';

    const [email, setEmail] = useState(passedEmail);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(passedEmail ? 1 : 0); // 0: no email (redirect), 1: confirm email, 2: otp+password
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // If no email was passed from login page, show error and redirect
        if (!passedEmail) {
            toast.error('Please enter your email on the login page first');
            navigate('/login');
        }
    }, [passedEmail, navigate]);

    const handleRequestOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Email is required');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('OTP sent to your email');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Password reset failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render if no email (will redirect)
    if (!passedEmail) {
        return null;
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
                            <Lock size={48} />
                        </div>
                        <h1>Reset Password</h1>
                        <p>
                            {step === 1 && 'Confirm your email to receive a password reset OTP'}
                            {step === 2 && 'Enter the OTP sent to your email and new password'}
                        </p>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="auth-form">
                            <div className="input-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="email-display">
                                    <Mail size={18} />
                                    <input
                                        id="email"
                                        type="email"
                                        className="input"
                                        value={email}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <p className="input-hint">
                                    OTP will be sent to this email address
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="spinner" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="input-group">
                                <label>Email</label>
                                <div className="email-display locked">
                                    <Mail size={18} />
                                    <span>{email}</span>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="otp">OTP Code</label>
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

                            <div className="input-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    className="input"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className="input"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    <Link to="/login" className="back-link">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

