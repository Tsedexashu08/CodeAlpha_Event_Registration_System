import React, { useState, useEffect } from 'react';
import '../styles/Login.css'; // We'll create this CSS file

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  useEffect(() => {
    checkAuthStatus();
  }, []);

const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (token) {
    setAlert({ message: 'You are already logged in. Redirecting ...', type: 'info' });
    
    let user = null;
    if (userString) {
      try {
        user = JSON.parse(userString);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
    }
    
    setTimeout(() => {
      if (user && user.role === "admin") {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/';
      }
    }, 2000);
  }
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

    // Email validation on blur
    if (id === 'email' && value) {
      validateEmail(value);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

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

    const loginData = {
      email: formData.email.trim(),
      password: formData.password
    };

    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({ message: 'Login successful! Redirecting to dashboard...', type: 'success' });
        
        // Store token and user data
        if (data.data && data.data.session) {
          localStorage.setItem('token', data.data.session.access_token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          
          // Store remember me preference
          if (formData.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
        }
        setTimeout(() => {
         localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role === "admin" ? window.location.href = '/dashboard' : window.location.href = '/events';
        }, 1500);
      } else {
        setAlert({ message: data.error || 'Login failed. Please check your credentials.', type: 'error' });
        
        // Specific error handling
        if (data.error && data.error.includes('Invalid credentials')) {
          setFormErrors(prev => ({ 
            ...prev, 
            password: 'Invalid email or password. Please try again.' 
          }));
        } else if (data.error && data.error.includes('User not found')) {
          setFormErrors(prev => ({ 
            ...prev, 
            email: 'No account found with this email.' 
          }));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
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
    if (formErrors[field]) {
      return 'input-error';
    }
    if (field === 'email' && formData.email && !formErrors.email) {
      return 'input-success';
    }
    return '';
  };


  return (
    <div className="login-page">
  
      <header>
        <div className="container">
          <nav className="navbar">
            <a href="/" className="logo">
              <i className="fas fa-calendar-alt"></i>
              CodeAlpha EventHub
            </a>
            <a href="/signup" className="cta-button">
              <i className="fas fa-user-plus"></i> Sign Up
            </a>
          </nav>
        </div>
      </header>


      <section className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your EventHub account</p>
          </div>

  
          {alert.message && (
            <div className={`alert alert-${alert.type}`}>
              <i className={`fas fa-${getAlertIcon(alert.type)}`}></i>
              <span>{alert.message}</span>
            </div>
          )}
          <div className="divider">
            <span>Or sign in with email</span>
          </div>

          <form id="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
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
                <div className="form-error">
                  <i className="fas fa-times-circle"></i>
                  <span>{formErrors.email}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label className="form-label" htmlFor="password">Password</label>
              </div>
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input ${getInputClass('password')}`}
                  placeholder="Enter your password"
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
                <div className="form-error">
                  <i className="fas fa-times-circle"></i>
                  <span>{formErrors.password}</span>
                </div>
              )}
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>New to EventHub?</span>
          </div>

          <div className="signup-link">
            <p>Don't have an account? <a href="/signup">Create one now</a></p>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Signing you in...</div>
        </div>
      )}
    </div>
  );
}

export default Login;