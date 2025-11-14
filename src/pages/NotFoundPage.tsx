import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSearch } from '@fortawesome/free-solid-svg-icons';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        {/* 404 Icon */}
        <div style={{
          fontSize: '6rem',
          marginBottom: '1rem'
        }}>
          <FontAwesomeIcon 
            icon={faSearch} 
            style={{ color: 'var(--color-secondary)' }}
          />
        </div>

        {/* 404 Text */}
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: 'var(--color-text)',
          marginBottom: '1rem',
          lineHeight: 1
        }}>
          404
        </h1>

        {/* Message */}
        <h2 style={{
          fontSize: '1.5rem',
          color: 'var(--color-text)',
          marginBottom: '1rem'
        }}>
          Page Not Found
        </h2>

        <p style={{
          color: 'var(--color-secondary)',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-interactive)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--color-interactive-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--color-interactive)';
            }}
          >
            <FontAwesomeIcon icon={faHome} />
            Go Home
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: 'var(--color-interactive)',
              border: '2px solid var(--color-interactive)',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--color-interactive)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-interactive)';
            }}
          >
            Go Back
          </button>
        </div>

        {/* Golf emoji decoration */}
        <div style={{
          marginTop: '3rem',
          fontSize: '2rem',
          opacity: 0.5
        }}>
          🏌️‍♂️⛳
        </div>
      </div>
    </div>
  );
}

