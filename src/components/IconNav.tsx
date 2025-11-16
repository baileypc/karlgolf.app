// Karl's GIR - Icon Navigation
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClipboard, faRightFromBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';

export default function IconNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isLoggedIn } = useAuth();

  // Debug logging
  console.log('🔍 IconNav - isLoggedIn:', isLoggedIn);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Logout should always succeed locally even if API fails
      console.error('Logout API call failed, but clearing local state:', error);
    }
    navigate('/');
  };

  const handleCreateAccount = () => {
    navigate('/login?register=true');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Solid black backdrop behind header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#000',
        zIndex: 999
      }} />
      
      {/* Header with semi-transparent mint green */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '2px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        zIndex: 1000
      }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
          >
        <img 
          src="./images/karls_gir.png" 
          alt="Karl Golf GIR" 
          style={{ 
            width: '40px', 
            height: '40px',
            objectFit: 'contain'
          }} 
        />
        <span style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>
          Karl Golf GIR
        </span>
      </div>

      {/* Icon Navigation */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            {/* Dashboard - Logged in users only */}
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive('/dashboard') ? 'var(--text-primary)' : 'rgba(221, 237, 210, 0.5)',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.5rem',
                transition: 'color 0.2s'
              }}
              title="Dashboard (Stats & History)"
            >
              <FontAwesomeIcon icon={faChartLine} />
            </button>
          </>
        ) : (
          <>
            {/* Create Account - Guest users only */}
            <button
              onClick={handleCreateAccount}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(221, 237, 210, 0.5)',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.5rem',
                transition: 'color 0.2s'
              }}
              title="Create Account (Save Your Data)"
            >
              <FontAwesomeIcon icon={faUserPlus} />
            </button>
          </>
        )}

        {/* Track Round - Always visible */}
        <button
          onClick={() => navigate('/track-round')}
          style={{
            background: 'transparent',
            border: 'none',
            color: isActive('/track-round') ? 'var(--text-primary)' : 'rgba(221, 237, 210, 0.5)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.5rem',
            transition: 'color 0.2s'
          }}
          title="Track Round (Record Keeping)"
        >
          <FontAwesomeIcon icon={faClipboard} />
        </button>

        {/* Logout - Logged in users only */}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(221, 237, 210, 0.5)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.5rem',
              transition: 'color 0.2s'
            }}
            title="Logout"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        )}
      </div>
    </nav>
    </>
  );
}
