# Karl Golf GIR - Full Code Review

Review date: 2026-04-29
Reviewer: Codex
Repo scope reviewed: `src/`, `api/`, `admin/`, `static/`, `mobile/`, deployment scripts, package config, and product docs. Generated `dist/` was treated as build output except where tracked artifacts create repo hygiene risk.

## Executive Summary

Karl Golf GIR is a mobile-first golf performance tracker for a serious golfer, especially a high-school or college player building repeatable performance data. The product goal is clear: make in-round stat capture fast enough to use on the course, then turn hole-level data into coach-relevant trends such as GIR, fairways, putting, penalties, scrambling, approach buckets, par-5 decisions, and "Tiger Five" mistake avoidance.

The app has strong foundations: React/Vite frontend, PHP JSON-file API, guest mode, registered account sync, GPS course lookup, PWA/mobile direction, and a dashboard that already goes beyond basic scorekeeping. The main concern is not ambition; it is trust. A golfer and coach must be able to trust that a saved round is durable, that GIR and penalty stats are definitionally correct, and that account data is protected.

Current risk level: **High before further production growth**.

The most urgent issues are:

| Priority | Area | Risk |
|---|---|---|
| P0 | Security | API CORS reflects any origin with credentials while production sessions use `SameSite=None`; this creates CSRF/cross-origin account-data risk. |
| P0 | Security/Admin | Admin auth initializes hard-coded default credentials, lacks rate limiting, and some admin endpoints expose debug settings/log artifacts. |
| P0 | Guest mode | Guest users can track holes, but ending/pausing a 9+ hole guest round calls authenticated save APIs and will fail. |
| P0 | Stat correctness | Penalty auto-denied GIR can still be stored as `gir: 'y'`, corrupting the core GIR number. |
| P0 | Data integrity | Round saves use non-atomic read-modify-write and mutable `roundNumber` identity, creating duplicate/lost-round risk under retries or concurrent requests. |
| P1 | Dashboard truth | Cumulative dashboard stats include incomplete/paused rounds, even when the UI says stats require a completed 9-hole round. |
| P1 | PWA/mobile | Offline fallback and manifest shortcuts point to files/routes that do not exist; native registration/token flow is inconsistent. |
| P1 | Export/migration | Guest-to-account migration and CSV export map local fairway/penalty fields incorrectly, so exports and migrated stats can be wrong. |
| P2 | Maintainability | `TrackRoundPage.tsx` is a 3,394-line state machine; scoring, conversion, persistence, and UI are too tightly coupled to test safely. |

TypeScript verification passed with `npx tsc --noEmit`. No automated app tests were found beyond the default Android sample test.

## Remediation Status - 2026-04-29

The first remediation pass has been completed with the specific goal of preserving the current golfer-facing look and feel. No layout, styling system, navigation structure, dashboard card design, or tracking-card visual treatment was redesigned.

### Addressed in this pass

| Area | Status | What changed |
|---|---|---|
| CORS/session exposure | Fixed | API CORS now uses an allowlist instead of reflecting arbitrary origins, session cookies are hardened, and auth failure responses no longer expose debug session/token details. |
| Admin hardening | Fixed | Hard-coded default admin credential creation was removed, admin login is rate limited, admin debug output is dev-only, and admin user hash inputs are validated before filesystem access. |
| Runtime logs | Fixed | Tracked PHP error logs were removed and `php_errorlog` is ignored. |
| Guest end/pause flow | Fixed | Guest rounds no longer call authenticated save APIs when ending or pausing; registered users still save normally. |
| Official GIR correctness | Fixed | Penalty auto-denied GIR is now stored as official `gir: 'n'` even if the player reached the green after the penalty flow. |
| Round identity/idempotency | Improved | Stable `roundId` is generated/persisted client-side and used by save/delete paths; save/delete now use atomic JSON update transactions. |
| Dashboard stats trust | Fixed | Official dashboard stats now use completed rounds only, so paused/incomplete rounds do not pollute lifetime stats. |
| PWA shortcuts/offline fallback | Fixed | Manifest shortcuts now point to hash routes and the service worker falls back to the app shell instead of a missing `offline.html`. |
| Native registration | Fixed | Registration now returns a native auth token like login, and browser token storage is avoided for non-native builds. |
| Export/migration correctness | Fixed | CSV export and guest-to-account migration now preserve fairway, penalty, approach, and distance semantics more accurately. |

