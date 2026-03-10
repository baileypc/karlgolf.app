# Karl Golf GIR - Golf Tracking PWA

**Version:** 3.5.0 (Production)
**Status:** ✅ **LIVE IN PRODUCTION**
**Domain:** [https://karlgolf.app](https://karlgolf.app)

A Progressive Web App for tracking golf performance with college coach metrics. Built for high school and college golf students, and serious recreational golfers seeking data-driven improvement.

---

## 🎉 Version 3.5.0 - Current Release

**Deployed:** March 2026
**Status:** ✅ Fully operational in production

### What's New in v3.5.0
- ✅ **Hazard Tee-Shot Penalty Flow** - Par 4/5: selecting Hazard in Fairway now immediately shows a Tee Shot Penalty picker (+1/+2/+3)
- ✅ **GIR Auto-Deny Logic** - Par 4 + any tee penalty, Par 5 + ≥+2 penalty automatically denies GIR per strict PGA definition
- 🐛 **Stroke Counter Fix** - Live stroke counter now reflects tee penalties immediately
- 🐛 **Shots to Green Min** - Minimum drops to 1 after a tee penalty (player drops and plays from there)
- 🎨 **Par Label** - Renamed "Over/Under" label to "Par" in Current Round Stats card
- 🧹 **Redundant E Removed** - Removed duplicate Even indicator next to Course Par buttons

### Previous Release (v3.5.0)
- 🐛 **Completed Flag Fix** - Fixed rounds not being marked as complete due to validation stripping the `completed` field
- 🐛 **Dashboard Stats Display** - Fixed Dashboard not displaying stats (API response parsing issue)
- 🔧 **TypeScript Types** - Updated `loadStats()` return type to match actual API response

### Previous Release Highlights
- ✅ **GPS Course Finder** - Find nearby golf courses using your device's GPS location
- ✅ **Course Search** - Search for courses within 25 miles of your location
- ✅ **Admin Dashboard** - Comprehensive analytics and user management
- ✅ **PDF Reports** - Marketing-ready analytics reports with charts

---

## 🎯 Features

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

## 📱 How to Use

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

## 🚀 Quick Start

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

# Sync version numbers in all markdown files
npm run sync-version

# Production build (automatically syncs versions)
npm run build

# Preview production build
npm run preview
```

**Note:** The build process automatically syncs version numbers from `package.json` to all markdown files. You can also run `npm run sync-version` manually to update versions without building.

---

## 📚 Documentation

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

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** PHP 8.x, JSON file storage
- **PWA:** Service Worker, Web App Manifest
- **State Management:** TanStack Query (React Query)
- **Routing:** React Router v6
- **Deployment:** SiteGround, SSL required

---

## 🔒 Security

**Security Rating:** 🟢🟢 EXCELLENT (95/100)  
**Status:** Production Ready ✅

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

## 📊 Statistics Tracked

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

## 🚀 Deployment

### Production Deployment

1. **Build:** `npm run build`
2. **Upload:** All files from `/public/` to production `/public_html/`
3. **Create:** `/data/` directory outside public_html (755 permissions)
4. **Test:** `https://karlgolf.app`

**Note:** Build output goes to `/public/` folder (not `/dist/`). The build process automatically copies all necessary files including API, admin dashboard, and static assets.

See **[Architecture Documentation](docs/ARCHITECTURE.md)** for complete system overview.

---

## 🔮 Version 4.0.0 - Future Features

### Planned Enhancements
- **Course Selection** - Pre-populated US golf course database
- **Course Favorites** - Save favorite courses for quick selection
- **Statistics Trends** - Visual charts showing improvement over time
- **Round Comparison** - Compare stats between rounds side-by-side
- **Handicap Calculation** - USGA handicap calculation
- **Save Partial Nines** - Auto-save complete 9-hole sets to API

See **[TODOs](docs/TODOS.md)** for complete list of future features.

---

## 📋 Known Limitations

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

## 🎯 Created For

**Karl** - to help improve his golf game through data-driven insights.

---

**Created by:** Bailey at CLOUD VIRTUE
**Website:** [cloudvirtue.com](https://cloudvirtue.com)
**Repository:** Private
**License:** Proprietary
**Version:** 3.5.0 (Production)
