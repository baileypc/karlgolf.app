# GIR Metric Review

## Detailed Findings

### 1. Fairway % - PHP vs TypeScript Mismatch

**The problem:** Two different definitions of "fairway hit" exist in the codebase.

On the golf course, the app lets you mark fairway as Left, Center, or Right, all of which mean you hit the fairway. When the data is saved to the server, the `convertToAPIHole` function correctly translates all three to a simple `'y'` value.

The client-side stats calculator, `stats.ts`, checks for `'c'`, `'l'`, and `'r'` in addition to `'y'`. The server-side PHP calculator only checks for `'y'`.

**Real-world impact:** If a future export feature or data path bypasses `convertToAPIHole`, fairway percentages could differ between the dashboard (PHP/server) and CSV export (TypeScript/client). Currently it works because the conversion runs first, but it is fragile.

### 2. Putts per GIR - Calculated Server-Side, Missing Client-Side

**The problem:** The server calculates Putts-per-GIR, a key putting stat: average number of putts on holes where you hit the green. The TypeScript `RoundStats` type does not have a field for it, and the client-side `calculateRoundStats()` does not compute it.

**Real-world impact:** Client-side features such as export or in-round summary cannot show Putts-per-GIR, even though the dashboard can receive it from the server.

### 3. Penalty Strokes - Client Counts Penalty Holes, Not Total Strokes

**The problem:** On a hole where you take two penalty strokes, PHP correctly counts two penalty strokes. The TypeScript code only counts one penalty hole.

PHP tracks both:

- `penalties`: number of holes with penalties
- `totalPenaltyStrokes`: actual number of penalty strokes

TypeScript only tracks `penalties`.

**Real-world impact:** The dashboard checks `totalPenaltyStrokes` first and falls back to `penalties`, but the label always says "Penalty Strokes." If `totalPenaltyStrokes` is missing from the API response, the dashboard could show penalty-hole count under a penalty-stroke label.

### 4. `totalGirs` Field - Misnamed and Misleading

**The problem:** The `RoundStats` interface has a field called `totalGirs`, which sounds like it should mean "total number of greens hit in regulation." The code sets it to `totalHoles`.

**Real-world impact:** None directly, because the field is not currently used. It is a trap for future code changes. It should either be deleted, renamed to `totalHoles`, or corrected to mean what it says.

### 5. Scrambling - Extra Safety Check in PHP, Missing in TS

**The problem:** The PHP version of scrambling checks that par and score are positive before counting a scramble:

```php
if ($score > 0 && $par > 0 && $score <= $par) {
    $scrambles++;
}
```

The TypeScript version does not:

```ts
if (hole.score <= hole.par) {
  scrambles++;
}
```

**Real-world impact:** In normal play this should not matter because par is always 3-5 and score is always 1+. If corrupted or incomplete data slips through, TypeScript could falsely count a scramble.

### 6. Par 5 "On Green in 2" - Missing from GIR-by-Lie Stats

**The problem:** When you reach a par 5 green in two shots, the second shot's lie is `"green"`. The code maps approach lies like this:

| `secondShotLie` | Approach lie |
| --- | --- |
| `'c'` | `fairway` |
| `'rough'` | `rough` |
| `'sand'` | `sand` |
| `'green'` | `null` |

An "on in 2" par 5 counts toward overall GIR%, but it does not count in the "GIR by Lie" dashboard section.

**Real-world impact:** GIR-by-lie percentages can be slightly distorted because par-5 greens reached in two are excluded from that breakdown.

### 7. Par 3 Holes - Never Appear in GIR-by-Lie Stats

**The problem:** The code sets `approachLie: null` for all par 3s. This makes sense because a par 3 approach is from the tee box, not fairway/rough/sand, but it means par 3s are invisible in the GIR-by-lie breakdown.

**Real-world impact:** Overall GIR% remains correct, but GIR-by-lie only describes par 4 and par 5 approach lies.

### 8. "Bogey from Inside 150" - Counts 3-Putt Bogeys Too

**The problem:** The Tiger Five stat "bogey from inside 150 yards" fires whenever approach proximity is `<= 150` yards and the player makes bogey or worse.

