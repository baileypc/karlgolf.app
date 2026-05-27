import re

with open("src/pages/TrackRoundPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace Par 4/5 Penalty Button (Confirm Penalty -> 3 Buttons)
old_par45 = """                {fairway === 'na' && (
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
                      if (par === 5) {
                        setSecondShotDistance(holeDistance);
                        setActiveCard(4); // Skip re-tee distance card → go to lie selection
                      } else {
                        setProximity(holeDistance);
                        setActiveCard(3); // Go to lie selection card
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '0.5rem', backgroundColor: 'var(--color-interactive)', color: '#000' }}
                  >
                    +1 Confirm Penalty & Continue
                  </button>
                )}"""

new_par45 = """                {fairway === 'na' && (
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
                )}"""

if old_par45 in content:
    content = content.replace(old_par45, new_par45)
    print("SUCCESS: Replaced Par 4/5 Confirm Penalty buttons")
else:
    print("FAIL: Could not find old_par45")


# 2. Fix Card 3 Visibility (Par 4)
old_card3_vis = """{par !== null && par !== 5 && (par === 3 ? (gir === 'n' && activeCard >= 3) : (fairway !== null && (fairway !== 'na' || teePenalty !== '') && activeCard >= 3)) && ("""
new_card3_vis = """{par !== null && par !== 5 && (par === 3 ? (gir === 'n' && activeCard >= 3) : (fairway !== null && (fairway !== 'na' || isTeeDrop) && activeCard >= 3)) && ("""
if old_card3_vis in content:
    content = content.replace(old_card3_vis, new_card3_vis)
    print("SUCCESS: Replaced Card 3 Visibility (Par 4)")
else:
    print("FAIL: Could not find old_card3_vis")

# 3. Fix Card 3 Re-tee Hijack logic
# I will use a regex to replace the entire `{(parseInt(teePenalty) || 0) >= 1 ? (... ) : (` block inside Card 3.
pattern_card3_hijack = r"\{\(parseInt\(teePenalty\) \|\| 0\) >= 1 \? \(\s*/\* Re-tee:.*?\) : \("
new_card3_hijack = """{(parseInt(teePenalty) || 0) >= 1 ? (
                      /* Penalty Workflow: Need distance for next shot (either Re-tee approach or Drop) */
                      <>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                          Next Shot Distance <span style={{ fontWeight: 'normal', opacity: 0.6, fontSize: '0.8rem', marginLeft: '0.5rem' }}>(yards)</span>
                        </label>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', opacity: 0.7, marginBottom: '0.75rem', fontStyle: 'italic' }}>
                          {!isTeeDrop 
                            ? 'How far was your approach shot after your re-tee?' 
                            : 'How far are you from the hole after your drop?'}
                        </div>
                      </>
                    ) : ("""

if re.search(pattern_card3_hijack, content, re.DOTALL):
    content = re.sub(pattern_card3_hijack, new_card3_hijack, content, flags=re.DOTALL)
    print("SUCCESS: Replaced Card 3 Re-tee Hijack")
else:
    print("FAIL: Could not find pattern_card3_hijack")

# 4. Fix Card 4 Visibility (Par 4)
old_card4_vis = """          {/* CARD 4 (Par 4): GIR (if tee shot was in play) OR Next Shot from fairway after Re-Tee */}
          {par === 4 && (
            ( (parseInt(teePenalty) || 0) === 0 && proximity !== null ) ||
            ( (parseInt(teePenalty) || 0) >= 1 )
          ) && ("""
new_card4_vis = """          {/* CARD 4 (Par 4): GIR (if tee shot was in play) OR Next Shot from fairway after Re-Tee */}
          {par === 4 && proximity !== null && ("""
if old_card4_vis in content:
    content = content.replace(old_card4_vis, new_card4_vis)
    print("SUCCESS: Replaced Card 4 Visibility (Par 4)")
else:
    print("FAIL: Could not find old_card4_vis")

# 5. Fix Card 4 GIR Label (Par 4)
old_card4_label = """                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      {(parseInt(teePenalty) || 0) >= 1 ? 'Next shot from the fairway — did you reach the green?' : 'Green in Regulation (GIR)'}
                    </label>
                    {(parseInt(teePenalty) || 0) >= 1 && (
                      <div style={{ fontSize: '0.82rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        This is your swing from the fairway. Tap <strong>On Green!</strong> if you reached in one shot. If you missed, enter how many more shots it took to finish getting on the green — include every swing from here until the ball is on the putting surface.
                      </div>
                    )}"""
new_card4_label = """                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Green in Regulation (GIR)
                    </label>"""
if old_card4_label in content:
    content = content.replace(old_card4_label, new_card4_label)
    print("SUCCESS: Replaced Card 4 GIR Label")
else:
    print("FAIL: Could not find old_card4_label")

# 6. Fix Card 3 Visibility (Par 5)
old_par5_card3_vis = """          {/* CARD 3 (Par 5): 2nd Shot Distance — hidden when tee penalty active (distance auto-captured from Card 1) */}
          {par === 5 && (parseInt(teePenalty) || 0) === 0 && fairway !== null && fairway !== 'na' && ("""
new_par5_card3_vis = """          {/* CARD 3 (Par 5): 2nd Shot Distance */}
          {par === 5 && fairway !== null && (fairway !== 'na' || isTeeDrop) && ("""
if old_par5_card3_vis in content:
    content = content.replace(old_par5_card3_vis, new_par5_card3_vis)
    print("SUCCESS: Replaced Card 3 Visibility (Par 5)")
else:
    print("FAIL: Could not find old_par5_card3_vis")


with open("src/pages/TrackRoundPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("File updated.")
