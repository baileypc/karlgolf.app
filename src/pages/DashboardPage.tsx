// Karl's GIR - Dashboard Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faDownload, faRotateRight, faUserSlash } from '@fortawesome/free-solid-svg-icons';
import IconNav from '@/components/IconNav';
import { roundsAPI, authAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Modal, { useModal } from '@/components/Modal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const deleteRoundsModal = useModal();
  const deleteSingleRoundModal = useModal();
  const deleteAccountModal = useModal();
  const errorModal = useModal();
  const [errorMessage, setErrorMessage] = useState('');
  const [roundToDelete, setRoundToDelete] = useState<{ roundNumber: number; courseName: string; isIncompleteCard?: boolean } | null>(null);

  // Check for incomplete round (localStorage OR server)
  const [incompleteRound, setIncompleteRound] = useState<{
    courseName: string;
    holes: number;
  } | null>(null);

  // Check server for incomplete rounds (only if logged in)
  const { data: incompleteData, refetch: refetchIncomplete } = useQuery({
    queryKey: ['incompleteRounds'],
    queryFn: () => roundsAPI.getIncompleteRounds(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isLoggedIn, // Only query when user is logged in
    retry: 1,
    refetchOnMount: true, // Always refetch when component mounts
  });


  // Refetch incomplete rounds when user logs in
  useEffect(() => {
    if (isLoggedIn && refetchIncomplete) {
      refetchIncomplete();
    }
  }, [isLoggedIn, refetchIncomplete]);

  // Check both localStorage and server for incomplete rounds
  useEffect(() => {
    // First check localStorage
    const saved = localStorage.getItem('karlsGIR_currentRound');
    let localData: any = null;
    if (saved) {
      try {
        localData = JSON.parse(saved);
      } catch (e) {
        console.error('Error checking localStorage:', e);
      }
    }

    // Check server incomplete rounds (if logged in)
    // The API returns { success: true, incompleteRounds: [...] }
    const serverRounds = incompleteData?.success ? incompleteData.incompleteRounds : null;
    const firstServer = serverRounds && serverRounds.length > 0 ? serverRounds[0] : null;


    // Prefer localStorage if it exists and has holes, otherwise use server
    if (localData && localData.holes && localData.holes.length > 0) {
      setIncompleteRound({
        courseName: localData.courseName || 'Unknown Course',
        holes: localData.holes.length
      });
    } else if (firstServer) {
      // Check both holes array and holeCount property
      const holeCount = firstServer.holes?.length || firstServer.holeCount || 0;
      if (holeCount > 0) {
        setIncompleteRound({
          courseName: firstServer.courseName || 'Unknown Course',
          holes: holeCount
        });
      } else {
        setIncompleteRound(null);
      }
    } else {
      setIncompleteRound(null);
    }
  }, [incompleteData]);

  // Load stats from API
  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('./api/stats/load.php', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load stats');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <div style={{ 
            width: '3rem', 
            height: '3rem', 
            border: '3px solid var(--border-primary)', 
            borderTop: '3px solid var(--color-interactive)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-primary)' }}>Loading stats...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold', color: 'var(--color-error)', marginBottom: '1rem' }}>
            Failed to Load Stats
          </h2>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Could not connect to the API.
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

  const hasData = statsData?.success && statsData?.groups && statsData.groups.length > 0;
  const hasCompletedRounds = hasData && statsData.groups.some((g: any) => {
    const holeCount = g.rounds[0]?.holes?.length || 0;
    return holeCount >= 9;
  });

  console.log('📊 Dashboard - hasData:', hasData, 'hasCompletedRounds:', hasCompletedRounds, 'incompleteRound:', incompleteRound);

  return (
    <>
      <IconNav />
      <div className="min-h-screen" style={{ padding: '0.25rem', paddingTop: '76px', paddingBottom: '3rem', maxWidth: '900px', margin: '0 auto' }}>
        <div className="container">
          {/* Header */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid var(--border-primary)',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
          </div>

          {/* No Completed Rounds Yet - Show Message (only if no incomplete round either) */}
          {!hasCompletedRounds && !incompleteRound && (
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                No Statistics Yet
              </h2>
              <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', opacity: 0.9 }}>
                Complete at least one 9-hole round to see your statistics and track your progress.
              </p>
              <button
                onClick={() => navigate('/track-round')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Start Your First Round
              </button>
            </div>
          )}

          {/* Incomplete Round Card - Always Show if Exists */}
          {incompleteRound && (
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(221, 237, 210, 0.15)' }}>
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Continue Your Round
              </h2>
              <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', opacity: 0.9 }}>
                {incompleteRound.courseName} • {incompleteRound.holes} hole{incompleteRound.holes !== 1 ? 's' : ''} recorded
              </p>
              <button
                onClick={() => navigate('/track-round')}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '0.75rem' }}
              >
                Continue Round
              </button>
              <button
                onClick={() => {
                  setRoundToDelete({ roundNumber: 0, courseName: incompleteRound.courseName, isIncompleteCard: true });
                  deleteSingleRoundModal.open();
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Round
              </button>
            </div>
          )}

          {/* Stats Cards - Show only if there's completed round data */}
          {hasData && (
          <>
            {/* Primary Stat - Average GIR% */}
            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-lg)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Average GIR %
              </h2>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {statsData.cumulative.girPct.toFixed(1)}%
              </div>
              <p style={{ color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                Across {statsData.totalRounds} round{statsData.totalRounds !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Cumulative Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Total Holes
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {statsData.cumulative.totalHoles}
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Total Strokes
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {statsData.cumulative.totalScore}
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Fairways Hit
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {statsData.cumulative.fairwayPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)', marginTop: '0.25rem', opacity: 0.8 }}>
                  (Par 4/5)
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Avg Putts/Hole
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {statsData.cumulative.avgPutts.toFixed(1)}
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Scrambling %
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {statsData.cumulative.scramblingPct.toFixed(1)}%
                </div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Proximity
                </div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {statsData.cumulative.avgProximity.toFixed(1)}ft
                </div>
              </div>
            </div>

            {/* Recent Rounds - Grouped by 10 */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Recent Rounds
              </h2>
              {statsData.groups.slice(0, 10).map((group: any) => {
                const holeCount = group.rounds[0]?.holes?.length || 0;
                const isIncomplete = holeCount > 0 && holeCount < 9;
                
                return (
                  <div key={group.roundNumber} className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {group.courseName}
                        </h3>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                          {group.range} • {holeCount} hole{holeCount !== 1 ? 's' : ''}
                          {isIncomplete && (
                            <span style={{ color: 'var(--color-interactive)', marginLeft: '0.5rem' }}>
                              (Incomplete)
                            </span>
                          )}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {group.stats.girPct.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                          GIR
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-primary)'
                    }}>
                      <div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>Fairways</div>
                        <div style={{ fontSize: 'var(--font-base)', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {group.stats.fairwayPct.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>Avg Putts</div>
                        <div style={{ fontSize: 'var(--font-base)', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {group.stats.avgPutts.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>Scrambling</div>
                        <div style={{ fontSize: 'var(--font-base)', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {group.stats.scramblingPct.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>Proximity</div>
                        <div style={{ fontSize: 'var(--font-base)', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {group.stats.avgProximity.toFixed(1)}ft
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {isIncomplete && (
                        <button
                          onClick={() => navigate('/track-round')}
                          className="btn btn-primary"
                          style={{ width: '100%' }}
                        >
                          Continue Round
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setRoundToDelete({ roundNumber: group.roundNumber, courseName: group.courseName });
                          deleteSingleRoundModal.open();
                        }}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          fontSize: '0.875rem',
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete Round
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Tools Footer - Only show when there ARE completed rounds */}
            {hasCompletedRounds && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginTop: '3rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(221, 237, 210, 0.2)'
            }}>
              {/* Export Data */}
              <button
                onClick={() => {
                  if (!statsData?.success || !statsData.groups || statsData.groups.length === 0) {
                    alert('No data to export');
                    return;
                  }

                  // Collect all rounds from groups
                  const allRounds: any[] = [];
                  statsData.groups.forEach((group: any) => {
                    if (group.rounds && Array.isArray(group.rounds)) {
                      allRounds.push(...group.rounds);
                    }
                  });

                  // Create export object
                  const exportData = {
                    exportDate: new Date().toISOString(),
                    totalRounds: statsData.totalRounds || allRounds.length,
                    cumulativeStats: statsData.cumulative || null,
                    rounds: allRounds,
                  };

                  // Create and download JSON file
                  const jsonStr = JSON.stringify(exportData, null, 2);
                  const blob = new Blob([jsonStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `karls-gir-export-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FontAwesomeIcon icon={faDownload} />
                Export All Data
              </button>

              {/* Clear Cache */}
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  queryClient.clear();
                  alert('✅ Cache cleared');
                  window.location.reload();
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FontAwesomeIcon icon={faRotateRight} />
                Clear Cache
              </button>

              {/* Reset Data */}
              <button
                onClick={() => {
                  deleteRoundsModal.open();
                }}
                disabled={isResetting}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  opacity: isResetting ? 0.5 : 1,
                  cursor: isResetting ? 'not-allowed' : 'pointer',
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete All Rounds
              </button>
            </div>
            )}
          </>
        )}

          {/* Footer Buttons - Show when no completed rounds (after stats cards) */}
          {!hasCompletedRounds && isLoggedIn && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginTop: '3rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(221, 237, 210, 0.2)'
            }}>
              {/* Export Data */}
              <button
                onClick={() => {
                  if (!statsData?.success || !statsData.groups || statsData.groups.length === 0) {
                    setErrorMessage('No data to export');
                    errorModal.open();
                    return;
                  }

                  // Collect all rounds from groups
                  const allRounds: any[] = [];
                  statsData.groups.forEach((group: any) => {
                    if (group.rounds && Array.isArray(group.rounds)) {
                      allRounds.push(...group.rounds);
                    }
                  });

                  // Create export object
                  const exportData = {
                    exportDate: new Date().toISOString(),
                    totalRounds: statsData.totalRounds || allRounds.length,
                    cumulativeStats: statsData.cumulative || null,
                    rounds: allRounds,
                  };

                  // Create and download JSON file
                  const jsonStr = JSON.stringify(exportData, null, 2);
                  const blob = new Blob([jsonStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `karls-gir-export-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FontAwesomeIcon icon={faDownload} />
                Export All Data
              </button>

              {/* Delete All Rounds */}
              <button
                onClick={() => {
                  deleteRoundsModal.open();
                }}
                disabled={isResetting}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  opacity: isResetting ? 0.5 : 1,
                  cursor: isResetting ? 'not-allowed' : 'pointer',
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete All Rounds
              </button>

              {/* Delete Account */}
              <button
                onClick={() => {
                  deleteAccountModal.open();
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                }}
              >
                <FontAwesomeIcon icon={faUserSlash} />
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Rounds Confirmation Modal */}
      <Modal
        isOpen={deleteRoundsModal.isOpen}
        onClose={deleteRoundsModal.close}
        onConfirm={async () => {
          setIsResetting(true);
          try {
            await roundsAPI.resetData();
            localStorage.removeItem('karlsGIR_currentRound');
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['incompleteRound'] });
            deleteRoundsModal.close();
            window.location.reload();
          } catch (error) {
            console.error('Reset failed:', error);
            setErrorMessage('❌ Failed to reset data. Please try again.');
            errorModal.open();
            setIsResetting(false);
          }
        }}
        title="Delete All Rounds?"
        message="⚠️ This will permanently delete ALL rounds and statistics. This action cannot be undone. Are you sure?"
        type="confirm"
        confirmText="Delete All"
        cancelText="Cancel"
      />

      {/* Delete Single Round Confirmation Modal */}
      <Modal
        isOpen={deleteSingleRoundModal.isOpen}
        onClose={deleteSingleRoundModal.close}
        onConfirm={async () => {
          if (!roundToDelete) return;
          
          // If roundNumber is 0, it's the incomplete round from the single card
          // Need to delete from both rounds.json (if it exists there) AND localStorage/current_round.json
          if (roundToDelete.roundNumber === 0 || roundToDelete.isIncompleteCard) {
            try {
              // First, try to find and delete the matching incomplete round from rounds.json
              // Get incomplete rounds to find the roundNumber
              if (isLoggedIn) {
                const incompleteRounds = await roundsAPI.getIncompleteRounds(roundToDelete.courseName);
                if (incompleteRounds.success && incompleteRounds.incompleteRounds.length > 0) {
                  // Find the matching round by course name
                  const matchingRound = incompleteRounds.incompleteRounds.find(
                    (r: any) => r.courseName.toLowerCase().trim() === roundToDelete.courseName.toLowerCase().trim()
                  );
                  
                  if (matchingRound && matchingRound.roundNumber) {
                    // Delete from rounds.json
                    try {
                      await roundsAPI.deleteRound(matchingRound.roundNumber);
                    } catch (e) {
                      console.error('Failed to delete from rounds.json:', e);
                      // Continue anyway - will try to clear current_round.json
                    }
                  }
                }
              }
              
              // Clear localStorage
              localStorage.removeItem('karlsGIR_currentRound');
              
              // Clear server-side incomplete round (current_round.json) if logged in
              if (isLoggedIn) {
                try {
                  await roundsAPI.deleteIncompleteRound();
                } catch (e) {
                  // Ignore - current_round.json might not exist
                }
              }
              
              // Invalidate queries and refresh
              queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              deleteSingleRoundModal.close();
              
              // Force a refetch before reload
              await refetchIncomplete();
              window.location.reload();
            } catch (error) {
              console.error('Delete incomplete round failed:', error);
              // Still clear localStorage even if server delete fails
              localStorage.removeItem('karlsGIR_currentRound');
              queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              deleteSingleRoundModal.close();
              window.location.reload();
            }
            return;
          }

          // Delete from rounds.json (this handles both complete and incomplete rounds saved to rounds.json)
          try {
            const result = await roundsAPI.deleteRound(roundToDelete.roundNumber);
            if (result.success) {
              // Also clear localStorage and current_round.json if this was the active incomplete round
              // (in case the user was working on this round)
              localStorage.removeItem('karlsGIR_currentRound');
              if (isLoggedIn) {
                try {
                  await roundsAPI.deleteIncompleteRound();
                } catch (e) {
                  // Ignore errors - current_round.json might not exist
                }
              }
              
              // Invalidate all queries
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              queryClient.invalidateQueries({ queryKey: ['incompleteRounds'] });
              deleteSingleRoundModal.close();
              
              // Reload to refresh the dashboard
              window.location.reload();
            } else {
              throw new Error(result.message || 'Failed to delete round');
            }
          } catch (error) {
            console.error('Delete round failed:', error);
            setErrorMessage('❌ Failed to delete round. Please try again.');
            errorModal.open();
          }
        }}
        title="Delete Round?"
        message={roundToDelete 
          ? `Delete "${roundToDelete.courseName}"? This action cannot be undone.`
          : 'Delete this round? This action cannot be undone.'}
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteAccountModal.isOpen}
        onClose={deleteAccountModal.close}
        onConfirm={async () => {
          try {
            await authAPI.deleteAccount();
            // Clear all local storage
            localStorage.clear();
            sessionStorage.clear();
            queryClient.clear();
            // Redirect to home page
            window.location.href = '/#/';
          } catch (error: any) {
            console.error('Delete account failed:', error);
            setErrorMessage(error?.message || '❌ Failed to delete account. Please try again.');
            errorModal.open();
            deleteAccountModal.close();
          }
        }}
        title="Delete Account?"
        message="⚠️ This will permanently delete your account and ALL your data. This action cannot be undone. Are you absolutely sure?"
        type="confirm"
        confirmText="Delete Account"
        cancelText="Cancel"
      />

      {/* Error Modal */}
      {errorModal.isOpen && (
        <Modal
          isOpen={errorModal.isOpen}
          onClose={errorModal.close}
          title="Error"
          message={errorMessage}
          type="warning"
          confirmText="OK"
          showCancel={false}
        />
      )}
    </>
  );
}