Examples:

- Hit green from 140 yards, then 3-putt for bogey: counts
- Miss green from 140 yards, chip to 3 feet, 2-putt for bogey: counts

This is a valid interpretation, but it can blend approach, short-game, and putting failures into one number.

**Real-world impact:** A high "Bogey from <150yd" count can mean short-range approach problems, short-game problems, or putting problems. The stat alone does not identify which.

## Summary Table

| # | What | How wrong can it get? | Fix priority |
| --- | --- | --- | --- |
| 1 | Fairway % mismatch | Stats could differ between server and CSV if a data path bypasses normalization | Medium |
| 2 | No Putts-per-GIR in TS | Missing metric in exports | Low |
| 3 | Penalty strokes not totaled in TS | Wrong penalty count in CSV exports | Medium |
| 4 | `totalGirs` misnamed | Future developer confusion; currently dormant | Low |
| 5 | Scrambling safety check | Edge case on corrupted data | Low |
| 6 | Par 5 "on green" missing from GIR-by-lie | Slightly wrong GIR-by-lie percentages | Low |
| 7 | Par 3 invisible in GIR-by-lie | Incomplete picture of GIR sources | Low |
| 8 | Bogey-<150 semantics | Interpretation ambiguity, not a calculation bug | Note |

## Criticality Re-Evaluation

Question: Create a plan for all of these if they are critical and must be addressed or the app user will not have accurate metrics.

After careful re-evaluation: none of the eight findings produce wrong core metrics for the user in normal use. They are code-quality issues, edge-case robustness gaps, or feature-completeness differences between the client-side TypeScript calculator and the server-side PHP calculator.

The core stats engine, `stats-calculator.php`, is internally consistent, and the data pipeline preserves correctness:

```text
LocalHole -> convertToAPIHole -> store -> PHP recalculation -> dashboard
```

## Normal User Flow

In normal use:

1. The user tracks a round.
2. `convertToAPIHole` normalizes local data into API format.
3. The server stores the normalized hole data.
4. PHP recalculates stats from scratch.
5. The dashboard shows the PHP-calculated stats.

## Guest Flow

In guest use:

1. The user tracks a round locally.
2. Local stats use the `LocalHole` format.
3. The TypeScript CSV/export calculator handles both local and API fairway formats.

The two calculators should not disagree in the normal tracked-round pipeline because they are not operating on mismatched formats in the same path.

## Finding-by-Finding Verdict

| # | Issue | Produces wrong numbers? | Verdict |
| --- | --- | --- | --- |
| 1 | Fairway % TS vs PHP | No, because `convertToAPIHole` normalizes to `'y'` before PHP sees it; TS handles both formats | Not critical |
| 2 | Putts per GIR missing from TS | No for dashboard; yes as a missing export metric | Feature gap |
| 3 | Penalty strokes not totaled in TS | No for dashboard; CSV summary can show penalty-hole count instead of penalty-stroke count | Feature gap |
| 4 | `totalGirs` misnamed | No, field is unused | Dead code |
| 5 | Scrambling safety check | No for valid real data | Defensive gap |
| 6 | Par 5 "on green" excluded from GIR-by-lie | Minor; a subset of par-5 GIRs is excluded from one dashboard section | Small display gap |
| 7 | Par 3 invisible in GIR-by-lie | No; this is defensible because tee shots do not have fairway/rough/sand approach lies | Intentional or definition choice |
| 8 | Bogey-<150 semantics | No; valid interpretation, but label/documentation should clarify meaning | Design choice |

## Worth Fixing, Ranked by User Impact

1. **Par 5 "on green in 2" missing from GIR-by-lie:** If the player often reaches par 5s in two, the dashboard can understate the fairway/GIR-by-lie story. Overall GIR remains correct.
2. **CSV export missing Putts-per-GIR:** A coach cannot see this metric directly in exports even though the raw data exists.
3. **CSV export missing total penalty strokes:** The export can show penalty-hole count instead of total penalty strokes.
4. **Everything else:** Useful cleanup, but not required for accurate core user metrics.
