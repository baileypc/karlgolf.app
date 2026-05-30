#!/usr/bin/env node
/**
 * Backfill canonical GIR fields into legacy saved rounds.
 *
 * Safe by default: dry run only. Pass --apply to write changes.
 * On apply, a timestamped backup is created next to each modified rounds file.
 *
 * Usage:
 *   node scripts/backfill-canonical-hole-fields.mjs [dataRoot] [--apply] [--user <hash>]
 *
 * Defaults:
 *   dataRoot = ./data
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const applyFlag = args.includes('--apply');
const userIndex = args.indexOf('--user');
const targetUserHash = userIndex >= 0 ? args[userIndex + 1] : null;
const positionalArgs = args.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  if (userIndex >= 0 && index === userIndex + 1) return false;
  if (userIndex >= 0 && index === userIndex) return false;
  return true;
});
const dataRoot = positionalArgs[0] ?? 'data';

const SKIP_DIRS = new Set(['admin', 'rate-limits']);

function positiveInt(value) {
  const numeric = Number.parseInt(String(value ?? '0'), 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function positiveNumberOrNull(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function getTotalPenaltyStrokes(hole) {
  const penaltyStrokes = positiveInt(hole.penaltyStrokes);
  if (penaltyStrokes > 0) return penaltyStrokes;

  const penaltyText = hole.penalty;
  if (typeof penaltyText === 'string') {
    const numeric = positiveInt(penaltyText);
    if (numeric > 0) return numeric;
    if (penaltyText.trim() !== '') return 1;
  }

  return 0;
}

function hasCanonicalFields(hole) {
  return hole.girAttemptSource != null
    || hole.girAttemptShotNumber != null
    || hole.girAttemptDistance != null
    || hole.greenReachedOnShot != null
    || hole.penaltyOrigin != null;
}

function deriveApproachLie(source) {
  if (source === 'fairway' || source === 'rough' || source === 'sand') {
    return source;
  }

  return null;
}

function inferGreenReachedOnShot(hole, girAttemptShotNumber) {
  if (!girAttemptShotNumber || !Number.isFinite(girAttemptShotNumber)) {
    return null;
  }

  if (hole.gir === 'y') {
    return girAttemptShotNumber;
  }

  const shotsToGreen = positiveInt(hole.shotsToGreen);
  if (shotsToGreen > 0) {
    return girAttemptShotNumber + shotsToGreen;
  }

  const score = Number(hole.score);
  const putts = Number(hole.putts);
  if (Number.isFinite(score) && Number.isFinite(putts)) {
    const reachedOnShot = score - putts;
    return reachedOnShot > girAttemptShotNumber ? reachedOnShot : null;
  }

  return null;
}

function inferReachedOnShotFromScore(hole) {
  const score = Number(hole.score);
  const putts = Number(hole.putts);
  if (!Number.isFinite(score) || !Number.isFinite(putts)) {
    return null;
  }

  const reachedOnShot = score - putts;
  return reachedOnShot > 0 ? reachedOnShot : null;
}

function buildCanonicalHole(hole, canonical) {
  const nextHole = { ...hole };
  nextHole.girAttemptSource = canonical.girAttemptSource;
  nextHole.girAttemptShotNumber = canonical.girAttemptShotNumber;
  nextHole.girAttemptDistance = canonical.girAttemptDistance;
  nextHole.greenReachedOnShot = canonical.greenReachedOnShot;

  if (canonical.penaltyOrigin) {
    nextHole.penaltyOrigin = canonical.penaltyOrigin;
  }

  const nextApproachLie = deriveApproachLie(canonical.girAttemptSource);
  if (nextApproachLie !== hole.approachLie) {
    nextHole.approachLie = nextApproachLie;
  }

  if (canonical.girAttemptDistance != null) {
    nextHole.proximity = canonical.girAttemptDistance;
  }

  if (hole.gir === 'y') {
    delete nextHole.approachMissLocation;
    delete nextHole.wedgeShotDistance;
    delete nextHole.wedgeShotDistances;
  }

  return nextHole;
}

function inferCanonicalFields(hole) {
  const par = Number(hole.par);
  const totalPenalty = getTotalPenaltyStrokes(hole);
  const secondShotPenalty = positiveInt(hole.secondShotPenalty);
  const holeDistance = positiveNumberOrNull(hole.holeDistance);
  const proximity = positiveNumberOrNull(hole.proximity);

  if (![3, 4, 5].includes(par)) {
    return { status: 'skipped', reason: 'unsupported par value' };
  }

  if (par === 3) {
    const girAttemptShotNumber = 1;
    return {
      status: 'updated',
      canonical: {
        girAttemptSource: 'tee',
        girAttemptShotNumber,
        girAttemptDistance: holeDistance ?? proximity,
        greenReachedOnShot: inferGreenReachedOnShot(hole, girAttemptShotNumber),
        penaltyOrigin: totalPenalty > 0 ? undefined : 'none',
      },
    };
  }

  if (par === 4) {
    if (hole.gir === 'y' && positiveInt(hole.shotsToGreen) === 1 && totalPenalty === 0) {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: 'tee',
          girAttemptShotNumber: 1,
          girAttemptDistance: holeDistance ?? proximity,
          greenReachedOnShot: 1,
          penaltyOrigin: 'none',
        },
      };
    }

    if (totalPenalty > 0 && hole.fairway === 'n') {
      const reachedOnShot = inferReachedOnShotFromScore(hole);
      if (hole.approachLie == null || hole.approachLie === 'fairway' || reachedOnShot === 3) {
        return {
          status: 'updated',
          canonical: {
            girAttemptSource: 'unknown',
            girAttemptShotNumber: 3,
            girAttemptDistance: holeDistance ?? proximity,
            greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
            penaltyOrigin: 'tee',
          },
        };
      }

      return {
        status: 'skipped',
        reason: 'par 4 penalty hole is ambiguous between tee-penalty and lie-based approach penalty',
      };
    }

    if (hole.fairway === 'y' || hole.approachLie === 'fairway') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: 'fairway',
          girAttemptShotNumber: 2,
          girAttemptDistance: proximity,
          greenReachedOnShot: inferGreenReachedOnShot(hole, 2),
          penaltyOrigin: totalPenalty > 0 ? 'approach' : 'none',
        },
      };
    }

    if (hole.approachLie === 'rough' || hole.approachLie === 'sand') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: hole.approachLie,
          girAttemptShotNumber: 2,
          girAttemptDistance: proximity,
          greenReachedOnShot: inferGreenReachedOnShot(hole, 2),
          penaltyOrigin: totalPenalty > 0 ? 'approach' : 'none',
        },
      };
    }

    if (hole.fairway === 'n') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: 'unknown',
          girAttemptShotNumber: 2,
          girAttemptDistance: proximity,
          greenReachedOnShot: inferGreenReachedOnShot(hole, 2),
          penaltyOrigin: 'none',
        },
      };
    }

    return {
      status: 'skipped',
      reason: 'par 4 hole does not have enough legacy lie detail to infer canonical GIR attempt',
    };
  }

  if (secondShotPenalty > 0 || hole.secondShotLie === 'hazard') {
    return {
      status: 'updated',
      canonical: {
        girAttemptSource: 'drop',
        girAttemptShotNumber: 3,
        girAttemptDistance: proximity,
        greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
        penaltyOrigin: 'second-shot',
      },
    };
  }

  if (hole.secondShotLie === 'green') {
    if (hole.fairway === 'y' || hole.approachLie === 'fairway') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: 'fairway',
          girAttemptShotNumber: 2,
          girAttemptDistance: positiveNumberOrNull(hole.secondShotDistance) ?? proximity,
          greenReachedOnShot: 2,
          penaltyOrigin: totalPenalty > 0 ? 'approach' : 'none',
        },
      };
    }

    if (hole.approachLie === 'rough' || hole.approachLie === 'sand') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: hole.approachLie,
          girAttemptShotNumber: 2,
          girAttemptDistance: positiveNumberOrNull(hole.secondShotDistance) ?? proximity,
          greenReachedOnShot: 2,
          penaltyOrigin: totalPenalty > 0 ? 'approach' : 'none',
        },
      };
    }

    return {
      status: 'skipped',
      reason: 'par 5 second-shot green hole is missing legacy fairway/lie detail',
    };
  }

  if (!hole.secondShotLie && totalPenalty === 0) {
    if (hole.fairway === 'y' || hole.approachLie === 'fairway') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: 'fairway',
          girAttemptShotNumber: 3,
          girAttemptDistance: proximity,
          greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
          penaltyOrigin: 'none',
        },
      };
    }

    if (hole.approachLie === 'rough' || hole.approachLie === 'sand') {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: hole.approachLie,
          girAttemptShotNumber: 3,
          girAttemptDistance: proximity,
          greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
          penaltyOrigin: 'none',
        },
      };
    }
  }

  if (hole.secondShotLie === 'fairway' || hole.secondShotLie === 'rough' || hole.secondShotLie === 'sand') {
    if (
      totalPenalty > 0
      && positiveNumberOrNull(hole.secondShotDistance) != null
      && holeDistance != null
      && positiveNumberOrNull(hole.secondShotDistance) >= holeDistance
    ) {
      return {
        status: 'updated',
        canonical: {
          girAttemptSource: 'unknown',
          girAttemptShotNumber: 3,
          girAttemptDistance: positiveNumberOrNull(hole.secondShotDistance) ?? proximity,
          greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
          penaltyOrigin: 'tee',
        },
      };
    }

    if (totalPenalty > 0) {
      return {
        status: 'skipped',
        reason: 'par 5 penalty hole with second-shot lie data is ambiguous between tee and approach penalties',
      };
    }

    return {
      status: 'updated',
      canonical: {
        girAttemptSource: hole.secondShotLie,
        girAttemptShotNumber: 3,
        girAttemptDistance: proximity,
        greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
        penaltyOrigin: 'none',
      },
    };
  }

  if (hole.approachLie === 'fairway' || hole.approachLie === 'rough' || hole.approachLie === 'sand') {
    return {
      status: 'updated',
      canonical: {
        girAttemptSource: hole.approachLie,
        girAttemptShotNumber: 3,
        girAttemptDistance: proximity,
        greenReachedOnShot: inferGreenReachedOnShot(hole, 3),
        penaltyOrigin: totalPenalty > 0 ? 'approach' : 'none',
      },
    };
  }

  return {
    status: 'skipped',
    reason: 'par 5 hole does not have enough legacy second-shot detail to infer canonical GIR attempt',
  };
}

function migrateRoundsFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rounds = JSON.parse(raw);
  if (!Array.isArray(rounds)) {
    return null;
  }

  const report = {
    filePath,
    roundsScanned: 0,
    holesScanned: 0,
    holesUpdated: 0,
    holesSkipped: [],
    alreadyCanonical: 0,
  };

  const nextRounds = rounds.map((round) => {
    report.roundsScanned += 1;
    const nextRound = { ...round };
    const holes = Array.isArray(round.holes) ? round.holes : [];
    nextRound.holes = holes.map((hole) => {
      report.holesScanned += 1;

      if (hasCanonicalFields(hole)) {
        report.alreadyCanonical += 1;
        return hole;
      }

      const inferred = inferCanonicalFields(hole);
      if (inferred.status === 'skipped') {
        report.holesSkipped.push({
          roundNumber: round.roundNumber ?? null,
          courseName: round.courseName ?? 'Unknown Course',
          holeNumber: hole.holeNumber ?? null,
          par: hole.par ?? null,
          reason: inferred.reason,
        });
        return hole;
      }

      report.holesUpdated += 1;
      return buildCanonicalHole(hole, inferred.canonical);
    });

    return nextRound;
  });

  const changed = JSON.stringify(rounds) !== JSON.stringify(nextRounds);
  return { changed, report, rounds: nextRounds };
}

function getTargetDirectories(rootPath, userHash) {
  if (userHash) {
    const singleUserDir = path.join(rootPath, userHash);
    return fs.existsSync(singleUserDir) ? [singleUserDir] : [];
  }

  return fs.readdirSync(rootPath)
    .filter((name) => !SKIP_DIRS.has(name))
    .map((name) => path.join(rootPath, name))
    .filter((entryPath) => fs.statSync(entryPath).isDirectory());
}

function makeBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.${timestamp}.bak`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function main() {
  if (userIndex >= 0 && !targetUserHash) {
    console.error('Missing value for --user');
    process.exit(1);
  }

  if (!fs.existsSync(dataRoot)) {
    console.error(`Data root not found: ${dataRoot}`);
    process.exit(1);
  }

  const targetDirectories = getTargetDirectories(dataRoot, targetUserHash);
  if (targetDirectories.length === 0) {
    console.error(targetUserHash
      ? `No user directory found for ${targetUserHash}`
      : `No user directories found under ${dataRoot}`);
    process.exit(1);
  }

  console.log(`Mode: ${applyFlag ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Root: ${dataRoot}`);
  if (targetUserHash) {
    console.log(`User: ${targetUserHash}`);
  }
  console.log('');

  let filesChanged = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalCanonical = 0;

  for (const directory of targetDirectories) {
    const roundsFile = path.join(directory, 'rounds.json');
    if (!fs.existsSync(roundsFile)) {
      continue;
    }

    const result = migrateRoundsFile(roundsFile);
    if (!result) {
      continue;
    }

    const userLabel = path.basename(directory);
    const { changed, report, rounds } = result;
    totalUpdated += report.holesUpdated;
    totalSkipped += report.holesSkipped.length;
    totalCanonical += report.alreadyCanonical;

    console.log(`[${userLabel}] rounds=${report.roundsScanned} holes=${report.holesScanned} updated=${report.holesUpdated} skipped=${report.holesSkipped.length} alreadyCanonical=${report.alreadyCanonical}`);

    if (report.holesSkipped.length > 0) {
      report.holesSkipped.slice(0, 10).forEach((item) => {
        console.log(`  skipped R${item.roundNumber ?? '?'} hole ${item.holeNumber ?? '?'} (${item.courseName}) - ${item.reason}`);
      });
      if (report.holesSkipped.length > 10) {
        console.log(`  ... ${report.holesSkipped.length - 10} more skipped hole(s)`);
      }
    }

    if (applyFlag && changed) {
      const backupPath = makeBackup(roundsFile);
      fs.writeFileSync(roundsFile, `${JSON.stringify(rounds, null, 4)}\n`);
      filesChanged += 1;
      console.log(`  backup: ${backupPath}`);
      console.log('  wrote updated rounds.json');
    }
  }

  console.log('');
  console.log(`Summary: filesChanged=${filesChanged}, holesUpdated=${totalUpdated}, holesSkipped=${totalSkipped}, alreadyCanonical=${totalCanonical}`);
  if (!applyFlag) {
    console.log('Re-run with --apply to persist changes.');
  }
}

main();