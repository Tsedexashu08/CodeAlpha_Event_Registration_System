import React, { useState, useEffect } from 'react';
import '../styles/Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    terms: false
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ text: '', isStrong: false });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const API_BASE_URL = 'http://localhost:5000/';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    // const token = localStorage.getItem('token');
    // if (token) {
    //   setAlert({ message: 'You are already logged in. Redirecting to dashboard...', type: 'info' });
    //   setTimeout(() => {
    //     window.location.href = '/dashboard';
    //   }, 2000);
    // }
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (formErrors[id]) {
      setFormErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }

    // Password strength validation
    if (id === 'password') {
      validatePasswordStrength(value);
    }

    // Confirm password validation
    if (id === 'confirmPassword') {
      validateConfirmPassword(value);
    }

    // Email validation
    if (id === 'email') {
      validateEmail(value);
    }
  };

  const validatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength({ text: '', isStrong: false });
      return;
    }

    let strength = 0;
    let messages = [];

    if (password.length >= 8) strength++;
    else messages.push('At least 8 characters');

    if (/[A-Z]/.test(password)) strength++;
    else messages.push('One uppercase letter');

    if (/[a-z]/.test(password)) strength++;
    else messages.push('One lowercase letter');

    if (/[0-9]/.test(password)) strength++;
    else messages.push('One number');

    if (/[^A-Za-z0-9]/.test(password)) strength++;
    else messages.push('One special character');

    if (strength >= 4) {
      setPasswordStrength({ text: 'Strong password', isStrong: true });
    } else if (strength >= 3) {
      setPasswordStrength({ text: `Medium strength (${messages.join(', ')})`, isStrong: false });
    } else {
      setPasswordStrength({ text: `Weak password (${messages.join(', ')})`, isStrong: false });
    }
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
      return;
    }

    if (formData.password !== confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setFormErrors(prev => ({ ...prev, confirmPassword: 'Passwords match' }));
    }
  };

  const validateEmail = (email) => {
    if (!email) {
      setFormErrors(prev => ({ ...prev, email: '' }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setFormErrors(prev => ({ ...prev, email: 'Valid email format' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Terms validation
    if (!formData.terms) {
      errors.terms = 'You must agree to the terms and conditions';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setAlert({ message: '', type: '' });

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      phone: formData.phone.trim() || null
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({ message: 'Account created successfully! Redirecting to dashboard...', type: 'success' });
        
        if (data.data && data.data.token) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        // setTimeout(() => {
        //   window.location.href = '/';
        // }, 2000);
      } else {
        setAlert({ message: data.error || 'Registration failed. Please try again.', type: 'error' });
        
        if (data.error && data.error.includes('already exists')) {
          setFormErrors(prev => ({ ...prev, email: data.error }));
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAlert({ message: 'Network error. Please check your connection and try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'info': return 'info-circle';
      default: return 'exclamation-circle';
    }
  };

  const getInputClass = (field) => {
    if (formErrors[field] && formErrors[field].includes('match') && formErrors[field].includes('Passwords match')) {
      return 'input-success';
    }
    if (formErrors[field] && !formErrors[field].includes('match')) {
      return 'input-error';
    }
    if (field === 'email' && formData.email && !formErrors.email) {
      return 'input-success';
    }
    return '';
  };

  const getErrorMessageClass = (field) => {
    if (formErrors[field] && formErrors[field].includes('match') && formErrors[field].includes('Passwords match')) {
      return 'form-success';
    }
    if (field === 'email' && formData.email && !formErrors.email.includes('valid')) {
      return 'form-success';
    }
    return 'form-error';
  };

  const getIconClass = (field) => {
    if (formErrors[field] && formErrors[field].includes('match') && formErrors[field].includes('Passwords match')) {
      return 'fas fa-check-circle';
    }
    if (getErrorMessageClass(field) === 'form-success') {
      return 'fas fa-check-circle';
    }
    return 'fas fa-times-circle';
  };

  return (
    <div className="signup-page">
      {/* Header */}
      <header>
        <div className="container">
          <nav className="navbar">
            <a href="/" className="logo">
              <i className="fas fa-calendar-alt"></i>
              CodeAlpha EventHub
            </a>
            <a href="/login" className="cta-button">
              <i className="fas fa-sign-in-alt"></i> Login
            </a>
          </nav>
        </div>
      </header>

      {/* Signup Form */}
      <section className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <h1>Create Account</h1>
            <p>Join EventHub to register for amazing events</p>
          </div>

          {/* Alert Messages */}
          {alert.message && (
            <div className={`alert alert-${alert.type}`}>
              <i className={`fas fa-${getAlertIcon(alert.type)}`}></i>
              <span>{alert.message}</span>
            </div>
          )}

          <form id="signup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                className={`form-input ${getInputClass('name')}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {formErrors.name && (
                <div className={`form-error ${getErrorMessageClass('name')}`}>
                  <i className={getIconClass('name')}></i>
                  <span>{formErrors.name}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                className={`form-input ${getInputClass('email')}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {formErrors.email && (
                <div className={`form-error ${getErrorMessageClass('email')}`}>
                  <i className={getIconClass('email')}></i>
                  <span>{formErrors.email}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                className={`form-input ${getInputClass('phone')}`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {formErrors.phone && (
                <div className={`form-error ${getErrorMessageClass('phone')}`}>
                  <i className={getIconClass('phone')}></i>
                  <span>{formErrors.phone}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password *</label>
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input ${getInputClass('password')}`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {formErrors.password && (
                <div className={`form-error ${getErrorMessageClass('password')}`}>
                  <i className={getIconClass('password')}></i>
                  <span>{formErrors.password}</span>
                </div>
              )}
              {passwordStrength.text && (
                <div className={`${passwordStrength.isStrong ? 'form-success' : 'form-error'}`}>
                  <i className={`fas fa-${passwordStrength.isStrong ? 'check-circle' : 'exclamation-circle'}`}></i>
                  <span>{passwordStrength.text}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
              <div className="password-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`form-input ${getInputClass('confirmPassword')}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`fas fa-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {formErrors.confirmPassword && (
                <div className={`form-error ${getErrorMessageClass('confirmPassword')}`}>
                  <i className={getIconClass('confirmPassword')}></i>
                  <span>{formErrors.confirmPassword}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="role">Account Type</label>
              <select
                id="role"
                className={`form-select ${getInputClass('role')}`}
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">Event Attendee</option>
                <option value="organizer">Event Organizer</option>
              </select>
              <div className="form-success" id="role-hint">
                <i className="fas fa-info-circle"></i>
                <span>Organizers can create and manage events</span>
              </div>
            </div>

            <div className="terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms}
                onChange={handleInputChange}
                required
              />
              <label htmlFor="terms">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> *
              </label>
            </div>
            {formErrors.terms && (
              <div className={`form-error ${getErrorMessageClass('terms')}`}>
                <i className={getIconClass('terms')}></i>
                <span>{formErrors.terms}</span>
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>Already have an account?</span>
          </div>

          <div className="login-link">
            <p>Sign in to your existing account <a href="/login">here</a></p>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Creating your account...</div>
        </div>
      )}
    </div>
  );
}

export default Signup;