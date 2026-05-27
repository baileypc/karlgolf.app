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
  console.log('Successfully replaced Par 4/5 tee buttons');
} else {
  console.error('ERROR: old Par 4/5 string not found in file!');
}

const oldPar4Card3 = `                    {(parseInt(teePenalty) || 0) >= 1 ? (
                      /* Re-tee: distance auto-captured from Card 1 — just ask where it landed */
                      <>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Where did your re-tee shot land?
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                          {[
                            { value: 'c' as const, label: 'Fairway' },
                            { value: 'rough' as const, label: 'Rough' },
                            { value: 'sand' as const, label: 'Sand' },
                            { value: 'na' as const, label: 'Penalty' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSecondShotLie(option.value);
                                setActiveCard(4);
                              }}
                              className="btn btn-secondary"
                              style={{
                                backgroundColor: (option.value === 'c' ? secondShotLie === 'c' : secondShotLie === option.value) ? 'var(--color-interactive)' : 'transparent',
                                color: (option.value === 'c' ? secondShotLie === 'c' : secondShotLie === option.value) ? '#000' : 'var(--color-interactive)',
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (`;

const newPar4Card3 = `                    {(parseInt(teePenalty) || 0) >= 1 ? (
                      /* Penalty Workflow: Need distance for next shot (either Re-tee approach or Drop) */
                      <>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                          Next Shot Distance{' '}
                          <span style={{ fontWeight: 'normal', opacity: 0.6, fontSize: '0.8rem', marginLeft: '0.5rem' }}>(yards)</span>
                        </label>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', opacity: 0.7, marginBottom: '0.75rem', fontStyle: 'italic' }}>
                          {!isTeeDrop 
                            ? 'How far was your approach shot after your re-tee?' 
                            : 'How far are you from the hole after your drop?'}
                        </div>
                      </>
                    ) : (`;

if (file.includes(oldPar4Card3)) {
  file = file.replace(oldPar4Card3, newPar4Card3);
  console.log('Successfully replaced Par 4 Card 3 Re-tee hijack');
} else {
  console.error('ERROR: old Par 4 Card 3 string not found in file!');
}

const oldPar4Card4Label = `                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      {(parseInt(teePenalty) || 0) >= 1 ? 'Next shot from the fairway — did you reach the green?' : 'Green in Regulation (GIR)'}
                    </label>
                    {(parseInt(teePenalty) || 0) >= 1 && (
                      <div style={{ fontSize: '0.82rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        This is your swing from the fairway. Tap <strong>On Green!</strong> if you reached in one shot. If you missed, enter how many more shots it took to finish getting on the green — include every swing from here until the ball is on the putting surface.
                      </div>
                    )}`;

const newPar4Card4Label = `                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Green in Regulation (GIR)
                    </label>`;

if (file.includes(oldPar4Card4Label)) {
  file = file.replace(oldPar4Card4Label, newPar4Card4Label);
  console.log('Successfully replaced Par 4 Card 4 label');
} else {
  console.error('ERROR: old Par 4 Card 4 label string not found in file!');
}

const oldCard3VisPar4 = `          {/* CARD 3 (Approach Distance or Par 3 Recovery) */}
          {par !== null && par !== 5 && (par === 3 ? (gir === 'n' && activeCard >= 3) : (fairway !== null && (fairway !== 'na' || teePenalty !== '') && activeCard >= 3)) && (
            activeCard !== 3 && (proximity !== null || (parseInt(teePenalty) || 0) >= 1 || (par === 3 && shotsToGreen !== null)) ? (`;

const newCard3VisPar4 = `          {/* CARD 3 (Approach Distance or Par 3 Recovery) */}
          {par !== null && par !== 5 && (par === 3 ? (gir === 'n' && activeCard >= 3) : (fairway !== null && (fairway !== 'na' || isTeeDrop) && activeCard >= 3)) && (
            activeCard !== 3 && (proximity !== null || (par === 3 && shotsToGreen !== null)) ? (`;

if (file.includes(oldCard3VisPar4)) {
  file = file.replace(oldCard3VisPar4, newCard3VisPar4);
  console.log('Successfully replaced Par 4 Card 3 visibility');
} else {
  console.error('ERROR: old Par 4 Card 3 visibility string not found in file!');
}

const oldCard4VisPar4 = `          {/* CARD 4 (Par 4): GIR (if tee shot was in play) OR Next Shot from fairway after Re-Tee */}
          {par === 4 && (
            ( (parseInt(teePenalty) || 0) === 0 && proximity !== null ) ||
            ( (parseInt(teePenalty) || 0) >= 1 )
          ) && (`;

const newCard4VisPar4 = `          {/* CARD 4 (Par 4): GIR (if tee shot was in play) OR Next Shot from fairway after Re-Tee */}
          {par === 4 && proximity !== null && (`;

if (file.includes(oldCard4VisPar4)) {
  file = file.replace(oldCard4VisPar4, newCard4VisPar4);
  console.log('Successfully replaced Par 4 Card 4 visibility');
} else {
  console.error('ERROR: old Par 4 Card 4 visibility string not found in file!');
}

const oldPar5Card3Vis = `          {/* CARD 3 (Par 5): 2nd Shot Distance — hidden when tee penalty active (distance auto-captured from Card 1) */}
          {par === 5 && (parseInt(teePenalty) || 0) === 0 && fairway !== null && fairway !== 'na' && (
            activeCard !== 3 && secondShotDistance != null ? (`;

const newPar5Card3Vis = `          {/* CARD 3 (Par 5): 2nd Shot Distance */}
          {par === 5 && fairway !== null && (fairway !== 'na' || isTeeDrop) && (
            activeCard !== 3 && secondShotDistance != null ? (`;

if (file.includes(oldPar5Card3Vis)) {
  file = file.replace(oldPar5Card3Vis, newPar5Card3Vis);
  console.log('Successfully replaced Par 5 Card 3 visibility');
} else {
  console.error('ERROR: old Par 5 Card 3 visibility string not found in file!');
}

fs.writeFileSync('src/pages/TrackRoundPage.tsx', file, 'utf8');
console.log('Done.');
