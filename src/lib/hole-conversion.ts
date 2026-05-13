import type { Hole as APIHole } from '@/types';

export interface LocalHoleLike {
  holeNumber: number;
  par: 3 | 4 | 5;
  score: number;
  gir: 'y' | 'n';
  putts: number;
  puttDistances?: number[];
  holedOut?: boolean;
  fairway?: 'l' | 'c' | 'r' | 'na' | 'rough' | 'sand' | 'y' | 'n' | null;
  shotsToGreen?: number;
  penalty?: string | null;
  proximity?: number;
  secondShotDistance?: number;
  secondShotLie?: 'c' | 'fairway' | 'rough' | 'sand' | 'na' | 'hazard' | 'green' | null;
  secondShotPenalty?: string | number | null;
  approachMissLocation?: APIHole['approachMissLocation'];
  wedgeShotDistance?: number;
  wedgeShotDistances?: number[];
  holeDistance?: number;
}

const fairwayHitValues = ['c', 'l', 'r', 'y'];

function toApiFairway(localHole: LocalHoleLike): 'y' | 'n' | null {
  if (localHole.par === 3) return null;
  return fairwayHitValues.includes(String(localHole.fairway)) ? 'y' : 'n';
}

function toApproachLieFromFairway(fairway: LocalHoleLike['fairway']): APIHole['approachLie'] {
  if (fairwayHitValues.includes(String(fairway))) return 'fairway';
  if (fairway === 'rough') return 'rough';
  if (fairway === 'sand') return 'sand';
  return null;
}

function toApproachLieFromSecondShot(secondShotLie: LocalHoleLike['secondShotLie']): APIHole['approachLie'] {
  if (secondShotLie === 'c' || secondShotLie === 'fairway') return 'fairway';
  if (secondShotLie === 'rough') return 'rough';
  if (secondShotLie === 'sand') return 'sand';
  return null;
}

function toApiSecondShotLie(secondShotLie: LocalHoleLike['secondShotLie']): APIHole['secondShotLie'] | undefined {
  if (secondShotLie === 'na') return 'hazard';
  if (secondShotLie === 'c') return 'fairway';
  if (secondShotLie === 'fairway' || secondShotLie === 'rough' || secondShotLie === 'sand' || secondShotLie === 'hazard' || secondShotLie === 'green') {
    return secondShotLie;
  }
  return undefined;
}

function toPenaltyStrokes(hole: LocalHoleLike): number {
  const numeric = Number.parseInt(String(hole.penalty || '0'), 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function toSecondShotPenalty(hole: LocalHoleLike): number {
  const numeric = Number.parseInt(String(hole.secondShotPenalty || '0'), 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function toApproachLie(localHole: LocalHoleLike): APIHole['approachLie'] {
  if (localHole.par === 3) return null;

  if (localHole.par === 5) {
    if (localHole.secondShotLie === 'green') {
      return toApproachLieFromFairway(localHole.fairway);
    }
    return toApproachLieFromSecondShot(localHole.secondShotLie);
  }

  if (localHole.fairway === 'na' && localHole.secondShotLie) {
    return toApproachLieFromSecondShot(localHole.secondShotLie);
  }

  return toApproachLieFromFairway(localHole.fairway);
}

export function convertToAPIHole(localHole: LocalHoleLike): APIHole {
  const totalPenalties = toPenaltyStrokes(localHole);
  const secondShotPenalty = toSecondShotPenalty(localHole);

  const apiHole: APIHole = {
    holeNumber: localHole.holeNumber,
    par: localHole.par,
    score: localHole.score,
    gir: localHole.gir,
    putts: localHole.putts,
    puttDistances: localHole.puttDistances || [],
    holedOut: Boolean(localHole.holedOut || localHole.putts === 0),
    fairway: toApiFairway(localHole),
    shotsToGreen: localHole.gir === 'n'
      ? (localHole.shotsToGreen || 0) + totalPenalties - (localHole.par === 5 ? secondShotPenalty : 0)
      : localHole.shotsToGreen,
    penalty: totalPenalties > 0 ? 'other' : null,
    penaltyStrokes: totalPenalties > 0 ? totalPenalties : undefined,
    proximity: localHole.proximity,
    approachLie: toApproachLie(localHole),
  };

  if (localHole.par === 5) {
    if (localHole.secondShotDistance != null) apiHole.secondShotDistance = localHole.secondShotDistance;
    const apiSecondShotLie = toApiSecondShotLie(localHole.secondShotLie);
    if (apiSecondShotLie) apiHole.secondShotLie = apiSecondShotLie;
    if (secondShotPenalty > 0) apiHole.secondShotPenalty = secondShotPenalty;
  }

  if (localHole.approachMissLocation != null) apiHole.approachMissLocation = localHole.approachMissLocation;
  if (localHole.wedgeShotDistances != null && localHole.wedgeShotDistances.length > 0) apiHole.wedgeShotDistances = localHole.wedgeShotDistances;
  else if (localHole.wedgeShotDistance != null) apiHole.wedgeShotDistance = localHole.wedgeShotDistance;
  if (localHole.holeDistance != null) apiHole.holeDistance = localHole.holeDistance;

  return apiHole;
}
