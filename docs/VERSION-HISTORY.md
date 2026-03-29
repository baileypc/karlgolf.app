# Version History

## Version 3.6.3 - Wedge Flow & UX (March 2026)

### ✅ Features & Improvements

**Wedge shots:**
- **Per-shot yardages** – Wedge distance inputs are per shot (Shot 1, Shot 2, Shot 3) when 2–3 shots; single “Yds” when 1 shot. Stored as `wedgeShotDistances` array; backend aggregates for “Avg wedge to green.”
- **Cap at 3** – Max 3 wedge shot yardage inputs. If user enters more than 3 wedge shots, message **“Call your coach!”** is shown (Par 5 hazard/miss and Par 3/4 approach sections). Stored wedge distances limited to first 3; full shot count still used for score.

**GIR & approach flow:**
- **GIR label** – Par 3/4 GIR card option label changed from “Hit” to **“On!”** (aligned with Par 5).
- **Par 4 approach flow** – When GIR = Missed on Par 3/4: Penalties, Where? (Short/Sand/Long/Hazard), then Wedge Shot(s) & distance, same as Par 5.

**Labels & copy:**
- Par 5 Card 4: **“2nd Shot”** → **“2nd Shot In”** (card title and collapsed summary).
- Par 5 Card 5: **“Wedge Shot to Green”** → **“3rd Shot (GIR)”**.
- **“Current Round Stats”** → **“Snapshot”** on track round page.

### 🔧 Technical Changes
- `wedgeShotDistances: number[]` and legacy `wedgeShotDistance`; API accepts both; stats use array aggregation.
- `MAX_WEDGE_SHOTS = 3`; `wedgeCount = Math.min(shotsToGreen, 3)` for UI; `wedgeShotDistances.slice(0, 3)` when saving.

---

## Version 3.6.0 - Par 5 Tracking & Dashboard Stats (March 2026)

### ✅ Features & Improvements

**Par 5 flow & data:**
- **2nd Shot Result** – Added **On Green!** option; choosing it skips to putting (GIR in 2). All other results go to Wedge Shot to Green.
- **Wedge Shot to Green** – **Where?** now includes **Hazard** (water/duff by green) with +1/+2/+3 penalty.
- **Wedge Shot(s) + Yds** – When entering wedge shots to green, players can record **distance (yards)**; stored and included in stats.

**Dashboard stats (Par 5 · 2nd Shot & Wedge):**
- **Avg 2nd shot dist** – Average layup distance (yd) and hole count.
- **On green in 2** – % and count of Par 5s where 2nd shot was On Green!
- **2nd shot in trouble %** – % of Par 5s where 2nd shot was in hazard.
- **Avg wedge to green** – Average wedge-shot distance (yd) when GIR was missed, with hole count. Placeholder when no data yet.

All new Par 5 fields are persisted, sent to the API, and reflected in cumulative dashboard stats. Safe fallbacks (—) when values are zero or missing.

### 🔧 Technical Changes
- Types: `secondShotLie` includes `'green'`, `approachMissLocation` includes `'hazard'`, added `wedgeShotDistance`.
- Backend: `par5OnGreenCount`, `par5OnGreenPct`, `avgWedgeShotDistance`, `wedgeShotDistanceCount` in stats calculator.
- Dashboard: Par 5 card shows 2×2 grid with all four metrics; wedge row conditional on data.

---

## Version 3.3.1 - Bug Fixes (January 2026)

### 🐛 Bug Fixes

- **Completed Flag Fix** - Fixed `completed` field being stripped during round validation, causing rounds to never be marked as complete
- **Dashboard Stats Display** - Fixed Dashboard not displaying stats due to incorrect API response parsing (was accessing `result.data` instead of `result` directly)
- **TypeScript Types** - Updated `loadStats()` return type to match actual API response structure

---

## Version 3.3.0 - API & Data Improvements (January 2026)

### ✅ Features & Improvements

- **Enhanced API Response Types** - Improved TypeScript definitions for API responses
- **Version Sync Script** - Automated version syncing across all documentation files

---

## Version 3.2.0 - GPS Course Finder (December 2025)

### ✅ Major Features

**GPS & Course Search:**
- **GPS Location Services** - Automatic location detection using device GPS
- **Nearby Course Search** - Find golf courses within 25 miles of your location
- **Course Distance Calculation** - See exact distance to each course from your position
- **Location Permissions** - Smart handling of location permission requests
- **Course Selector Enhancement** - GPS-powered course selection interface
- **RapidAPI Integration** - Golf course database integration via RapidAPI

**Technical Implementation:**
- Added `golf-course-api.ts` with GPS location services
- Haversine formula for distance calculations
- Geolocation API integration with error handling
- Permission state management for location access

