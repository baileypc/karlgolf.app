// Karl's GIR - Statistics Calculator (TypeScript)
// Extracted from shared-utils.js

import type { Hole, RoundStats } from '@/types';

export function calculateRoundStats(holes: Hole[]): RoundStats {
  // Filter out invalid holes
  const validHoles = holes.filter(h => h && h.holeNumber > 0 && h.score > 0);
  const totalHoles = validHoles.length;

  if (totalHoles === 0) {
    return {
      totalHoles: 0,
      totalScore: 0,
      totalPar: 0,
      toPar: 0,
      girsHit: 0,
      girPercentage: 0,
      fairwaysHit: 0,
      eligibleFairways: 0,
      fairwayPercentage: 0,
      totalPutts: 0,
      avgPutts: 0,
      puttsPerGIR: 0,
      scrambling: 0,
      scramblingPercentage: 0,
      missedGirs: 0,
      holeOuts: 0,
      missedGirHoleOuts: 0,
      underParHoleOuts: 0,
      holeOutPct: 0,
      missedGirHoleOutPct: 0,
      holeOutsPer18: 0,
      penalties: 0,
      totalPenaltyStrokes: 0,
    };
  }

  let totalPar = 0;
  let totalScore = 0;
  let totalPutts = 0;
  let girsHit = 0;
  let puttsOnGIR = 0;
  let fairwaysHit = 0;
  let eligibleFairways = 0;
  let scrambles = 0;
  let missedGirs = 0;
  let penalties = 0;
  let totalPenaltyStrokes = 0;
  let holeOuts = 0;
  let missedGirHoleOuts = 0;
  let underParHoleOuts = 0;
  let allApproachesSum = 0;
  let allApproachesCount = 0;

  for (const hole of validHoles) {
    totalPar += hole.par;
    totalScore += hole.score;
    totalPutts += hole.putts;

    // GIR tracking
    const isGir = hole.gir === 'y';
    const isHoledOut = (hole as any).holedOut === true || (hole.putts === 0 && (!hole.puttDistances || hole.puttDistances.length === 0));
    if (isGir) {
      girsHit++;
      puttsOnGIR += hole.putts;
    } else {
      missedGirs++;
      // Scrambling: missed GIR but made par or better
      if (hole.score > 0 && hole.par > 0 && hole.score <= hole.par) {
        scrambles++;
      }
    }

    if (isHoledOut) {
      holeOuts++;
      if (!isGir) missedGirHoleOuts++;
      if (hole.score < hole.par) underParHoleOuts++;
    }

    // Fairway tracking (Par 4/5 only)
    if (hole.par !== 3) {
      eligibleFairways++;
      const fairway = (hole as any).fairway;
      if (fairway === 'y' || fairway === 'c' || fairway === 'l' || fairway === 'r') {
        fairwaysHit++;
      }
    }

    // Penalties
    const penaltyStrokes = (hole as any).penaltyStrokes;
    if (hole.penalty || (Number.isFinite(Number(penaltyStrokes)) && Number(penaltyStrokes) > 0)) {
      penalties++;
      const legacyPenalty = (hole as any).penalty;
      if (Number.isFinite(Number(penaltyStrokes)) && Number(penaltyStrokes) > 0) {
        totalPenaltyStrokes += Number(penaltyStrokes);
      } else if (Number.isFinite(Number(legacyPenalty)) && Number(legacyPenalty) > 0) {
        totalPenaltyStrokes += Number(legacyPenalty);
      } else {
        totalPenaltyStrokes += legacyPenalty === 'wrong' ? 2 : 1;
      }
    }

    // Approach proximity
    if (hole.proximity && hole.proximity > 0) {
      allApproachesSum += hole.proximity;
      allApproachesCount++;
    }
  }

  return {
    totalHoles,
    totalScore,
    totalPar,
    toPar: totalScore - totalPar,
    girsHit,
    girPercentage: totalHoles > 0 ? (girsHit / totalHoles) * 100 : 0,
    avgProximity: allApproachesCount > 0 ? allApproachesSum / allApproachesCount : 0,
    fairwaysHit,
    eligibleFairways,
    fairwayPercentage: eligibleFairways > 0 ? (fairwaysHit / eligibleFairways) * 100 : 0,
    totalPutts,
    avgPutts: totalHoles > 0 ? totalPutts / totalHoles : 0,
    puttsPerGIR: girsHit > 0 ? puttsOnGIR / girsHit : 0,
    scrambling: scrambles,
    scramblingPercentage: missedGirs > 0 ? (scrambles / missedGirs) * 100 : 0,
    missedGirs,
    holeOuts,
    missedGirHoleOuts,
    underParHoleOuts,
    holeOutPct: totalHoles > 0 ? (holeOuts / totalHoles) * 100 : 0,
    missedGirHoleOutPct: missedGirs > 0 ? (missedGirHoleOuts / missedGirs) * 100 : 0,
    holeOutsPer18: totalHoles > 0 ? (holeOuts / totalHoles) * 18 : 0,
    penalties,
    totalPenaltyStrokes,
  } as any;
}
