#!/usr/bin/env node
/**
 * One-shot migration for two bugs:
 *   1. Scoring undercounted par-4/par-5 tee-penalty holes (GIR=n).
 *      Recompute hole.score using the corrected baseShotsBeforeRecovery.
 *   2. "Edit round" on the dashboard duplicated rounds. Orphan duplicates
 *      (completed:true, no lastUpdated) are safe to remove. Ambiguous
 *      duplicates (both have lastUpdated) are *reported*, not removed.
 *
 * Safe by default: dry-run. Pass --apply to write.
 *
 * Usage:
 *   node scripts/migrate-round-data.mjs [path/to/data] [--apply]
 *
 * Defaults to ./dist/data.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const applyFlag = args.includes('--apply');
const dataRoot = args.find((a) => !a.startsWith('--')) ?? 'dist/data';

const SKIP_DIRS = new Set(['admin', 'rate-limits']);

/**
 * Recompute score for a single API hole using the corrected formula.
 * Scope: only recompute holes that (a) had a penalty and (b) were the cases
 * fixed in this migration — par-4/par-5 tee-penalty with GIR missed. Other
 * holes are left alone since their prior score was computed correctly.
 *
 * Approach: apply the delta directly rather than reconstructing all inputs.
 * Old bug: baseShotsBeforeRecovery was hardcoded to 1 for tee-penalty cases.
 * Fix:     base = par - 2 + 1 (par 4) or par - 2 (par 5), both = 3.
 * Delta:   new_score = old_score + (3 - 1) = old_score + 2.
 *
 * This avoids the previous Bug 1 where wedgeShotDistances (capped at 3 in
 * the app) was used to reconstruct localShotsToGreen, which would be wrong
 * for any hole with more than 3 shots to green.
 */
function recomputeScore(h) {
  const par = Number(h.par);
  if (!par || !Number.isFinite(par)) return h.score;
  if (h.gir !== 'n') return h.score;
  if (h.penalty == null) return h.score; // no penalty → unchanged formula was correct

  // Tee penalty case: API stores fairway='n' + approachLie=null (from local fairway='na').
  const girDeniedByTeePenalty = (par === 4 || par === 5)
    && h.fairway === 'n'
    && (h.approachLie == null);
  if (!girDeniedByTeePenalty) return h.score; // other penalty cases unchanged for now

  // Old base = 1 (buggy hardcode), new base = 3 (correct for both par 4 and par 5).
  const BASE_OLD = 1;
  const BASE_NEW = 3;
  return Number(h.score) + (BASE_NEW - BASE_OLD);
}

function fingerprintRound(round) {
  const holesSig = (round.holes || []).map((h) => [
    h.holeNumber, h.par, h.putts, h.gir, h.fairway,
    h.shotsToGreen ?? '', h.secondShotLie ?? '',
    h.approachMissLocation ?? '', h.penalty ?? '',
  ].join(':')).join('|');
  return crypto.createHash('md5')
    .update([round.courseName, round.date, holesSig].join('::'))
    .digest('hex');
}

