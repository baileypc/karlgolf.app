// Karl's GIR - Offline Page
export default function OfflinePage() {
  return (
    <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', marginBottom: '1rem' }}>You're Offline</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