### Remaining recommended work

| Priority | Remaining item | Notes |
|---|---|---|
| P0/P1 | CSRF token enforcement | CORS and cookie hardening reduce the immediate cross-origin risk, but cookie-authenticated POST/DELETE endpoints should still get CSRF tokens. |
| P1 | HSTS production enablement | Enable once HTTPS behavior is verified across the production host. |
| P1 | Full production build verification | Completed after approval to run the build outside the sandbox. Upload the refreshed `dist/` contents for FTP deployment. |
| P2 | Automated scoring/persistence tests | No test framework exists yet. Add focused unit tests before deeper golf scoring changes. |
| P2 | `TrackRoundPage.tsx` refactor | Still recommended, but not part of this no-visual-change production hardening pass. |
| P2 | Repo hygiene | Archives, signing material, generated output policy, and lockfile policy still need a separate cleanup decision. |

### Verification after remediation

- `npx tsc --noEmit`: passed.
- `php -l` on touched PHP files: passed.
- JSON parse check for `static/manifest.json` and `mobile/package.json`: passed.
- Full production build: `npm run build` passed after approval to run outside the sandbox.

## Product Understanding

### Intended golfer outcome

The app should help a golfer answer:

- Am I creating enough birdie chances?
- Are penalty strokes or big numbers costing rounds?
- Is GIR improving by distance, lie, and par type?
- Do I miss in useful patterns that a coach can act on?
- Am I converting putts from realistic ranges?
- Can I show clean, credible performance data over time?

### Current app model

The active product is:

- React 19 + TypeScript + Vite frontend.
- Hash-routed PWA with guest and registered flows.
- PHP 8-style JSON-file backend under `api/`.
- File-based account storage under `/data/{userHash}/`.
- Admin dashboard under `admin/`.
- Capacitor Android wrapper under `mobile/`.
- Core screen: `src/pages/TrackRoundPage.tsx`.
- Core server stats: `api/common/stats-calculator.php`.

### What is working well

- The product has a strong "track during play" focus instead of becoming only a post-round scorecard.
- Guest mode is the right acquisition flow for a golfer on the first tee.
- The dashboard already includes useful coach-facing concepts: scoring by par, score distribution, putt buckets, GIR by lie, par-5 second-shot data, wedge distances, and Tiger Five.
- Server-side stat recalculation is the right architectural direction; clients should not be the final authority for saved stats.
- The app has clear docs for architecture, deployment, PWA use, scoring flows, and product requirements.

## P0 Findings

### P0-1: Cross-origin credentialed API access creates account-data risk

Evidence:

- `api/common/cors.php:8-10` reflects whatever `Origin` header the browser sends and enables credentials.
- `api/common/session.php:24-27` sets production session cookies to `SameSite=None` when secure.
- State-changing endpoints such as `api/rounds/save.php:21-22`, `api/rounds/delete.php:17-18`, and `api/auth/login.php:55-58` rely on session auth and do not require CSRF tokens.
- `api/common/session.php:107-118` returns debug session details in unauthorized responses.

Why this matters:

A malicious site can make credentialed cross-origin requests to `karlgolf.app` in a logged-in browser. Because the API reflects arbitrary origins and allows credentials, the browser may also expose the response to that malicious origin. This can allow reading stats, deleting rounds, saving manipulated rounds, or resetting account data if the user has an active session.

Recommended fix:

- Replace reflected CORS with an explicit allowlist, for example `https://karlgolf.app` and approved Capacitor/native origins only.
- Do not use `Access-Control-Allow-Credentials: true` for arbitrary origins.
- Prefer `SameSite=Lax` for browser session cookies. Native app calls already have a bearer-token path.
- Add CSRF tokens or a double-submit CSRF cookie for all cookie-authenticated state-changing requests.
- Remove all auth debug payloads from production responses.

Acceptance criteria:

- A request from `https://evil.example` receives no credentialed CORS access.
- Cross-origin POST/DELETE requests without a CSRF token fail.
- Unauthorized API responses do not include `session_id`, token prefixes, or email/session state.

### P0-2: Admin access can be initialized with hard-coded default credentials

Evidence:

