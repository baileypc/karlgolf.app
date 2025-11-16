// Karl's GIR - Home Page
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

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
    // Go to track round page - works for both guest and logged-in users
    navigate('/track-round');
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center mx-auto"
      style={{ 
        padding: 'var(--space-xl) var(--space-md)',
        maxWidth: '600px'
      }}
    >
      {/* Logo and Title */}
      <div className="text-center mb-xl">
        <img
          src="./images/karls_gir.png"
          alt="Karl Golf GIR Logo"
          className="mx-auto block"
          style={{ 
            width: '10rem', 
            height: '10rem', 
            marginBottom: 'var(--space-xl)',
            borderRadius: 'var(--radius-lg)'
          }}
        />
        <h1 className="font-bold" style={{ fontSize: 'var(--font-4xl)', marginBottom: 'var(--space-md)' }}>
          Karl Golf GIR
        </h1>
        <div
          className="mx-auto"
          style={{
            borderBottom: '2px solid var(--border-primary)',
            width: '80px',
            marginBottom: 'var(--space-md)'
          }}
        />
        <p className="text-lg opacity-90" style={{ marginBottom: 'var(--space-sm)' }}>
          Track key averages for game improvement.
        </p>
        <p className="opacity-70">
          GIR's, fairway's, putting, misses and average scores.
        </p>
      </div>

      {/* Main Call to Action */}
      <div className="w-full mb-lg">
        <button
          onClick={handleStartRound}
          className="btn btn-primary w-full"
          style={{
            padding: 'var(--space-lg) var(--space-xl)',
            fontSize: 'var(--font-2xl)',
            fontWeight: 'bold',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>Start Round</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>
            Start now. Create account later.
          </span>
        </button>
      </div>

      {/* Secondary Action - Login */}
      <div className="text-center mb-xl">
        <button
          onClick={() => navigate('/login')}
          className="btn btn-secondary"
          style={{ minWidth: '200px' }}
        >
          Login / Register
        </button>
      </div>

      {/* Footer */}
      <div 
        className="w-full text-center"
        style={{ 
          marginTop: 'auto',
          paddingTop: 'var(--space-lg)',
          borderTop: '1px solid var(--border-primary)'
        }}
      >
        <p className="text-sm" style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: 'var(--space-xs)' }}>
          Version 3.1.0
        </p>
        <p className="text-sm" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
          © 2025 Karl Golf GIR. All rights reserved.
        </p>
      </div>
    </div>
  );
}
