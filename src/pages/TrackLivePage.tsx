// Karl's GIR - Track Live Page
// Marketing-friendly entry point for guest users to try the app without creating an account
import { useNavigate } from 'react-router-dom';
import IconNav from '@/components/IconNav';

export default function TrackLivePage() {
  const navigate = useNavigate();

  const handleStartTracking = () => {
    // Navigate to track round page - it already supports guest mode
    navigate('/track-round');
  };

  return (
    <>
      <IconNav />
      <div className="min-h-screen" style={{ padding: '1rem', paddingTop: '76px' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', marginBottom: '1rem' }}>
              Track Your Round
            </h1>
            <p style={{ fontSize: 'var(--font-lg)', marginBottom: '1.5rem', opacity: 0.9 }}>
              Start tracking your golf round instantly. No account required.
            </p>
            <p style={{ fontSize: 'var(--font-base)', marginBottom: '2rem', opacity: 0.8 }}>
              Your data is saved locally on this device. Create a free account anytime to save your rounds permanently and sync across devices.
            </p>
            
            <button
              onClick={handleStartTracking}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1.125rem',
                marginBottom: '1rem'
              }}
            >
              Start Tracking Round
            </button>

            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              backgroundColor: 'rgba(221, 237, 210, 0.1)', 
              borderRadius: '8px',
              fontSize: 'var(--font-sm)',
              opacity: 0.8
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>What you can track:</strong>
              </p>
              <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>✓ Fairways hit</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Greens in regulation (GIR)</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Putts per hole</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Scrambling percentage</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Penalties and hazards</li>
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  fontSize: '0.875rem'
                }}
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