function recomputeRoundStats(round) {
  const valid = (round.holes || []).filter((h) => h && h.score > 0);
  const totalScore = valid.reduce((s, h) => s + (Number(h.score) || 0), 0);
  const totalPar = valid.reduce((s, h) => s + (Number(h.par) || 0), 0);
  if (round.stats) {
    round.stats.totalScore = totalScore;
    round.stats.totalPar = totalPar;
    round.stats.toPar = totalScore - totalPar;
  }
}

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rounds = JSON.parse(raw);
  if (!Array.isArray(rounds)) return null;

  const report = { file: filePath, scoreFixes: [], removed: [], ambiguousDupes: [] };

  for (const round of rounds) {
    for (const h of round.holes || []) {
      const newScore = recomputeScore(h);
      if (newScore !== h.score) {
        report.scoreFixes.push({
          round: round.roundNumber,
          course: round.courseName,
          hole: h.holeNumber,
          par: h.par,
          from: h.score,
          to: newScore,
        });
        h.score = newScore;
      }
    }
    recomputeRoundStats(round);
  }

  // Dedup: group by (course, date). Orphans = completed + no lastUpdated + has sibling.
  // `lastUpdated` is set only via the mergeRound code path, so a completed round
  // without it AND a sibling from the same day is almost certainly an edit-bug artifact.
  const byCourseDate = new Map();
  rounds.forEach((r, idx) => {
    const key = `${r.courseName}::${r.date}`;
    if (!byCourseDate.has(key)) byCourseDate.set(key, []);
    byCourseDate.get(key).push({ idx, round: r });
  });

  const toRemoveIdx = new Set();
  for (const [, group] of byCourseDate) {
    if (group.length < 2) continue;
    const hasAnchor = group.some(({ round }) => round.lastUpdated);
    if (hasAnchor) {
      for (const { idx, round } of group) {
        if (!round.lastUpdated && round.completed) {
          toRemoveIdx.add(idx);
          report.removed.push({
            idx,
            round: round.roundNumber,
            course: round.courseName,
            date: round.date,
            reason: 'orphan duplicate (same course+date, no lastUpdated)',
          });
        }
      }
    }

    const remaining = group.filter(({ idx }) => !toRemoveIdx.has(idx));
    if (remaining.length > 1) {
      // Surviving multiple rounds on same course+date — let user decide
      const fps = new Set(remaining.map(({ round }) => fingerprintRound(round)));
      report.ambiguousDupes.push({
        course: remaining[0].round.courseName,
        date: remaining[0].round.date,
        note: fps.size === 1 ? 'identical hole data' : 'differing hole data (multiple edits)',
        rounds: remaining.map(({ round }) => ({
          roundNumber: round.roundNumber,
          timestamp: round.timestamp,
          lastUpdated: round.lastUpdated ?? null,
          totalScore: round.stats?.totalScore,
        })),
      });
    }
  }

  // Remove orphans, reindex roundNumber
  const kept = rounds.filter((_, idx) => !toRemoveIdx.has(idx));
  kept.forEach((r, i) => { r.roundNumber = i + 1; });

  if (applyFlag && (report.scoreFixes.length || report.removed.length)) {
    fs.writeFileSync(filePath, JSON.stringify(kept, null, 4));
  }

  return report;
}

function main() {
  if (!fs.existsSync(dataRoot)) {
    console.error(`Data root not found: ${dataRoot}`);
    process.exit(1);
  }

  const dirs = fs.readdirSync(dataRoot)
    .filter((d) => !SKIP_DIRS.has(d))
    .map((d) => path.join(dataRoot, d))
    .filter((p) => fs.statSync(p).isDirectory());

  console.log(`Migration mode: ${applyFlag ? 'APPLY (writing changes)' : 'DRY RUN (no changes)'}`);
  console.log(`Scanning: ${dataRoot}\n`);

  let totalScoreFixes = 0, totalRemoved = 0, totalAmbiguous = 0;

  for (const dir of dirs) {
    const roundsFile = path.join(dir, 'rounds.json');
    if (!fs.existsSync(roundsFile)) continue;

    const rep = migrateFile(roundsFile);
    if (!rep) continue;

    const shortUser = path.basename(dir).slice(0, 12) + '…';

    if (rep.scoreFixes.length) {
      console.log(`[${shortUser}] Score corrections (${rep.scoreFixes.length}):`);
      rep.scoreFixes.forEach((f) => {
        console.log(`  R${f.round} ${f.course} Hole ${f.hole} (par ${f.par}): ${f.from} → ${f.to}`);
      });
    }
    if (rep.removed.length) {
      console.log(`[${shortUser}] Orphan duplicates removed (${rep.removed.length}):`);
      rep.removed.forEach((r) => {
        console.log(`  R${r.round} ${r.course} ${r.date} — ${r.reason}`);
      });
    }
    if (rep.ambiguousDupes.length) {
      console.log(`[${shortUser}] Ambiguous duplicates — REVIEW MANUALLY:`);
      rep.ambiguousDupes.forEach((d) => {
        console.log(`  ${d.course} ${d.date}${d.note ? ' — ' + d.note : ''}`);
        d.rounds.forEach((r) => {
          console.log(`    R${r.roundNumber} ts=${r.timestamp} lastUpd=${r.lastUpdated ?? 'NONE'}${r.totalScore != null ? ' total=' + r.totalScore : ''}`);
        });
      });
    }

    totalScoreFixes += rep.scoreFixes.length;
    totalRemoved += rep.removed.length;
    totalAmbiguous += rep.ambiguousDupes.length;
  }

  console.log(`\nSummary: ${totalScoreFixes} score fix(es), ${totalRemoved} orphan(s) removed, ${totalAmbiguous} ambiguous case(s) for review.`);
  if (!applyFlag) console.log(`\nRe-run with --apply to persist changes.`);
}

main();
