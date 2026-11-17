import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email, password);

      // Redirect by role
      if (user.role === 'admin') {
        navigate('/admin/appointments');
      } else if (user.role === 'doctor') {
        navigate('/doctor/appointments');
      } else {
        navigate('/doctors');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper for presentation demonstration
  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="card">
        <div className="auth-header">
          <h1>Welcome to Docbook</h1>
          <p>Sign in to access your clinic portal</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="e.g. rahul@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have a patient account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
        </p>

        {/* Presentation Demo Fill Box */}
        <div className="demo-credentials-box">
          <h4>Presentation Quick Logins:</h4>
          <div className="demo-btn-group">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickFill('rohan.admin@gmail.com', 'password123')}
            >
              Admin (Rohan)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickFill('dishti7@gmail.com', 'password123')}
            >
              Dr. Dishti (Cardiology)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickFill('gunjan8@gmail.com', 'password123')}
            >
              Dr. Gunjan (Dermatology)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleQuickFill('rahul.patient@gmail.com', 'password123')}
            >
              Patient (Rahul)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