### 🔧 Technical Changes
- Added `src/lib/golf-course-api.ts` for GPS and course search functionality
- Enhanced `CourseSelector.tsx` with GPS location features
- Integrated RapidAPI Golf Course Finder API
- Added location permission handling and error states

---

## Version 3.1.0 - Admin Dashboard & UX Enhancements (November 2025)

### ✅ Major Features

**Admin Dashboard:**
- **User Management** - View all users, delete users with confirmation modal
- **Analytics Dashboard** - DAU, WAU, MAU, total signups, round events, page visits
- **Individual User Stats** - Detailed per-user statistics view
- **PDF Marketing Reports** - Generate downloadable PDF reports with jsPDF
- **Email Tracking** - User emails displayed in users table
- **Usage Metrics** - Comprehensive analytics with improved layout

**UX Improvements:**
- **Login/Register Flow** - After login/register, users go directly to /track-round
- **Password Validation** - Toast notifications for password mismatch and validation errors
- **Button Labels** - Changed "Have Account?" to "Login / Register" for clarity
- **Dashboard Icons** - Stats/dashboard icon visible in navigation for logged-in users

**Bug Fixes:**
- **Session Cookie Fix** - Fixed production session cookie domain (empty string for current domain)
- **Welcome Email Session Bug** - Fixed output before session_start() caused by closing PHP tag in welcome-email.php
- **Scoring Calculation** - Fixed critical bug where tee shot wasn't counted when GIR = No
- **Delete Hole Modal** - Fixed flickering and validation errors
- **Dashboard Layout** - Stats cards now show even with incomplete rounds
- **Footer Icons** - Fixed duplication issue

### 🔧 Technical Changes
- Updated session cookie configuration in `api/common/session.php`
- Removed closing PHP tag from `api/auth/welcome-email.php` to prevent output before session_start()
- Added toast notifications to `LoginPage.tsx` for better error feedback
- Changed navigation flow to redirect to `/track-round` after auth
- Added jsPDF library for PDF generation
- Improved admin dashboard layout and padding
- Build output changed from `/dist/` to `/public/`

### 📦 Deployment
- **Build Output:** `/public/` folder (changed from `/dist/`)
- **Deployment:** Upload `/public/*` to `/public_html/` on SiteGround
- **Data Location:** `/home/username/data/` (outside public_html for security)

---

## Version 3.0.0 - Production Release (January 2025)

### ✅ Major Features
- **Clean URLs** - App now served from root directory (no `/dist/` in URL)
- **Export All Data** - Download all rounds and stats as JSON
- **Reset Password** - Full password reset with email verification
- **Track Live Round** - Marketing-friendly entry point for guest users
- **Delete Rounds** - Delete individual rounds or all rounds
- **Improved Dashboard** - Combined "Continue Round" and "No Rounds Yet" cards

### ✅ Improvements
- Fixed fairway percentage calculation (left/center/right all count as hits)
- Fixed service worker caching issues
- Improved delete hole persistence
- Fixed edit hole functionality
- Added delete icons to round cards
- Added export functionality to dashboard

### 🔧 Technical Changes
- Changed base path from `/dist/` to `/` for clean URLs
- Updated all paths to use root-relative paths
- Simplified `.htaccess` configuration
- Fixed service worker asset caching
- Removed all console.log statements
- Updated build process for root deployment

### 📦 Deployment
- **Deployment Type:** Root deployment
- **URLs:** `https://karlgolf.app/` (clean URLs)
- **Build Output:** All files from `/dist/` deployed to root `/`

---

## Version 2.2.0 - Pre-v3 Development

### Features
- User accounts and authentication
- Round tracking and statistics
- Dashboard with cumulative stats
- PWA functionality
- Guest mode (localStorage)

### Known Issues (Historical; resolved in v3.6.7+)
- Fairway stats calculation issues
- Service worker caching problems
- Delete hole persistence issues
- URLs included `/dist/` path

---

## Version 2.0.0 - Major Redesign

### Features
- Mobile-first UI redesign
- React implementation
- PWA support
- Email functionality

---

## Version 1.0.0 - Initial Release

### Features
- Basic round tracking
- HTML/CSS/JavaScript implementation
- Local storage only

---

## Future: Version 4.0.0

### Planned Features
- Course selection (US database)
- Course favorites
- Statistics trends/graphs
- Round comparison
- Handicap calculation
- Save partial nines to API
- Advanced statistics dashboard
- Season management
- Tee selection
- Date selector for backdating

See **[TODOs](TODOS.md)** for complete list of future features.

---

**Current Version:** 3.6.7 (Production)
**Next Version:** 4.0.0 (Future enhancements)

