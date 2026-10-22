import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AlertBanner from '../../components/ui/AlertBanner';
import { Film, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setInfo(res.data.message || 'A 6-digit verification OTP has been dispatched.');
      if (res.data.otp || res.data.resetToken) {
        setResetToken(res.data.otp || res.data.resetToken);
      }
      setStep(2);
      toast.success(res.data.otp ? `OTP Sent! Verification code: ${res.data.otp}` : 'OTP Sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', {
        otp: resetToken,
        token: resetToken,
        newPassword,
      });
      toast.success('Password successfully reset! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-75">
      <div className="im-glass p-4 p-md-5 rounded-4 shadow-lg w-100" style={{ maxWidth: '460px' }}>
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <Film size={36} color="var(--primary-color)" />
            <span className="fw-bold fs-3 text-light">IMOVIES</span>
          </Link>
          <h4 className="fw-bold m-0">Reset Your Password</h4>
          <p className="text-secondary small mt-1">
            {step === 1
              ? 'Enter your registered email to receive a password recovery token'
              : 'Enter your reset token and your new password'}
          </p>
        </div>

        {error && (
          <div className="mb-3">
            <AlertBanner type="danger" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {info && (
          <div className="mb-3">
            <AlertBanner type="info" message={info} />
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="d-flex flex-column gap-3">
            <Input
              type="email"
              label="Registered Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-100 mt-2">
              Send 6-Digit Verification OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="d-flex flex-column gap-3">
            <Input
              label="6-Digit Verification OTP"
              placeholder="Enter 6-digit OTP"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              required
              autoFocus
            />

            <Input
              type="password"
              label="New Password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-100 mt-2">
              Set New Password
            </Button>
          </form>
        )}

        <div className="text-center mt-4 text-secondary small">
          Remember your password?{' '}
          <Link to="/login" className="text-danger fw-semibold text-decoration-none">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
