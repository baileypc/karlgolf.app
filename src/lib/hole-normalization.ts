import type { DirectGreenSource, GirAttemptSource, PenaltyOrigin } from '@/types';
import type { LocalHoleLike } from '@/lib/hole-conversion';

export interface HoleNormalizationHints {
  teePenalty?: string;
  directGreenSource?: DirectGreenSource | null;
}

const fairwayHitValues = ['c', 'l', 'r', 'y'];

function mapFairwayToLie(fairway: LocalHoleLike['fairway']): Extract<GirAttemptSource, 'fairway' | 'rough' | 'sand'> | null {
  if (fairwayHitValues.includes(String(fairway))) return 'fairway';
  if (fairway === 'rough') return 'rough';
  if (fairway === 'sand') return 'sand';
  return null;
}

function mapSecondShotLieToLie(secondShotLie: LocalHoleLike['secondShotLie']): Extract<GirAttemptSource, 'fairway' | 'rough' | 'sand'> | null {
  if (secondShotLie === 'c' || secondShotLie === 'fairway') return 'fairway';
  if (secondShotLie === 'rough') return 'rough';
  if (secondShotLie === 'sand') return 'sand';
  return null;
}

function parsePositiveInt(value: unknown): number {
  const numeric = Number.parseInt(String(value ?? '0'), 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function deriveApproachLie(source: GirAttemptSource | null): 'fairway' | 'rough' | 'sand' | null {
  if (source === 'fairway' || source === 'rough' || source === 'sand') {
    return source;
  }

  return null;
}

function inferDirectGreenSource(hole: LocalHoleLike): DirectGreenSource | null {
  if (hole.par === 4 && hole.girAttemptSource === 'tee' && hole.girAttemptShotNumber === 1) {
    return 'tee';
  }

  if (hole.par === 5 && hole.girAttemptShotNumber === 2) {
    return 'second-shot';
  }

  return null;
}

export function normalizeHoleForSave<T extends LocalHoleLike>(hole: T, hints: HoleNormalizationHints = {}): T {
  const teePenalty = hints.teePenalty ?? '';
  const directGreenSource = hints.directGreenSource ?? inferDirectGreenSource(hole);
  const teePenaltyType = teePenalty === '1-retee' ? 'retee' : teePenalty === '1-drop' ? 'drop' : null;
  const secondShotPenalty = parsePositiveInt(hole.secondShotPenalty);
  const totalPenalty = parsePositiveInt(hole.penalty);

  let girAttemptSource: GirAttemptSource | null = hole.girAttemptSource ?? null;
  let girAttemptShotNumber: number | null = hole.girAttemptShotNumber ?? null;
  let girAttemptDistance: number | null = hole.girAttemptDistance ?? hole.proximity ?? null;
  let greenReachedOnShot: number | null = hole.greenReachedOnShot ?? null;

  if (hole.par === 3) {
    girAttemptSource = 'tee';
    girAttemptShotNumber = 1;
    girAttemptDistance = hole.holeDistance ?? hole.proximity ?? null;
    greenReachedOnShot = hole.gir === 'y' ? 1 : (hole.shotsToGreen != null ? 1 + hole.shotsToGreen : null);
  } else if (hole.par === 4) {
    if (directGreenSource === 'tee') {
      girAttemptSource = 'tee';
      girAttemptShotNumber = 1;
      girAttemptDistance = hole.holeDistance ?? hole.proximity ?? null;
      greenReachedOnShot = 1;
    } else if (teePenaltyType === 'retee') {
      girAttemptSource = 'retee';
      girAttemptShotNumber = 3;
      girAttemptDistance = hole.holeDistance ?? hole.proximity ?? null;
      greenReachedOnShot = hole.gir === 'y' ? 3 : (hole.shotsToGreen != null ? 3 + hole.shotsToGreen : null);
    } else if (teePenaltyType === 'drop') {
      girAttemptSource = 'drop';
      girAttemptShotNumber = 3;
      girAttemptDistance = hole.proximity ?? null;
      greenReachedOnShot = hole.gir === 'y' ? 3 : (hole.shotsToGreen != null ? 3 + hole.shotsToGreen : null);
    } else {
      girAttemptSource = mapFairwayToLie(hole.fairway) ?? 'unknown';
      girAttemptShotNumber = 2;
      girAttemptDistance = hole.proximity ?? null;
      greenReachedOnShot = hole.gir === 'y' ? 2 : (hole.shotsToGreen != null ? 2 + hole.shotsToGreen : null);
    }
  } else if (hole.par === 5) {
    if (directGreenSource === 'second-shot' || hole.secondShotLie === 'green') {
      girAttemptSource = mapFairwayToLie(hole.fairway) ?? 'unknown';
      girAttemptShotNumber = 2;
      girAttemptDistance = hole.secondShotDistance ?? hole.proximity ?? null;
      greenReachedOnShot = 2;
    } else if (hole.secondShotLie === 'na' || secondShotPenalty > 0) {
      girAttemptSource = 'drop';
      girAttemptShotNumber = 3;
      girAttemptDistance = hole.proximity ?? null;
      greenReachedOnShot = hole.gir === 'y' ? 3 : (hole.shotsToGreen != null ? 3 + hole.shotsToGreen : null);
    } else {
      girAttemptSource = mapSecondShotLieToLie(hole.secondShotLie) ?? 'unknown';
      girAttemptShotNumber = 3;
      girAttemptDistance = hole.proximity ?? null;
      greenReachedOnShot = hole.gir === 'y' ? 3 : (hole.shotsToGreen != null ? 3 + hole.shotsToGreen : null);
    }
  }

  const penaltyOrigin: PenaltyOrigin = teePenaltyType
    ? 'tee'
    : secondShotPenalty > 0
      ? 'second-shot'
      : totalPenalty > 0
        ? 'approach'
        : 'none';

  return {
    ...hole,
    proximity: girAttemptDistance ?? undefined,
    approachLie: deriveApproachLie(girAttemptSource),
    girAttemptSource,
    girAttemptShotNumber,
    girAttemptDistance,
    greenReachedOnShot,
    penaltyOrigin,
    approachMissLocation: hole.gir === 'y' ? undefined : hole.approachMissLocation,
    wedgeShotDistances: hole.gir === 'y' ? undefined : hole.wedgeShotDistances,
  } as T;
}