- `api/admin/auth.php:31-38` creates an admin credentials file with a hard-coded default username/password if no credentials file exists.
- `api/admin/auth.php:80-119` has no rate limiter.
- `api/admin/delete-user.php:7-15` and `api/admin/user-stats.php:7-15` enable display errors and broad CORS headers.
- `api/admin/php_errorlog` and `api/auth/php_errorlog` are tracked in git and contain emails/IPs.

Why this matters:

If production data is ever missing `admin_credentials.json`, the app can silently recreate a known admin login. Combined with no rate limiting, this is a high-risk admin takeover path. Tracked logs also expose operational and personal data.

Recommended fix:

- Remove default admin credential creation. Fail closed if admin credentials are missing.
- Provision admin credentials through environment variables or a one-time setup command outside the public web path.
- Add admin login rate limiting and lockouts.
- Disable `display_errors` in admin endpoints.
- Remove tracked `php_errorlog` files and add `php_errorlog` to `.gitignore`.
- Rotate any exposed credentials or tokens if these files have been pushed/shared.

Acceptance criteria:

- Fresh production deploy without admin credentials cannot log in.
- Admin login attempts are rate limited.
- No admin endpoint displays PHP errors to clients in production.
- No log files with emails/IPs are tracked.

### P0-3: Guest users cannot reliably end or pause 9+ hole rounds

Evidence:

- `src/pages/TrackRoundPage.tsx:2908-2914` saves incomplete nines through `roundsAPI.saveRound`.
- `src/pages/TrackRoundPage.tsx:2967-2973` saves complete rounds through `roundsAPI.saveRound`.
- `src/pages/TrackRoundPage.tsx:3013-3018` pauses rounds through `roundsAPI.saveRound`.
- `api/rounds/save.php:21-22` requires authentication.
- The guest UI promises local-only persistence and export.

Why this matters:

Guest mode is a core acquisition path. A golfer can enter a full 9 or 18 holes without an account, then hit "End Round" and get a server-save failure because the endpoint requires login. That is a trust-breaking first-run experience.

Recommended fix:

- Branch the end/pause handlers by `isLoggedIn`.
- For guests, never call authenticated save APIs. Keep data local, show export/account-create options, and navigate to an appropriate local summary or stay on the round view.
- If guest-to-account conversion is desired at end-of-round, open registration first, then save after auth is confirmed.

Acceptance criteria:

- Guest can complete 9/18 holes, export CSV, and dismiss the round without any authenticated API call.
- Registered user behavior remains unchanged.
- Failed server saves never block guest export of already-entered data.

### P0-4: Penalty auto-denied GIR can be stored as GIR hit

Evidence:

- Auto-denial is calculated in `src/pages/TrackRoundPage.tsx:607-619`.
- The no-GIR scoring path is used when `isGirAutoDenied` is true in `src/pages/TrackRoundPage.tsx:670-703`.
- The stored hole still uses `gir: gir || 'n'` in `src/pages/TrackRoundPage.tsx:710-715`.
- Conversion sends `gir: localHole.gir` to the API in `src/pages/TrackRoundPage.tsx:56-61`.
- Server stats count only strict `gir === 'y'` in `api/common/stats-calculator.php:115-120`.

Why this matters:

The app's central stat is GIR. In penalty flows, the score formula can correctly treat a hole as non-GIR while the saved data still says `gir: 'y'` if the golfer tapped "On!" after the penalty. Dashboard GIR, putts per GIR, scrambling, GIR by lie, putt buckets, and exports can all become wrong.

Recommended fix:

- Store two separate concepts:
  - `officialGir`: strict GIR used for scoreboard/stat definitions.
  - `greenReachedInFlow` or `adjustedGir`: whether the player reached the green in the post-penalty flow.
- At minimum, save `gir: isGirAutoDenied ? 'n' : (gir || 'n')`.
- Add explicit scoring/stat tests for par 3/4/5 tee penalties, second-shot hazards, and post-penalty "On!" selections.

Acceptance criteria:

- A par 4 tee penalty followed by "On!" is saved as official GIR no.
- The app can still show that the recovery/re-tee shot reached the green if desired.
- Dashboard GIR matches the official definition in all penalty flows.

### P0-5: Round persistence is not transaction-safe and is not idempotent

