const fs = require('fs');
let file = fs.readFileSync('src/pages/TrackRoundPage.tsx', 'utf8');

const oldPar45 = `                {fairway === 'na' && (
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

const newPar45 = `                {fairway === 'na' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setTeePenalty('1');
                        setIsTeeDrop(false);
                        setGir(null);
                        setPutts(null); setHoledOut(false); setPuttDistances([]);
                        setShotsToGreen(null); setWedgeShotDistances([]);
                        setApproachMissLocation(null);
                        setSecondShotLie(null);
                        setProximity(null);
                        setSecondShotDistance(null);
                        setFairway(null); // Return to Card 2 Re-Tee Result
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
                        setGir(null);
                        setPutts(null); setHoledOut(false); setPuttDistances([]);
                        setShotsToGreen(null); setWedgeShotDistances([]);
                        setApproachMissLocation(null);
                        setSecondShotLie(null);
                        setProximity(null);
                        setSecondShotDistance(null);
                        setActiveCard(3); // Go to Next Shot Distance
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
                        setGir(null);
                        setPutts(null); setHoledOut(false); setPuttDistances([]);
                        setShotsToGreen(null); setWedgeShotDistances([]);
                        setApproachMissLocation(null);
                        setSecondShotLie(null);
                        setProximity(null);
                        setSecondShotDistance(null);
                        setActiveCard(3); // Go to Next Shot Distance
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

if (file.includes(oldPar45)) {
  file = file.replace(oldPar45, newPar45);
  fs.writeFileSync('src/pages/TrackRoundPage.tsx', file, 'utf8');
  console.log('Successfully replaced Par 4/5 tee buttons');
} else {
  console.error('ERROR: old Par 4/5 string not found in file!');
}
