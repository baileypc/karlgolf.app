// Karl's GIR - Home Page
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { version } from '../../package.json';

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect logged-in users to dashboard
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  const handleStartRound = () => {
    navigate('/track-round');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center mx-auto"
      style={{
        padding: '2rem 1.5rem',
        maxWidth: '100%',
        width: '100vw',
        background: '#000000',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
        <div 
          className="w-full mx-auto" 
          style={{ 
            maxWidth: '500px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}
        >
          {/* Logo and Title */}
          <div className="text-center w-full" style={{ marginBottom: '3.5rem' }}>
            <img
              src="./images/karls_gir.png"
              alt="Karl Golf GIR Logo"
              className="mx-auto block"
              style={{
                width: '130px',
                height: '130px',
                marginBottom: '1.5rem',
                borderRadius: '28px',
                boxShadow: '0 0 30px rgba(0,0,0,0.8)'
              }}
            />
            <h1 className="font-normal" style={{ 
              fontSize: '2.5rem',
              color: '#DDEDD2',
              letterSpacing: '0px',
              marginBottom: '1rem'
            }}>
              Karl Golf GIR
            </h1>
            <p style={{ 
              color: 'rgba(221, 237, 210, 0.9)', 
              fontSize: '1.1rem',
              marginBottom: '0.25rem' 
            }}>
              Track key averages for game improvement.
            </p>
            <p style={{ 
              color: 'rgba(221, 237, 210, 0.6)',
              fontSize: '0.9rem' 
            }}>
              GIR's, fairway's, putting, misses and average scores.
            </p>
          </div>

          {/* Buttons matching the mockup */}
          <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={handleStartRound}
              className="glow-primary-intense"
              style={{
                width: '100%',
                padding: '1.25rem',
                fontSize: '1.4rem',
                fontWeight: '500',
                backgroundColor: '#DDEDD2',
                color: '#000000',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              Start Round
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{ 
                width: '100%',
                padding: '1.25rem',
                fontSize: '1.4rem',
                fontWeight: '400',
                backgroundColor: '#000000',
                color: '#DDEDD2',
                border: '1px solid #5A6A52',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Login / Register
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="w-full text-center"
        style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(221, 237, 210, 0.1)',
          maxWidth: '500px'
        }}
      >
        <p style={{ fontSize: '0.75rem', color: 'rgba(221, 237, 210, 0.4)', marginBottom: '0.25rem' }}>
          Version {version}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(221, 237, 210, 0.4)' }}>
          © {new Date().getFullYear()} Karl Golf GIR. All rights reserved.
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <a href="./privacy.html" style={{ color: 'rgba(221, 237, 210, 0.6)', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