Evidence:

- `api/rounds/save.php:97-98` reads `rounds.json`, then writes later in separate operations such as `api/rounds/save.php:136`, `202`, `254`, and `313`.
- `api/common/file-lock.php:102-160` has an atomic `updateJsonFile` helper, but save/delete flows do not use it.
- New rounds are identified by `roundNumber: count($rounds) + 1` in `api/rounds/save.php:299-306`.
- Completed rounds are skipped by auto-merge in `api/common/round-merger.php:155-164`.
- Deletion renumbers all rounds in `api/rounds/delete.php:65-68`.

Why this matters:

File locks protect individual read or write calls, but they do not protect the full read-modify-write transaction. Two saves can read the same old file and whichever writes last wins. A retry of a completed-round save can create a duplicate because completed rounds are skipped by auto-merge. Mutable `roundNumber` makes edit/delete targets ambiguous after reordering or deletion.

Recommended fix:

- Add stable `roundId` generated client-side at first hole or round start.
- Save with an explicit operation: `create`, `update`, `complete`, `pause`, `delete`.
- Add `clientRequestId`/idempotency keys for each save operation.
- Use `updateJsonFile()` or equivalent exclusive lock around the entire read-modify-write transaction.
- Stop renumbering stored identity; derive display numbers in the dashboard.

Acceptance criteria:

- Retrying the same completed save cannot create a duplicate.
- Editing/deleting a round still targets the same round after another round is deleted.
- Concurrent saves from two requests cannot drop holes.

## P1 Findings

### P1-1: Dashboard cumulative stats include incomplete rounds

Evidence:

- `api/stats/load.php:24-37` loads and reverses all rounds.
- `api/stats/load.php:63-64` calculates cumulative stats over all `roundsData`.
- `api/common/stats-calculator.php:405-433` aggregates all holes from all rounds without filtering `completed` or hole count.
- UI copy says stats require a completed 9-hole round in `src/pages/DashboardPage.tsx:186-193`, but stat cards render on `hasData` in `src/pages/DashboardPage.tsx:276-288`.

Why this matters:

Because registered rounds are saved after each hole, a partial 3-hole or paused round can affect the golfer's long-term averages. For a competitive player, this makes the dashboard less credible.

Recommended fix:

- Decide the rule: dashboard official stats should use `completed === true` and `holes.length >= 9`.
- Show incomplete rounds only in a separate "current round" card.
- If live/in-progress stats are useful, label them as "current round snapshot" and exclude them from lifetime averages.

### P1-2: Native registration and Capacitor versions are inconsistent

Evidence:

- Root `package.json` uses Capacitor 8 packages.
- `mobile/package.json` uses Capacitor 7 packages.
- Browser/native auth stores bearer tokens only when a token is returned in `src/lib/api.ts:202-225`.
- Login returns a token in `api/auth/login.php:268-281`; register returns no token in `api/auth/login.php:224-231`.

Why this matters:

Native users who register may be treated as logged in locally but lack the bearer token needed by native API requests. Version mismatch between root and mobile Capacitor packages also increases native build/runtime risk.

Recommended fix:

- Align Capacitor packages to one major version across root and `mobile/`.
- Return a token from registration, or require a login after registration before native API calls.
- Store native tokens in Capacitor Preferences/Secure Storage where practical, not browser `localStorage`.

### P1-3: PWA shortcuts and offline fallback are broken

Evidence:

- `static/manifest.json:71-102` points shortcuts at `track-round.html`, `dashboard.html`, and `track-live.html`.
- No matching files exist in the repo.
- The app uses hash routes in `src/App.tsx`.
- `static/service-worker.js:91-95` and `124-129` fall back to `/offline.html`.
- No `offline.html` exists; offline is a React route at `/#/offline`.

Why this matters:

Installed-app shortcuts and offline navigation are part of the promised mobile experience. A golfer may tap an installed shortcut or lose connectivity on course and hit a dead path.

Recommended fix:

- Change shortcuts to hash routes, for example `./#/track-round`, `./#/dashboard`, and `./#/track-live`, or create actual rewrite-compatible entry files.
- Cache the built app shell and route offline fallback to the app shell plus `/#/offline`.
- Add a simple PWA smoke test after build.

### P1-4: Guest migration and CSV export corrupt local hole semantics

