const fs = require('fs');
let file = fs.readFileSync('src/pages/TrackRoundPage.tsx', 'utf8');

const oldStr = `                {fairway === 'na' && (
                  <button
                    onClick={() => {
                      setTeePenalty('1');
                      setGir('n');
                      setPutts(null);
                      setHoledOut(false);
                      setPuttDistances([]);
                      setShotsToGreen(null);
                      setWedgeShotDistances([]);
                      setApproachMissLocation(null);
                      setSecondShotLie(null);
                      // Auto-capture re-tee distance from hole distance entered in Card 1
                      if (par === 5) {
                        setSecondShotDistance(holeDistance);
                        setActiveCard(4); // Skip re-tee distance card → go to lie selection
                      } else {
                        setProximity(holeDistance);
                        setActiveCard(3); // Go to lie selection card
                      }
                    }}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      backgroundColor: teePenalty === '1' ? 'var(--color-interactive)' : 'transparent',
                      color: teePenalty === '1' ? '#000' : 'var(--color-interactive)',
                    }}
                  >
                    +1 Confirm Penalty &amp; Continue
                  </button>
                )}`;

const newStr = `                {fairway === 'na' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setTeePenalty('1');
                        setIsTeeDrop(false);
                        setGir('n');
                        setPutts(null); setHoledOut(false); setPuttDistances([]);
                        setShotsToGreen(null); setWedgeShotDistances([]);
                        setApproachMissLocation(null);
                        setSecondShotLie(null);
                        if (par === 5) {
                          setSecondShotDistance(holeDistance);
                          setActiveCard(4);
                        } else {
                          setProximity(holeDistance);
                          setActiveCard(3);
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        backgroundColor: teePenalty === '1' && !isTeeDrop ? 'var(--color-interactive)' : 'transparent',
                        color: teePenalty === '1' && !isTeeDrop ? '#000' : 'var(--color-interactive)',
                      }}
                    >
                      +1 Re-tee
                    </button>
                    <button
                      onClick={() => {
                        setTeePenalty('1');
                        setIsTeeDrop(true);
                        setGir('n');
                        setPutts(null); setHoledOut(false); setPuttDistances([]);
                        setShotsToGreen(null); setWedgeShotDistances([]);
                        setApproachMissLocation(null);
                        setSecondShotLie(null);
                        if (par === 5) {
                          setSecondShotDistance(holeDistance);
                          setActiveCard(4);
                        } else {
                          setProximity(holeDistance);
                          setActiveCard(3);
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        backgroundColor: teePenalty === '1' && isTeeDrop ? 'var(--color-interactive)' : 'transparent',
                        color: teePenalty === '1' && isTeeDrop ? '#000' : 'var(--color-interactive)',
                      }}
                    >
                      +1 Drop (Nearest Point)
                    </button>
                    <button
                      onClick={() => {
                        setTeePenalty('2');
                        setIsTeeDrop(true);
                        setGir('n');
                        setPutts(null); setHoledOut(false); setPuttDistances([]);
                        setShotsToGreen(null); setWedgeShotDistances([]);
                        setApproachMissLocation(null);
                        setSecondShotLie(null);
                        if (par === 5) {
                          setSecondShotDistance(holeDistance);
                          setActiveCard(4);
                        } else {
                          setProximity(holeDistance);
                          setActiveCard(3);
                        }
                      }}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        backgroundColor: teePenalty === '2' && isTeeDrop ? 'var(--color-interactive)' : 'transparent',
                        color: teePenalty === '2' && isTeeDrop ? '#000' : 'var(--color-interactive)',
                      }}
                    >
                      +2 Drop (Lateral/Local Rule)
                    </button>
                  </div>
                )}`;

if (file.includes(oldStr)) {
  fs.writeFileSync('src/pages/TrackRoundPage.tsx', file.replace(oldStr, newStr), 'utf8');
  console.log('Successfully replaced Par 4/5 tee drop button');
} else {
  console.error('ERROR: old string not found in file!');
}
