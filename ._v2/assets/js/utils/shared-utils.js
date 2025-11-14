// Shared utilities for Karl's GIR Tracker
// Used across track-live.html and track-round.html

// CSV Export Function
function exportToCSV(holes, roundName = 'Round') {
    const csv = holes.map(h => {
        const toPar = h.score - h.par;
        const toParStr = toPar === 0 ? 'E' : (toPar > 0 ? `+${toPar}` : `-${Math.abs(toPar)}`);
        const scrambled = !h.gir && h.score <= h.par;
        return `${h.holeNumber},${h.par},${h.score},${toParStr},${h.gir ? 'Yes' : 'No'},${h.putts},${h.fairway !== null ? (h.fairway ? 'Yes' : 'No') : 'N/A'},${h.approachDistance || ''},${h.penalty || 'None'},${scrambled ? 'Yes' : 'No'}`;
    }).join('\n');
    
    const header = 'Hole,Par,Score,To Par,GIR,Putts,Fairway,Approach Dist (ft),Penalty,Scrambled\n';
    
    // Calculate summary stats
    const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
    const totalScore = holes.reduce((sum, h) => sum + h.score, 0);
    const totalToPar = totalScore - totalPar;
    const girsHit = holes.filter(h => h.gir).length;
    const fairwaysHit = holes.filter(h => h.fairway && h.par !== 3).length;
    const eligibleFairways = holes.filter(h => h.par !== 3).length;
    const totalPutts = holes.reduce((sum, h) => sum + h.putts, 0);
    const penalties = holes.filter(h => h.penalty && h.penalty !== '').length;
    const totalPenaltyStrokes = holes.reduce((sum, h) => {
        if (h.penalty === 'wrong') return sum + 2;
        if (h.penalty && h.penalty !== '') return sum + 1;
        return sum;
    }, 0);
    
    // Auto-calculate scrambling
    const missedGirs = holes.filter(h => !h.gir);
    const scrambles = missedGirs.filter(h => h.score <= h.par).length;
    
    // Calculate putts per GIR
    const girHoles = holes.filter(h => h.gir);
    const puttsOnGIR = girHoles.reduce((sum, h) => sum + h.putts, 0);
    const puttsPerGIR = girHoles.length > 0 ? (puttsOnGIR / girHoles.length).toFixed(2) : 0;
    
    // Proximity stats for CSV
    const allApproaches = holes.filter(h => h.approachDistance);
    const avgProximity = allApproaches.length > 0 
        ? (allApproaches.reduce((sum, h) => sum + parseFloat(h.approachDistance || 0), 0) / allApproaches.length).toFixed(1)
        : 0;
    
    const summary = `\n\nROUND SUMMARY\n` +
        `Holes Played,${holes.length}\n` +
        `Total Score,${totalScore}\n` +
        `Total Par,${totalPar}\n` +
        `To Par,${totalToPar === 0 ? 'E' : (totalToPar > 0 ? `+${totalToPar}` : `-${Math.abs(totalToPar)}`)}\n` +
        `GIR,${girsHit}/${holes.length} (${((girsHit/holes.length)*100).toFixed(1)}%)\n` +
        `Putts per GIR,${puttsPerGIR}\n` +
        `Avg Proximity,${avgProximity} feet\n` +
        `Fairways,${fairwaysHit}/${eligibleFairways} (${eligibleFairways > 0 ? ((fairwaysHit/eligibleFairways)*100).toFixed(1) : 0}%)\n` +
        `Total Putts,${totalPutts} (${(totalPutts/holes.length).toFixed(2)} avg)\n` +
        `Scrambling,${scrambles}/${missedGirs.length} (${missedGirs.length > 0 ? ((scrambles/missedGirs.length)*100).toFixed(1) : 0}%)\n` +
        `Penalties,${totalPenaltyStrokes} stroke${totalPenaltyStrokes !== 1 ? 's' : ''} (${penalties} hole${penalties !== 1 ? 's' : ''})\n` +
        `Date,${new Date().toISOString().split('T')[0]}`;
    
    const blob = new Blob([header + csv + summary], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with round name and hole count
    const sanitizedRoundName = roundName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const holeCount = holes.length >= 18 ? 18 : 9;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `${sanitizedRoundName}_${holeCount}holes_${dateStr}.csv`;
    
    a.click();
    window.URL.revokeObjectURL(url);
}

// Calculate Round Stats
function calculateRoundStats(holes) {
    // Filter out invalid holes (must have holeNumber and score)
    const validHoles = holes.filter(h => h && h.holeNumber > 0 && h.score > 0);
    const totalHoles = validHoles.length;
    
    if (totalHoles === 0) {
        return {
            totalPar: 0,
            totalScore: 0,
            toPar: 0,
            girsHit: 0,
            girPct: 0,
            avgProximity: 0,
            avgProximityGIR: 0,
            avgProximityMissed: 0,
            fairwaysHit: 0,
            fairwayPct: 0,
            totalPutts: 0,
            avgPutts: 0,
            scrambles: 0,
            scramblingPct: 0,
            penalties: 0,
            totalPenaltyStrokes: 0
        };
    }
    
    // Calculate totals manually to ensure accuracy and handle null/undefined values
    let totalPar = 0;
    let totalScore = 0;
    let totalPutts = 0;
    let girsHit = 0;
    let fairwaysHit = 0;
    let eligibleFairways = 0;
    let scrambles = 0;
    let missedGirs = 0;
    let penalties = 0;
    let totalPenaltyStrokes = 0;
    let puttsOnGIR = 0;
    let girHolesCount = 0;
    let allApproachesSum = 0;
    let allApproachesCount = 0;
    let girApproachesSum = 0;
    let girApproachesCount = 0;
    let missedGirApproachesSum = 0;
    let missedGirApproachesCount = 0;
    
    for (const h of validHoles) {
        // Par and Score (required)
        const par = parseInt(h.par) || 0;
        const score = parseInt(h.score) || 0;
        totalPar += par;
        totalScore += score;
        
        // Putts
        const putts = parseInt(h.putts) || 0;
        totalPutts += putts;
        
        // GIR stats (ensure boolean conversion)
        const isGir = h.gir === true || h.gir === 'y' || h.gir === 'yes';
        if (isGir) {
            girsHit++;
            girHolesCount++;
            puttsOnGIR += putts;
        } else {
            missedGirs++;
            // Scrambling: missed GIR but still made par or better
            if (score > 0 && par > 0 && score <= par) {
                scrambles++;
            }
        }
        
        // Fairway stats (only for par 4 and par 5)
        if (par !== 3) {
            eligibleFairways++;
            if (h.fairway) {
                fairwaysHit++;
            }
        }
        
        // Penalties
        if (h.penalty && h.penalty !== '') {
            penalties++;
            totalPenaltyStrokes += (h.penalty === 'wrong') ? 2 : 1;
        }
        
        // Approach proximity
        if (h.approachDistance && parseFloat(h.approachDistance) > 0) {
            const distance = parseFloat(h.approachDistance);
            allApproachesSum += distance;
            allApproachesCount++;
            
            if (isGir) {
                girApproachesSum += distance;
                girApproachesCount++;
            } else {
                missedGirApproachesSum += distance;
                missedGirApproachesCount++;
            }
        }
    }
    
    // Calculate percentages and averages
    const toPar = totalScore - totalPar;
    const girPct = totalHoles > 0 ? ((girsHit / totalHoles) * 100).toFixed(1) : '0';
    const fairwayPct = eligibleFairways > 0 ? ((fairwaysHit / eligibleFairways) * 100).toFixed(1) : '0';
    const avgPutts = totalHoles > 0 ? (totalPutts / totalHoles).toFixed(2) : '0';
    const scramblingPct = missedGirs > 0 ? ((scrambles / missedGirs) * 100).toFixed(1) : '0';
    const avgProximity = allApproachesCount > 0 ? (allApproachesSum / allApproachesCount).toFixed(1) : '0';
    const avgProximityGIR = girApproachesCount > 0 ? (girApproachesSum / girApproachesCount).toFixed(1) : '0';
    const avgProximityMissed = missedGirApproachesCount > 0 ? (missedGirApproachesSum / missedGirApproachesCount).toFixed(1) : '0';
    
    // Calculate additional stats to match PHP version
    const avgScore = totalHoles > 0 ? parseFloat((totalScore / totalHoles).toFixed(2)) : 0;
    const puttsPerGIR = girHolesCount > 0 ? parseFloat((puttsOnGIR / girHolesCount).toFixed(2)) : 0;
    
    return {
        totalHoles,
        totalPar,
        totalScore,
        toPar,
        avgScore,
        girsHit,
        girPct: parseFloat(girPct),
        avgProximity: parseFloat(avgProximity),
        avgProximityGIR: parseFloat(avgProximityGIR),
        avgProximityMissed: parseFloat(avgProximityMissed),
        fairwaysHit,
        eligibleFairways,
        fairwayPct: parseFloat(fairwayPct),
        totalPutts,
        avgPutts: parseFloat(avgPutts),
        puttsPerGIR,
        scrambles,
        missedGirs,
        scramblingPct: parseFloat(scramblingPct),
        penalties,
        totalPenaltyStrokes
    };
}

// Validate hole data before submission
function validateHoleData(holeData, par) {
    const errors = [];
    
    if (!holeData.score || holeData.score < 1) {
        errors.push('Score is required');
    }
    if (!holeData.gir) {
        errors.push('GIR (Green in Regulation) is required');
    }
    if (holeData.gir === 'n' && !holeData.shotsToGreen) {
        errors.push('Shots to Reach Green is required when GIR is No');
    }
    if (par === 3 && holeData.gir === 'n' && parseInt(holeData.shotsToGreen) === 1) {
        errors.push('For Par 3, Shots to Reach Green cannot be 1');
    }
    if (!holeData.puttDistances || holeData.puttDistances.length === 0) {
        errors.push('At least one putt distance is required');
    }
    if (holeData.puttDistances && holeData.puttDistances.some((p, i, arr) => {
        const val = parseFloat(p);
        if (isNaN(val) || val < 0) return true;
        // Only last putt can have decimals
        if (i < arr.length - 1 && val !== Math.floor(val)) return true;
        return false;
    })) {
        errors.push('Putt distances must be valid numbers (decimals only allowed for last putt)');
    }
    if (par !== 3 && holeData.fairway === null) {
        errors.push('Fairway Hit is required for Par 4 and Par 5');
    }
    if (par !== 3 && holeData.fairway !== 'y' && !holeData.teeShotResult) {
        errors.push('Tee Shot Result is required when Fairway is not hit');
    }
    
    return errors;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { exportToCSV, calculateRoundStats, validateHoleData };
}

