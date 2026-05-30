// Karl's GIR - Bottom Navigation
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClipboard, faRightFromBracket, faUser, faUserPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';

interface IconNavProps {
  onDiscard?: () => void;
}

export default function IconNav({ onDiscard }: IconNavProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isLoggedIn } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout API call failed, but clearing local state:', error);
    }
    navigate('/');
  };

  const handleCreateAccount = () => {
    navigate('/login?register=true');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-bottom-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      zIndex: 1000
    }}>
      {/* Logo acting as Home (Dashboard) */}
      <div 
        onClick={() => navigate('/dashboard')}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center',
          opacity: 1,
          transition: 'all 0.2s ease',
          filter: isActive('/dashboard') ? 'drop-shadow(0 0 8px rgba(221, 237, 210, 0.5))' : 'none'
        }}
      >
        <img
          src="./images/karls_gir.png"
          alt="Home"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            boxShadow: isActive('/dashboard') ? '0 0 15px rgba(0,0,0,0.8)' : '0 0 10px rgba(0,0,0,0.6)'
          }}
        />
      </div>

      {/* Right side navigation items (Original Functionality restored) */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {isLoggedIn ? (
          <>
            {onDiscard && (
              <button
                onClick={onDiscard}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                  color: '#e6c280', fontSize: '1.25rem', transition: 'color 0.2s'
                }}
                title="Discard Round"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}

            <button
              onClick={() => navigate('/account')}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                color: isActive('/account') ? '#DDEDD2' : 'rgba(221, 237, 210, 0.5)',
                fontSize: '1.25rem', transition: 'color 0.2s'
              }}
              title="Account Settings"
            >
              <FontAwesomeIcon icon={faUser} style={{ filter: isActive('/account') ? 'drop-shadow(0 0 8px rgba(221, 237, 210, 0.5))' : 'none' }} />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                color: isActive('/dashboard') ? '#DDEDD2' : 'rgba(221, 237, 210, 0.5)',
                fontSize: '1.25rem', transition: 'color 0.2s'
              }}
              title="Dashboard (Stats)"
            >
              <FontAwesomeIcon icon={faChartLine} style={{ filter: isActive('/dashboard') ? 'drop-shadow(0 0 8px rgba(221, 237, 210, 0.5))' : 'none' }} />
            </button>

            <button
              onClick={() => navigate('/track-round')}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                color: isActive('/track-round') ? '#DDEDD2' : 'rgba(221, 237, 210, 0.5)',
                fontSize: '1.25rem', transition: 'color 0.2s'
              }}
              title="Track Round"
            >
              <FontAwesomeIcon icon={faClipboard} style={{ filter: isActive('/track-round') ? 'drop-shadow(0 0 8px rgba(221, 237, 210, 0.5))' : 'none' }} />
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                color: 'rgba(221, 237, 210, 0.5)', fontSize: '1.25rem', transition: 'color 0.2s'
              }}
              title="Logout"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </>
        ) : (
          <>
            {onDiscard && (
              <button
                onClick={onDiscard}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                  color: '#e6c280', fontSize: '1.25rem', transition: 'color 0.2s'
                }}
                title="Discard Round"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
            <button
              onClick={handleCreateAccount}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem',
                color: '#DDEDD2', fontSize: '1.25rem', transition: 'color 0.2s'
              }}
              title="Create Account"
            >
              <FontAwesomeIcon icon={faUserPlus} />
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
