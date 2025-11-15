// Karl's GIR - Reset Password Page
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { authAPI } from '@/lib/api';
import IconNav from '@/components/IconNav';
import Modal, { useModal } from '@/components/Modal';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [message, setMessage] = useState('');
  const errorModal = useModal();

  // Check for token in URL (from email link)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlEmail = searchParams.get('email');
    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
      setStep('reset');
    }
  }, [searchParams]);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      errorModal.open();
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.forgotPassword(email.trim());
      if (result.success) {
        setMessage('Password reset email sent! Please check your inbox.');
        errorModal.open();
      } else {
        // Check for specific error codes
        const error: any = result;
        if (error?.errorCode === 'ACCOUNT_NOT_FOUND') {
          setMessage('No account found with that email address. Please check your email or create a new account.');
        } else {
          setMessage(result.message || 'Failed to send reset email. Please try again.');
        }
        errorModal.open();
      }
    } catch (error: any) {
      // Check for specific error codes in caught errors
      if (error?.code === 'ACCOUNT_NOT_FOUND') {
        setMessage('No account found with that email address. Please check your email or create a new account.');
      } else {
        setMessage(error?.message || 'An error occurred. Please try again.');
      }
      errorModal.open();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !token.trim()) {
      setMessage('Missing email or token. Please use the link from your email.');
      errorModal.open();
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long');
      errorModal.open();
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      errorModal.open();
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.resetPassword(email.trim(), token.trim(), newPassword);
      if (result.success) {
        setMessage('Password reset successfully! Redirecting to login...');
        errorModal.open();
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(result.message || 'Failed to reset password. The token may have expired.');
        errorModal.open();
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      errorModal.open();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <IconNav />
      <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', paddingTop: '76px' }}>
        <div className="card" style={{ maxWidth: '28rem', width: '100%' }}>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', marginBottom: '1rem' }}>Reset Password</h1>
          
          {step === 'request' ? (
            <>
              <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(221, 237, 210, 0.3)',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: '#DDEDD2',
                    fontSize: '1rem',
                  }}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleRequestReset}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                Enter your new password below.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(221, 237, 210, 0.3)',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: '#DDEDD2',
                    fontSize: '1rem',
                  }}
                  disabled={isLoading}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingRight: '3rem',
                      backgroundColor: 'rgba(221, 237, 210, 0.3)',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '8px',
                      color: '#DDEDD2',
                      fontSize: '1rem',
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingRight: '3rem',
                      backgroundColor: 'rgba(221, 237, 210, 0.3)',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '8px',
                      color: '#DDEDD2',
                      fontSize: '1rem',
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                    }}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleResetPassword}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '1rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error/Success Modal */}
      {errorModal.isOpen && (
        <Modal
          isOpen={errorModal.isOpen}
          onClose={errorModal.close}
          title={message.includes('successfully') ? 'Success' : 'Error'}
          message={message}
          type={message.includes('successfully') ? 'success' : 'warning'}
          confirmText="OK"
          showCancel={false}
        />
      )}
    </>
  );
}