Evidence:

- Guest migration maps local fairway values to `'l'`, `'c'`, `'r'`, or `null` in `src/pages/LoginPage.tsx:91-100`.
- API/stats expect fairway `'y'` or `'n'` in `src/types/index.ts:10-12` and `api/common/stats-calculator.php:128-134`.
- Guest export casts local holes to API `Hole` in `src/lib/export.ts:114-115`.
- Export treats fairway as yes only when `h.fairway === 'y'` in `src/lib/export.ts:18-23` and `80-92`.
- Export labels the same value as `Proximity (yds)` in `src/lib/export.ts:27`, but summary says feet in `src/lib/export.ts:40`.

Why this matters:

A guest who creates an account after a round can lose fairway and penalty meaning. A CSV export, which may be used for a coach, can misstate fairways and units.

Recommended fix:

- Reuse `convertToAPIHole` logic for guest migration instead of a separate incomplete mapper.
- Export local-hole format directly or convert to API format first.
- Split naming between `approachDistanceYards` and `proximityFeet`, or choose one and label it consistently.

### P1-5: Browser stores long-lived bearer tokens in `localStorage`

Evidence:

- `src/lib/api.ts:8-20` stores bearer tokens in `localStorage`.
- Browser login receives a token from the PHP login endpoint and stores it in `src/lib/api.ts:202-211`.
- Browser requests use cookies, not the bearer token, in `src/lib/api.ts:104-124`.

Why this matters:

The PWA stores a 30-day bearer token it does not need for normal browser requests. Any XSS would gain durable account access. This is especially concerning because the CSP in `static/.htaccess` allows `unsafe-inline` and `unsafe-eval`.

Recommended fix:

- Only return/store bearer tokens for native clients.
- For browser/PWA, rely on secure HttpOnly cookies plus CSRF protection.
- If a browser token is unavoidable, store it in memory only and shorten its lifetime.

### P1-6: Session hardening depends on server defaults

Evidence:

- `api/common/session.php:36-43` sets `httponly` from `$defaultParams['httponly']` instead of enforcing `true`.
- `static/.htaccess` attempts `php_value session.cookie_httponly 1`, but this only works under compatible Apache/PHP configurations.
- HSTS is documented but commented out in `static/.htaccess`.

Why this matters:

Security should not depend on server-specific defaults. Session cookies should be explicitly HttpOnly/Secure in PHP code, and HSTS should be enabled once HTTPS is confirmed.

Recommended fix:

- Set `'httponly' => true` directly in `session_set_cookie_params`.
- Set `session.use_strict_mode=1`.
- Enable HSTS in production.

## P2 Findings

### P2-1: The core tracking page is too large to validate safely

Evidence:

- `src/pages/TrackRoundPage.tsx` is 3,394 lines.
- It contains local data types, API conversion, recovery, server sync, score formulas, card state, validation, modals, edit flow, dashboard navigation, guest prompts, and rendering.

Why this matters:

The app's highest-risk logic is scoring and stat capture. That logic is currently embedded in a UI component, making it hard to unit test and easy to break when adding new golf edge cases.

Recommended refactor:

- Extract `scoreHole(input): HoleScoreResult`.
- Extract `toApiHole(localHole): Hole`.
- Extract a reducer/state machine for tracking-card flow.
- Extract `useRoundPersistence`.
- Keep UI cards mostly presentational.

### P2-2: The repo mixes source, generated output, archives, logs, and secrets-adjacent files

Evidence:

- `dist/` is tracked.
- `my-release-key.jks` is tracked.
- `api/admin/php_errorlog` and `api/auth/php_errorlog` are tracked.
- Archived `data/*/password.txt` and `rounds.json` appear under `._files/_ARCHIVES`.
- `.gitignore` ignores `package-lock.json`, but a lockfile exists locally.

Why this matters:

Generated output and archives make reviews noisy. Tracked logs and keystores increase data exposure risk. Ignoring the lockfile weakens reproducible builds.

Recommended fix:

- Decide whether `dist/` is a deployment artifact or source of truth. Prefer not tracking it.
- Remove tracked log files and archive user data/password hashes.
- Move release signing material outside the repo and rotate if exposed.
- Track `package-lock.json` for deterministic npm installs, or intentionally remove it if using another package manager.

