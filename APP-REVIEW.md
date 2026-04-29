based on the repo/docs, I do see a few things I’d question for high school and college players, especially around GIR logic, stat clarity, and coaching usefulness.

Also, my code-search results may be incomplete because the search tool only returns a limited set of matches. If you want to inspect more directly in GitHub UI, use GitHub code search in baileypc/karlgolf.app for terms like GIR, shotsToGreen, scrambling, and calculateRoundStats.

Short answer
The app looks solid overall, but I’d improve:

GIR definition / UX clarity
Penalty handling and stat labeling
Fairway stat granularity
Distance units and coaching relevance
Missing college/junior performance views
A couple of likely stat-model mismatches
What looks good
The app is clearly aimed at performance tracking, not just scorekeeping. It tracks GIR, fairways, putts, penalties, scrambling, and approach distance, and it explicitly targets high school/college players. README.md and the scoring docs show intentional golf logic, including stricter GIR auto-denial after certain tee penalties. src/lib/stats.ts also computes core rollup stats in a straightforward way, and TrackRoundPage.tsx appears to normalize richer local shot-entry data into API hole data. The docs also show thoughtfulness around Par 5 flows and penalty branches.

What I think is wrong or potentially off
1. GIR may be too rigid or too confusing for the target user
Your docs say:

Par 4 + any tee penalty auto-denies GIR
Par 5 + tee penalty ≥ 2 auto-denies GIR
“strict PGA definition” is the basis
That may be technically defensible, but for junior / college development, players and coaches usually care about two separate ideas:

Official GIR
“Green hit with a chance” / adjusted GIR / expected GIR
Right now the app seems to force everything into a single GIR number. That can understate performance for players who hit a quality recovery after a penalty and still reach the green in a way a coach would want to evaluate. The docs explicitly encode auto-denial logic in the scoring flow. For player development, that is often too blunt.

Improvement: track both:

Official GIR
Adjusted GIR or Green Hit in Scoring Position
That would be much more useful for recruiting/coaching conversations.

2. Penalties are under-modeled in the summary stats
In src/lib/stats.ts, penalties is just a count of holes with a penalty, not clearly total penalty strokes. But your types include totalPenaltyStrokes?, and your older archived code distinguished penalty stroke totals more explicitly. That means the dashboard may tell a player “2 penalties” when the real damage was 4 strokes. For competitive players, that difference matters a lot.

Why this matters:
A coach usually wants:

penalty incidents
total penalty strokes
tee-ball penalty rate
penalty strokes per round
Improvement: separate:

penaltyEvents
penaltyStrokes
teeShotPenaltyStrokes
approachPenaltyStrokes
Right now the stats layer looks too shallow for that use case.

3. Fairway stats may be too optimistic / too lossy
The README says left/center/right all count as fairway hits, and src/lib/stats.ts only stores fairway as yes/no in the aggregate model. But TrackRoundPage.tsx locally tracks richer outcomes like:

l
c
r
rough
sand
na
For high school and college players, dispersion tendency is very important. “Fairway hit” alone is not enough. A player missing in the same direction all day is giving you highly actionable information.

Improvement: dashboard should show:

left miss %
right miss %
short-sided miss tendency if you collect that
penalty off tee %
playable miss % vs unplayable miss %
You already have pieces of that, but the top-level stats appear to collapse too much.

4. Scrambling is probably too simplistic
src/lib/stats.ts defines scramble as:

missed GIR
score <= par
That is the standard headline definition, but for player development you probably also want:

save % by miss location
save % by lie (rough/sand/fairway)
save % from inside 30 yds / 30–60 / 60–100
bogey avoidance after missed GIR
High school and college players often improve faster from these breakdowns than from one global scrambling percentage.

Improvement: add segmented scrambling:

after missed wedge
after missed long approach
bunker save %
bogey avoidance %
double-or-worse avoidance %
That would make the app much more coach-friendly.

5. “Approach distance” wording looks ambiguous
The README says:

“Approach Distance (optional - feet from hole)” But exports label:
Approach Dist (yds) in src/lib/export.ts
That’s a real inconsistency.

For golf stats, “approach distance” usually means one of two different things:

distance of the approach shot before hitting it
proximity to hole after the approach finishes
Your code/types/docs seem to mix those ideas:

approachDistance
proximity
“feet from hole”
export says yards
For serious players, this is a big deal because 150 yards in and 18 feet after are completely different metrics.

Improvement: split clearly into:

Approach Shot Distance = yards to hole before shot
Proximity to Hole = feet after approach
use one label consistently everywhere
Right now this is one of the biggest product/UX issues I see.

6. Validation may not fully match real golf edge cases
src/lib/validation.ts requires shotsToGreen when GIR is n, and also requires putt distances. That’s reasonable, but for real use:

chip-ins
holes with zero putts
conceded practice rounds
holed approaches
bunker hole-outs
penalties followed by green hit can create exceptions.
Your scoring docs show some of those edge cases are handled, especially par-5 flows and albatross branches, but I’d still worry the validation and aggregate model are not fully aligned with all scoring flows.

Improvement: explicitly test:

