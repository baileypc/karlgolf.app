const fs = require('fs');

let file = fs.readFileSync('src/pages/TrackRoundPage.tsx', 'utf8');

// 1. Add state variable
file = file.replace(
  "const [teePenalty, setTeePenalty] = useState(''); // Tee-shot hazard penalty (Par 4/5 only)",
  "const [teePenalty, setTeePenalty] = useState(''); // Tee-shot hazard penalty (Par 4/5 only)\n  const [isTeeDrop, setIsTeeDrop] = useState<boolean>(false);"
);

// 2. Add to load form logic
file = file.replace(
  "if (f.teePenalty !== undefined) setTeePenalty(f.teePenalty);",
  "if (f.teePenalty !== undefined) setTeePenalty(f.teePenalty);\n          if (f.isTeeDrop !== undefined) setIsTeeDrop(!!f.isTeeDrop);"
);

// 3. Add to handleSave state payload
file = file.replace(
  "          teePenalty,",
  "          teePenalty,\n          isTeeDrop,"
);

// 4. Add to useEffect dependency array
file = file.replace(
  "proximity, teePenalty, holeDistance, secondShotDistance, secondShotLie, secondShotPenalty, approachMissLocation, wedgeShotDistances",
  "proximity, teePenalty, isTeeDrop, holeDistance, secondShotDistance, secondShotLie, secondShotPenalty, approachMissLocation, wedgeShotDistances"
);

// 5. Update baseShotsBeforeRecovery in handleSubmitHole
file = file.replace(
  "          ? (par === 3 ? (gir === 'y' ? 2 : 3) : (par === 4 ? 3 : 3)) // Par 3/4/5 base before recovery when GIR denied by tee penalty",
  "          ? (par === 3 ? (gir === 'y' ? 2 : 3) : (par === 4 ? (isTeeDrop ? 1 + teePenaltyNum : 3) : (isTeeDrop ? 2 + teePenaltyNum : 3))) // Par 3/4/5 base before recovery when GIR denied by tee penalty"
);

// 6. Reset in clear state
file = file.replace(
  "setTeePenalty('');",
  "setTeePenalty('');\n      setIsTeeDrop(false);"
);

// 7. Update Par 3 Tee Penalty UI (lines 1098+)
file = file.replace(
  `                      {fairway === 'na' && (
                        <button
                          onClick={() => {
                            setTeePenalty('1');
                            setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                            setShotsToGreen(null); setWedgeShotDistances([]);
                            setApproachMissLocation(null);
                            setActiveCard(4);
                          }}
                          className="btn btn-secondary"
                          style={{
                            width: '100%',
                            backgroundColor: teePenalty === '1' ? 'var(--color-interactive)' : 'transparent',
                            color: teePenalty === '1' ? '#000' : 'var(--color-interactive)',
                          }}
                        >
                          +1 Confirm Penalty &amp; Continue
                        </button>
                      )}`,
  `                      {fairway === 'na' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                          <button
                            onClick={() => {
                              setTeePenalty('1');
                              setIsTeeDrop(false);
                              setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                              setShotsToGreen(null); setWedgeShotDistances([]);
                              setApproachMissLocation(null);
                              setActiveCard(4);
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
                              setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                              setShotsToGreen(null); setWedgeShotDistances([]);
                              setApproachMissLocation(null);
                              setActiveCard(4);
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
                              setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                              setShotsToGreen(null); setWedgeShotDistances([]);
                              setApproachMissLocation(null);
                              setActiveCard(4);
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
                      )}`
);

// 8. Update Par 4 Tee Penalty UI
file = file.replace(
  `                    {fairway === 'na' && (
                      <button
                        onClick={() => {
                          setTeePenalty('1');
                          setGir(null);
                          setPutts(null); setHoledOut(false); setPuttDistances([]);
                          setShotsToGreen(null); setWedgeShotDistances([]);
                          setApproachMissLocation(null);
                          setActiveCard(4);
                        }}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          backgroundColor: teePenalty === '1' ? 'var(--color-interactive)' : 'transparent',
                          color: teePenalty === '1' ? '#000' : 'var(--color-interactive)',
                        }}
                      >
                        +1 Confirm Penalty &amp; Continue
                      </button>
                    )}`,
  `                    {fairway === 'na' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <button
                          onClick={() => {
                            setTeePenalty('1');
                            setIsTeeDrop(false);
                            setGir(null);
                            setPutts(null); setHoledOut(false); setPuttDistances([]);
                            setShotsToGreen(null); setWedgeShotDistances([]);
                            setApproachMissLocation(null);
                            setActiveCard(4);
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
                            setActiveCard(4);
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
                            setActiveCard(4);
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
                    )}`
);

// 9. Update Par 5 Tee Penalty UI
file = file.replace(
  `                    {fairway === 'na' && (
                      <button
                        onClick={() => {
                          setTeePenalty('1');
                          setSecondShotLie(null); setSecondShotDistance(null);
                          setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                          setShotsToGreen(null); setWedgeShotDistances([]);
                          setApproachMissLocation(null);
                          setActiveCard(3);
                        }}
                        className="btn btn-secondary"
                        style={{
                          width: '100%',
                          backgroundColor: teePenalty === '1' ? 'var(--color-interactive)' : 'transparent',
                          color: teePenalty === '1' ? '#000' : 'var(--color-interactive)',
                        }}
                      >
                        +1 Confirm Penalty &amp; Continue
                      </button>
                    )}`,
  `                    {fairway === 'na' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <button
                          onClick={() => {
                            setTeePenalty('1');
                            setIsTeeDrop(false);
                            setSecondShotLie(null); setSecondShotDistance(null);
                            setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                            setShotsToGreen(null); setWedgeShotDistances([]);
                            setApproachMissLocation(null);
                            setActiveCard(3);
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
                            setSecondShotLie(null); setSecondShotDistance(null);
                            setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                            setShotsToGreen(null); setWedgeShotDistances([]);
                            setApproachMissLocation(null);
                            setActiveCard(3);
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
                            setSecondShotLie(null); setSecondShotDistance(null);
                            setGir(null); setPutts(null); setHoledOut(false); setPuttDistances([]);
                            setShotsToGreen(null); setWedgeShotDistances([]);
                            setApproachMissLocation(null);
                            setActiveCard(3);
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
                    )}`
);

// 10. Update Par 5 card 4 transition logic if isTeeDrop
file = file.replace(
  "{par === 5 && activeCard >= 4 && secondShotDistance != null && (",
  "{par === 5 && activeCard >= 4 && (secondShotDistance != null || isTeeDrop) && ("
);

fs.writeFileSync('src/pages/TrackRoundPage.tsx', file, 'utf8');
console.log('Script ran successfully!');
