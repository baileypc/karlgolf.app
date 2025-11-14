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
      totalGirs: 0,
      avgProximity: 0,
      fairwaysHit: 0,
      eligibleFairways: 0,
      fairwayPercentage: 0,
      totalPutts: 0,
      avgPutts: 0,
      scrambling: 0,
      scramblingPercentage: 0,
      penalties: 0,
    };
  }

  let totalPar = 0;
  let totalScore = 0;
  let totalPutts = 0;
  let girsHit = 0;
  let fairwaysHit = 0;
  let eligibleFairways = 0;
  let scrambles = 0;
  let missedGirs = 0;
  let penalties = 0;
  let allApproachesSum = 0;
  let allApproachesCount = 0;

  for (const hole of validHoles) {
    totalPar += hole.par;
    totalScore += hole.score;
    totalPutts += hole.putts;

    // GIR tracking
    const isGir = hole.gir === 'y';
    if (isGir) {
      girsHit++;
    } else {
      missedGirs++;
      // Scrambling: missed GIR but made par or better
      if (hole.score <= hole.par) {
        scrambles++;
      }
    }

    // Fairway tracking (Par 4/5 only)
    if (hole.par !== 3) {
      eligibleFairways++;
      if (hole.fairway === 'y') {
        fairwaysHit++;
      }
    }

    // Penalties
    if (hole.penalty) {
      penalties++;
    }

    // Approach proximity
    if (hole.approachDistance && hole.approachDistance > 0) {
      allApproachesSum += hole.approachDistance;
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
    totalGirs: totalHoles,
    avgProximity: allApproachesCount > 0 ? allApproachesSum / allApproachesCount : 0,
    fairwaysHit,
    eligibleFairways,
    fairwayPercentage: eligibleFairways > 0 ? (fairwaysHit / eligibleFairways) * 100 : 0,
    totalPutts,
    avgPutts: totalHoles > 0 ? totalPutts / totalHoles : 0,
    scrambling: scrambles,
    scramblingPercentage: missedGirs > 0 ? (scrambles / missedGirs) * 100 : 0,
    penalties,
  };
}
