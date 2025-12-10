import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, Mail, Key, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import './ChangePassword.css';

export default function ChangePassword() {
    const navigate = useNavigate();
    const [method, setMethod] = useState('password'); // 'password' or 'otp'
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    // Form fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRequestOTP = async () => {
        setIsLoading(true);
        try {
            await authAPI.requestPasswordChangeOTP();
            toast.success('OTP sent to your registered email');
            setOtpSent(true);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeWithPassword = async (e) => {
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
            await authAPI.changePassword({ currentPassword, newPassword });
            toast.success('Password changed successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeWithOTP = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.changePasswordWithOTP({ otp, newPassword });
            toast.success('Password changed successfully!');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpSent(false);
    };

    const switchMethod = (newMethod) => {
        setMethod(newMethod);
        resetForm();
    };

    return (
        <div className="change-password-page">
            <div className="change-password-container">
                <div className="change-password-card">
                    <div className="change-password-header">
                        <div className="header-icon">
                            <Shield size={48} />
                        </div>
                        <h1>Change Password</h1>
                        <p>Choose your preferred verification method</p>
                    </div>

                    {/* Method Toggle */}
                    <div className="method-toggle">
                        <button
                            type="button"
                            className={`method-btn ${method === 'password' ? 'active' : ''}`}
                            onClick={() => switchMethod('password')}
                        >
                            <Key size={18} />
                            Use Old Password
                        </button>
                        <button
                            type="button"
                            className={`method-btn ${method === 'otp' ? 'active' : ''}`}
                            onClick={() => switchMethod('otp')}
                        >
                            <Mail size={18} />
                            Use OTP
                        </button>
                    </div>

                    {/* Old Password Method */}
                    {method === 'password' && (
                        <form onSubmit={handleChangeWithPassword} className="change-password-form">
                            <div className="input-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
                                    <input
                                        id="currentPassword"
                                        type="password"
                                        className="input"
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
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
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} />
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
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="spinner" />
                                        Changing Password...
                                    </>
                                ) : (
                                    'Change Password'
                                )}
                            </button>
                        </form>
                    )}

                    {/* OTP Method */}
                    {method === 'otp' && (
                        <div className="change-password-form">
                            {!otpSent ? (
                                <div className="otp-request-section">
                                    <p className="otp-info">
                                        We'll send a 6-digit verification code to your registered email address.
                                    </p>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg w-full"
                                        onClick={handleRequestOTP}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="spinner" />
                                                Sending OTP...
                                            </>
                                        ) : (
                                            <>
                                                <Mail size={18} />
                                                Send OTP to Email
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleChangeWithOTP}>
                                    <div className="input-group">
                                        <label htmlFor="otp">Enter OTP</label>
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
                                        <button
                                            type="button"
                                            className="resend-link"
                                            onClick={handleRequestOTP}
                                            disabled={isLoading}
                                        >
                                            Resend OTP
                                        </button>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="newPasswordOtp">New Password</label>
                                        <div className="input-with-icon">
                                            <Lock size={18} />
                                            <input
                                                id="newPasswordOtp"
                                                type="password"
                                                className="input"
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="confirmPasswordOtp">Confirm New Password</label>
                                        <div className="input-with-icon">
                                            <Lock size={18} />
                                            <input
                                                id="confirmPasswordOtp"
                                                type="password"
                                                className="input"
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                                Changing Password...
                                            </>
                                        ) : (
                                            'Change Password'
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    <button
                        className="back-link"
                        onClick={() => navigate('/profile')}
                    >
                        <ArrowLeft size={16} />
                        Back to Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
