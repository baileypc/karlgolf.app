# Karl Golf GIR - Golf Tracking PWA

**Version:** 3.10.0 (Production)
**Status:** Production ready
**Domain:** [https://karlgolf.app](https://karlgolf.app)

A Progressive Web App for tracking golf performance with college coach metrics. Built for high school and college golf students, and serious recreational golfers seeking data-driven improvement.

---

## Version 3.10.0 - Current Release

**Release type:** PDF Export Reports
**Status:** Production ready

### What's New in 3.10.0
- **Round Report PDF:** Full scorecard PDF for a single round — hole-by-hole Par, Score, +/-, GIR, Putts, Fairway, Proximity, Penalties — plus stats summary with PGA Tour benchmarks. Button on every completed round card.
- **Round Log PDF:** Landscape PDF with one row per round — Date, Course, Holes, Score, +/-, GIR%, FW%, Putts, Putts/GIR, Scrambling%. Full playing history in a clean read-only format ideal for coaches.
- **Career Report PDF:** All-time career averages, a last-5 vs all-time trend table with ▲/▼ improvement indicators, and a best-round callout. Designed for season-end coach review meetings.
- All PDFs are branded "Karl Golf GIR · karlgolf.app", dated, and cannot be edited — keeping stats honest.
- CSV "Export All Data" removed from player-facing UI (replaced by the above).

### What's New in 3.9.1
- **Putts/GIR dashboard tile:** The compact stats card now shows average putts per green hit in regulation — the most actionable putting quality metric, replacing the less-useful all-time total stroke count. PGA Tour benchmark ≈ 1.77 for context.
- **Scrambling denominator clarity:** The Scrambling % tile now shows "of missed GIR" as a sub-label so it's clear this is par-or-better saves per missed green, not per total holes.
- **GIR data hardening:** The continue-round server load path now uses a strict `=== 'y'` check when restoring GIR state from a saved hole, consistent with all other load paths.

### What's New in 3.9.0
- **Glassmorphism UI Overhaul:** Replaced the previous solid colors with a modern, glass-like frosted aesthetic (`.glass-card`, `.glass-bottom-nav`) atop a deep black (`#000000`) background.
- **Pill-shaped Buttons:** Fully updated all interactive buttons globally to feature a sleek, modern pill-shape design with smoother hover states and better touch feedback.
- **Header Score Indicator:** The current round score (+/- par) has been moved out of the playing cards and into the fixed header, styled in a subtle light tan (`#e6c280`) color. It is toggleable (click to show/hide) to hide the score while playing.
- **Bottom Navigation Refinement:** Moved the logo cleanly to the left and placed a safe "Discard Round" trash icon directly in the navigation bar when a round is active, triggering a safety confirmation modal.
- **Uncluttered Track Round UI:** Fixed the main active playing cards to the top of the screen and anchored the "End/Pause Round" and "Snapshot" statistics blocks completely out of the way to the bottom footer area.
- **Course Par Auto-Detection:** Removed the redundant global Course Par picker; par is now handled seamlessly hole-by-hole.

### What's New in 3.8.6
- **Scoring fix — Par 5 tee penalty + Holed it!** - "Holed it!" on the approach after a tee penalty was saving 1 stroke too few (birdie recorded as eagle). Now correctly counts the holed approach as a shot.
- **Scoring fix — Par 3 +2 Drop submit label** - The submit button was displaying a score 1 lower than what was actually saved for Par 3 +2 local-rule drops. Label now matches the saved score.
- **Par 3 penalty formula generalised** - Score calculation for Par 3 tee penalties now correctly handles both +1 Re-tee and +2 Drop using the actual penalty count instead of hardcoded values.
- **Consistent penalty UI** - Par 3 Card 2.5 penalty buttons now show the same "+1 Re-tee" and "+2 Drop" labels as Par 4/5, replacing the old single-button design.
- **Approach distance hidden for Par 3 tee penalty** - When a tee penalty is taken on a Par 3 and the re-tee shot reaches the green, the approach distance input is no longer shown (it is not applicable in that flow).
- **PWA install prompt persistence** - Dismissing the install banner now persists across sessions via localStorage so it does not reappear on every visit.

### What's New in 3.8.1
- **Stats accuracy hardening** - Fairway, GIR-by-lie, putts-per-GIR, penalty strokes, and TypeScript/PHP stat parity were tightened.
- **Data normalization** - Local fairway values such as center/left/right are normalized before server stats and exports are calculated.
- **Security hardening** - Added CSRF protection for cookie-authenticated state-changing requests and hardened admin API authentication.
- **Admin stability** - Fixed admin users/user-stats JSON responses so PHP warnings cannot break the dashboard.
- **File storage resilience** - Improved JSON file locking, backup, and recovery behavior for file-backed data.
- **Regression coverage** - Added a PHP regression test suite for key stats-calculation cases.
- **Dependency audit** - Updated the lockfile so production dependency audit reports zero vulnerabilities.

### Previous Release Highlights
- **Hazard Tee-Shot Penalty Flow** - Par 4/5 hazard selection shows a tee-shot penalty picker.
- **GIR Auto-Deny Logic** - Tee penalties deny GIR according to the app's strict scoring rules.
- **Dashboard Stats Display** - Fixed dashboard stats API response parsing.

- **GPS Course Finder** - Find nearby golf courses using device GPS.
- **Admin Dashboard** - Analytics and user management.
- **PDF Reports** - Marketing-ready analytics reports with charts.

---

## Features

### Core Functionality
- **Auto-Calculated Scores** - Calculates based on your game situation (par, GIR, putts, penalties)
- **User Accounts** - Register and login to save rounds and track progress over time
- **Guest Mode** - Track rounds without an account (data saved locally)
- **Comprehensive Tracking** - GIR, fairways, putts, penalties, scrambling, approach distance
- **Dashboard** - View cumulative statistics across all saved rounds
- **Round History** - Individual round cards with hole-by-hole details
- **Edit Holes** - Correct mistakes by editing any hole
- **Delete Rounds** - Delete individual rounds or all rounds
- **Export Data** - Download rounds and stats as JSON or CSV
- **Email Results** - Professional round summaries sent to your email
- **Password Recovery** - Secure password reset via email

### Progressive Web App (PWA)
- **Installable** - Add to home screen on iOS, Android, and desktop
- **Offline Support** - Full functionality without internet connection
- **App Shortcuts** - Quick access to Track Round and Dashboard
- **Smart Caching** - Optimized performance with service worker

### Mobile-First Design
- **Touch-Optimized** - 44px minimum touch targets
- **Responsive** - Works on all screen sizes
- **Professional UI** - Golf-themed design with five-color palette:
  - `#0a140a` - Dark background
  - `#DDEDD2` - Light green (primary)
  - `#F2D1A4` - Brown (secondary)
  - `#D4A574` - Gold (accents)
  - `#FFF8E7` - Cream (highlights)

---

## How to Use

### Tracking a Round

1. **Select Par** (3, 4, or 5)
2. **Fairway Hit?** (auto-skipped on Par 3s)
   - If missed: select result (Left, Right, OB, Water, etc.)
3. **Green in Regulation?** (Yes/No)
   - If missed: enter shots to green
4. **Approach Distance** (optional - feet from hole)
5. **Number of Putts** (required)
6. **Putt Distances** (distance of each putt)
7. **Penalties?** (optional - OB, Water, Lost Ball, etc.)

**Score calculates automatically!**

### After Your Round

- **Save Round** - After 9 or 18 holes
- **Email Summary** - Option to send professional round summary
- **View Dashboard** - See cumulative statistics
- **Export Data** - Download data as JSON or CSV

---

## Quick Start

### For Users
1. Visit [karlgolf.app](https://karlgolf.app)
2. Create account or track a live round (no account needed)
3. Start tracking your round
4. View statistics on dashboard

### For Developers
```bash
# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Sync current version references in markdown files
npm run sync-version

# Production build (automatically syncs versions)
npm run build

# Preview production build
npm run preview
```

**Note:** The build process automatically syncs current version references from `package.json` and prepares the deployment package in `/dist`.

---

## Documentation

All detailed documentation is in the **`/docs`** folder:

### Getting Started
- **[Development Guide](docs/DEVELOPMENT.md)** - Local development setup
- **[Testing Guide](docs/TESTING.md)** - Testing procedures

### Deployment
- **[Deployment Checklist](docs/DEPLOYMENT-CHECKLIST.md)** - Production deployment steps
- **[FTP Upload Guide](docs/FTP-UPLOAD-GUIDE.md)** - File upload instructions
- **[Production Readiness](docs/PRODUCTION-READINESS.md)** - Launch checklist

### Features
- **[PWA Install Guide](docs/PWA-INSTALL-GUIDE.md)** - PWA features
- **[Admin Analytics](docs/ADMIN-ANALYTICS.md)** - Analytics tracking

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** PHP 8.x, JSON file storage
- **PWA:** Service Worker, Web App Manifest
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router 7
- **Deployment:** SiteGround, SSL required

---

## Security

**Status:** Production ready

### Security Features
- Content Security Policy (CSP) protection
- HTTPS enforcement with HSTS
- Comprehensive security headers
- Input validation and sanitization
- Request method restrictions
- Session management with httpOnly cookies
- Password hashing with bcrypt

See **[Security Assessment](docs/SECURITY-ASSESSMENT.md)** for complete analysis.

---

## Statistics Tracked

### Scoring
- Total score, to par
- Scoring average
- Best/worst holes

### Greens in Regulation (GIR)
- Overall GIR percentage
- Putts per GIR
- Scrambling percentage (up & down when missing GIR)

### Driving
- Fairway hit percentage (left/center/right all count)
- Miss tendency (left, right, penalty)

### Short Game
- Average approach distance (overall, on GIR, missed GIR)
- Scrambling percentage
- Sand saves

### Putting
- Total putts
- Putts per round
- Putt distances

---

## Deployment

### Production Deployment

1. **Build:** `npm run build`
2. **Upload:** All files from `/dist/` to production `/public_html/`
3. **Create:** `/data/` directory outside public_html (755 permissions)
4. **Test:** `https://karlgolf.app`

**Note:** Build output goes to `/dist`. The build process automatically copies all necessary files including API, admin dashboard, and static assets.

See **[Architecture Documentation](docs/ARCHITECTURE.md)** for complete system overview.

---

## Version 4.0.0 - Future Features

### Planned Enhancements
- **Course Selection** - Pre-populated US golf course database
- **Course Favorites** - Save favorite courses for quick selection
- **Statistics Trends** - Visual charts showing improvement over time
- **Round Comparison** - Compare stats between rounds side-by-side
- **Handicap Calculation** - USGA handicap calculation
- **Save Partial Nines** - Auto-save complete 9-hole sets to API

See **[TODOs](docs/TODOS.md)** for complete list of future features.

---

## Known Limitations

### Not Currently Implemented
- Tee selection (forward/middle/back)
- Date selector for backdating rounds
- Distance to hole entry (only approach distance)
- Chip/approach location tracking
- Sand save percentage (penalty tracking exists)
- Visual charts/graphs (planned for v4)
- Dedicated statistics page with filters
- Season management

---

## Created For

**Karl** - to help improve his golf game through data-driven insights.

---

**Created by:** Bailey at CLOUD VIRTUE
**Website:** [cloudvirtue.com](https://cloudvirtue.com)
**Repository:** Private
**License:** Proprietary
**Version:** 3.10.0 (Production)