hole-out from off the green with 0 putts
par 3 miss + chip-in par
par 4 penalty + recovery green + 1-putt
par 5 birdie after layup
bunker hole-out
9-hole rounds merged into 18-hole stats
Improvements I would make for the target audience
Priority 1: Add “coach mode” metrics
For high school and college players, I’d add these first:

Scoring average by 9 / 18
Par 3 / Par 4 / Par 5 scoring average
Double bogey or worse avoidance
Penalty strokes per round
3-putt avoidance
One-putt %
Up-and-down %
Sand save %
GIR by approach yardage bucket
Fairway + GIR correlation
Birdie chances created
Conversion rate inside 15 ft
Strokes lost to penalties
Strokes lost on par 5s
These are much more useful in competitive player development than just total GIR and total putts.

Priority 2: Separate official stats from development stats
I’d explicitly show two sections:

Official / standard

GIR
fairways
putts
scrambling
Development / coaching

adjusted GIR
quality tee ball %
bogey avoidance
penalty avoidance
approach proximity by yardage
make % by putt range
That avoids arguments about definitions while still helping the player improve.

Priority 3: Add distance buckets
College coaches care much more about trends like:

50–75 yds
75–100
100–125
125–150
150–175
175–200+
par-3 scoring by distance
Your types already hint at richer shot-distance capture, especially for par 5s and wedge shots. That’s a big opportunity.

Priority 4: Better season / tournament views
Your TODOs mention season management, and I think that’s exactly right.

For juniors/college players, I’d want:

season averages
last 5 rounds
tournament rounds only
practice vs tournament filter
home course vs away
weather/wind notes
course rating / slope / tees played
Without tees/course difficulty, raw score averages can be misleading.

Specific repo-level concerns I’d flag
A. Stats layer may be too thin for the richness of the input model
TrackRoundPage.tsx appears to collect more nuanced shot outcome data than src/lib/stats.ts ultimately reports. That means you may be collecting useful information but not converting it into meaningful analytics.

Recommendation: expand calculateRoundStats() or add a dedicated analytics transformer.

B. Docs and implementation terminology need tightening
You have some terminology mismatch across docs/types/export:

approach distance vs proximity
feet vs yards
fairway result vs tee shot result
penalty event vs penalty stroke
That can confuse users and make exported data less trustworthy.

C. Search surfaced archived files and old logic
The repo contains archived material under ._files/_ARCHIVES, and some search hits came from there. That’s not inherently bad, but it increases the chance of confusion during maintenance. GitHub code search results here may be incomplete and mixed with archive content. You can browse more results in GitHub code search scoped to the repo.

Recommendation: exclude archives from active searches or move them outside the repo if you don’t need them in normal development.

My overall verdict
Is anything “wrong” with the app?
Not fundamentally. It seems well thought out and pretty mature.

But for high school and college golfers, it is still a bit too close to a score tracker and not quite enough of a coaching analytics tool.

The two biggest issues I’d prioritize are:

Clarify and split GIR definitions
Improve stat depth and labeling, especially penalties and approach metrics
If I were prioritizing the next 5 changes
Fix terminology: approach distance vs proximity, feet vs yards
Add penalty strokes as a first-class stat
Add adjusted GIR alongside official GIR
Add directional miss / playable miss / penalty miss off the tee
Add distance-bucket analytics for approaches and wedges

---

## Architectural follow-ups (post-2026-04-20 bugfixes)

Two recent bugs exposed weaknesses in how rounds are identified and saved. The
immediate fixes are in place; the durable fixes are tracked here.

### Known issue: array-index round identity

Rounds are referenced by 1-indexed position in the user's `rounds.json`
(`roundNumber`) rather than a stable ID. Any operation that renumbers or
reorders rounds — editing, deleting, merging — is ambiguous and leads to
duplicates or mis-targets. The recent "edit duplicates the round" bug was a
symptom: if the client didn't send `replaceRoundNumber`, the server's
auto-merge couldn't match a completed round and fell through to "create new".

Desired state:

- Each round gets a stable UUID (`roundId`) generated client-side at first
  save and never changed.
- The save endpoint takes an explicit `op: 'create' | 'update' | 'resume'`
  instead of inferring intent from whether `roundId` / `mergeIntoRoundId` /
  `replaceRoundNumber` happen to be present.
- `roundNumber` becomes a derived display value, not the primary key.

### Known issue: non-idempotent per-hole saves

`TrackRoundPage.tsx` saves after every hole. If the client retries (slow
network, backgrounded tab), the server has no idempotency key and may treat
the retry as a new round. A `clientRequestId` or the above stable `roundId`
would make retries safe.

### Known issue: score formula vs. stored-data mismatch for legacy penalty cases

The migration script (`scripts/migrate-round-data.mjs`) only recomputes par-4
/ par-5 tee-penalty + GIR=n holes, because that's the only case the current
fix changes. Par-5 + 2nd-shot hazard uses `base = 2`, which undercounts under
strict USGA stroke-and-distance (should be `base = par - 2 + 1 = 4`). Decide
the intended convention (drop vs. stroke-and-distance) and align the formula
+ UI copy before further scoring fixes.
