import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AlertBanner from '../../components/ui/AlertBanner';
import { Film } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      toast.success(`Welcome to IMovies, ${user.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-75">
      <div className="im-glass p-4 p-md-5 rounded-4 shadow-lg w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <Film size={36} color="var(--primary-color)" />
            <span className="fw-bold fs-3 text-light">IMOVIES</span>
          </Link>
          <h4 className="fw-bold m-0">Create Your Account</h4>
          <p className="text-secondary small mt-1">Join thousands of cinema lovers across India</p>
        </div>

        {error && (
          <div className="mb-3">
            <AlertBanner type="danger" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="tel"
            label="Phone Number (Optional)"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-100 mt-2">
            Create Account
          </Button>
        </form>

        <div className="text-center mt-4 text-secondary small">
          Already have an account?{' '}
          <Link to="/login" className="text-danger fw-semibold text-decoration-none">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