### P2-3: Automated test coverage is missing where risk is highest

Evidence:

- No Vitest/Jest/Playwright/PHPUnit config or test scripts are present in root `package.json`.
- Only the default Android sample test exists under `mobile/android/.../ExampleUnitTest.java`.
- `npx tsc --noEmit` passes, but type checking does not validate golf scoring or persistence behavior.

Recommended test suite:

- Unit tests for score calculation:
  - par 3 ace, par 3 tee penalty re-tee on, par 3 miss chip-in
  - par 4 tee penalty on/missed recovery
  - par 5 second-shot hazard, on in two, layup, wedge miss
  - zero-putt hole-outs
- Unit tests for `toApiHole` and guest migration.
- PHP tests for save/merge/delete/idempotency.
- Playwright mobile smoke tests for guest 9-hole export, registered save, dashboard stats, and offline route.

## Golfer-Facing Product Recommendations

### Highest value analytics for a serious player

Add or formalize:

- Official GIR vs adjusted/development GIR.
- Penalty incidents and penalty strokes per round.
- Tee-ball penalty rate.
- Double-bogey-or-worse avoidance.
- Par 3/4/5 scoring averages.
- 3-putt avoidance and one-putt percentage.
- First-putt make percentage by distance bucket.
- GIR by approach-distance bucket.
- Fairway/GIR correlation.
- Scrambling by miss location and lie.
- Practice vs tournament filter.
- Tee box, course rating/slope, and round conditions.
- Round notes and "exclude from stats" for practice/abnormal rounds.

### Keep official and coaching stats separate

For a competitive golfer, some stats have official definitions and some are developmental. Mixing them creates arguments. Use two dashboard sections:

- Official stats: score, to-par, GIR, fairways, putts, scrambling, penalties.
- Coaching stats: adjusted GIR, quality tee shot, playable miss, distance-bucket GIR, big-number avoidance, conversion inside 15 feet.

## Recommended Remediation Plan

### Phase 1: Stop trust-breaking issues

1. Lock down CORS/CSRF/session debug output.
2. Remove default admin credential initialization and add admin rate limiting.
3. Fix guest end/pause behavior so it never calls authenticated save APIs.
4. Force official GIR to no when a penalty auto-denies GIR.
5. Filter dashboard cumulative stats to completed rounds only.
6. Fix manifest shortcuts and offline fallback.

### Phase 2: Make round data durable

1. Add stable `roundId`.
2. Add idempotency keys.
3. Replace save/delete read-modify-write with one exclusive transaction.
4. Stop renumbering stored round identity.
5. Add save/merge/delete tests.

### Phase 3: Make stats coach-grade

1. Split `approachDistanceYards` from `proximityFeet`.
2. Add official vs adjusted GIR.
3. Add penalty strokes per round and tee penalty rate.
4. Add scoring by par type and distance bucket dashboards.
5. Add round notes, exclude-from-stats, and tournament/practice filters.

### Phase 4: Reduce maintenance risk

1. Extract scoring and API conversion from `TrackRoundPage.tsx`.
2. Add frontend unit tests and Playwright smoke tests.
3. Clean repo artifacts: logs, archives, generated dist, signing key, lockfile policy.
4. Align Capacitor versions and native auth behavior.

## Verification Performed

- Indexed local repo structure with `rg --files`.
- Read product docs: `README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`.
- Reviewed core frontend flows: router, auth, dashboard, tracking page, exports, storage, course search.
- Reviewed core backend flows: auth, sessions, CORS, save/merge/delete, stats, admin.
- Reviewed PWA manifest/service worker and mobile Capacitor config.
- Ran `npx tsc --noEmit`: passed.

Not performed:

- Full `npm run build`, because it rewrites generated deployment output and was not necessary for this review.
- Browser/device manual QA.
- Network dependency audit.
- PHP runtime execution.

## Overall Assessment

Karl Golf GIR has a credible product direction for a golfer who wants improvement data, not just a scorecard. The strongest parts are the mobile-first round-entry concept, the willingness to track more than score, and the emerging dashboard metrics.

Before adding more features, the app should harden security, make round saves idempotent, fix guest completion, and correct penalty/GIR semantics. Those changes will make every later coaching metric more trustworthy.
