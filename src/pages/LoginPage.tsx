// Karl's GIR - Login Page
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { roundsAPI } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Check if we should show register form by default
  const [showRegister, setShowRegister] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] = useState(false);

  useEffect(() => {
    // Check URL parameter first
    if (searchParams.get('register') === 'true') {
      setShowRegister(true);
      return;
    }
    
    // Check if we came from home page registration button
    const shouldShowRegister = storage.getItem<boolean>('showRegister');
    if (shouldShowRegister) {
      setShowRegister(true);
      storage.removeItem('showRegister');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
      // State is now guaranteed to be updated - navigate immediately to start round
      navigate('/track-round');
    } catch (error) {
      // Error already shown by toast in useAuth
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerEmail.trim() || !registerPassword || !registerPasswordConfirm) {
      toast.error('Please fill in all fields');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await register({ email: registerEmail.trim(), password: registerPassword });

      // MIGRATE GUEST DATA: Check if user has localStorage round data
      const guestRound = localStorage.getItem('karlsGIR_currentRound');
      if (guestRound) {
        try {
          const roundData = JSON.parse(guestRound);
          if (roundData.holes && roundData.holes.length > 0) {
            // Convert localStorage holes to API format
            const apiHoles = roundData.holes.map((hole: any) => ({
              holeNumber: hole.holeNumber,
              par: hole.par,
              score: hole.score,
              gir: hole.gir,
              putts: hole.putts,
              puttDistances: hole.puttDistances || [],
              fairway: hole.fairway === 'na' ? null : hole.fairway === 'l' ? 'l' : hole.fairway === 'c' ? 'c' : hole.fairway === 'r' ? 'r' : null,
              shotsToGreen: hole.shotsToGreen,
              penalty: null,
            }));

            // Save to new account
            await roundsAPI.saveRound({
              courseName: roundData.courseName,
              holes: apiHoles,
            });
          }
        } catch (migrationError) {
          // Don't block registration if migration fails
          // Error is logged by the API
        }
      }

      // State is now guaranteed to be updated - navigate immediately to start round
      navigate('/track-round');
    } catch (error) {
      // Error already shown by toast in useAuth
    }
  };

  const inputStyle = {
    width: '100%',
    minHeight: '48px',
    padding: '0.75rem 1rem',
    fontSize: 'var(--font-base)',
    color: 'var(--text-primary)',
    backgroundColor: 'transparent',
    border: '2px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    outline: 'none',
    transition: 'all var(--transition-base)'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-primary)',
    fontWeight: '600'
  };

  const passwordWrapperStyle = {
    position: 'relative' as const,
    width: '100%'
  };

  const toggleButtonStyle = {
    position: 'absolute' as const,
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: '2rem',
    height: '2rem'
  };

  return (
    <div className="min-h-screen" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1rem',
      minHeight: '100vh'
    }}>
      <div className="card" style={{ maxWidth: '28rem', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="./images/karls_gir.png"
            alt="Karl Golf GIR Logo"
            style={{ 
              width: '6rem', 
              height: '6rem', 
              margin: '0 auto 1rem auto', 
              borderRadius: 'var(--radius-lg)',
              display: 'block'
            }}
          />
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {showRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
            {showRegister ? 'Sign up to save your rounds' : 'Sign in to continue'}
          </p>
        </div>

        {/* Toggle between Login and Register */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          padding: '0.25rem',
          backgroundColor: 'rgba(221, 237, 210, 0.1)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <button
            onClick={() => setShowRegister(false)}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: 'var(--font-sm)',
              fontWeight: '600',
              color: 'var(--text-primary)',
              backgroundColor: !showRegister ? 'rgba(221, 237, 210, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setShowRegister(true)}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: 'var(--font-sm)',
              fontWeight: '600',
              color: 'var(--text-primary)',
              backgroundColor: showRegister ? 'rgba(221, 237, 210, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {!showRegister && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="loginEmail" style={labelStyle}>Email</label>
              <input
                type="email"
                id="loginEmail"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-interactive)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
              />
            </div>

            <div>
              <label htmlFor="loginPassword" style={labelStyle}>Password</label>
              <div style={passwordWrapperStyle}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="loginPassword"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-interactive)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={toggleButtonStyle}
                  aria-label="Toggle password visibility"
                >
                  <FontAwesomeIcon icon={showLoginPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              style={{
                alignSelf: 'flex-start',
                padding: '0.5rem 0',
                fontSize: 'var(--font-sm)',
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: '-0.5rem'
              }}
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {showRegister && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="registerEmail" style={labelStyle}>Email</label>
              <input
                type="email"
                id="registerEmail"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-interactive)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
              />
            </div>

            <div>
              <label htmlFor="registerPassword" style={labelStyle}>Password</label>
              <div style={passwordWrapperStyle}>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  id="registerPassword"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-interactive)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  style={toggleButtonStyle}
                  aria-label="Toggle password visibility"
                >
                  <FontAwesomeIcon icon={showRegisterPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="registerPasswordConfirm" style={labelStyle}>Confirm Password</label>
              <div style={passwordWrapperStyle}>
                <input
                  type={showRegisterPasswordConfirm ? 'text' : 'password'}
                  id="registerPasswordConfirm"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-interactive)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPasswordConfirm(!showRegisterPasswordConfirm)}
                  style={toggleButtonStyle}
                  aria-label="Toggle password visibility"
                >
                  <FontAwesomeIcon icon={showRegisterPasswordConfirm ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            marginTop: '1.5rem',
            padding: '0.75rem',
            fontSize: 'var(--font-sm)',
            color: 'var(--text-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
