// Karl's GIR - Validation (TypeScript)
// Extracted from shared-utils.js

import type { Hole } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateHoleData(holeData: Partial<Hole>, par: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!holeData.score || holeData.score < 1) {
    errors.push({ field: 'score', message: 'Score is required' });
  }

  if (!holeData.gir) {
    errors.push({ field: 'gir', message: 'GIR (Green in Regulation) is required' });
  }

  if (holeData.gir === 'n' && !holeData.shotsToGreen) {
    errors.push({ field: 'shotsToGreen', message: 'Shots to Reach Green is required when GIR is No' });
  }

  if (par === 3 && holeData.gir === 'n' && holeData.shotsToGreen === 1) {
    errors.push({ field: 'shotsToGreen', message: 'For Par 3, Shots to Reach Green cannot be 1' });
  }

  if (!holeData.puttDistances || holeData.puttDistances.length === 0) {
    errors.push({ field: 'puttDistances', message: 'At least one putt distance is required' });
  }

  if (holeData.puttDistances) {
    const invalidPutts = holeData.puttDistances.some((p, i, arr) => {
      const val = parseFloat(String(p));
      if (isNaN(val) || val < 0) return true;
      // Only last putt can have decimals
      if (i < arr.length - 1 && val !== Math.floor(val)) return true;
      return false;
    });

    if (invalidPutts) {
      errors.push({
        field: 'puttDistances',
        message: 'Putt distances must be valid numbers (decimals only allowed for last putt)',
      });
    }
  }

  if (par !== 3 && holeData.fairway === null) {
    errors.push({ field: 'fairway', message: 'Fairway Hit is required for Par 4 and Par 5' });
  }

  if (par !== 3 && holeData.fairway !== 'y' && !holeData.teeShotResult) {
    errors.push({
      field: 'teeShotResult',
      message: 'Tee Shot Result is required when Fairway is not hit',
    });
  }

  return errors;
}
