# Version History

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
- **Scoring Calculation** - Fixed critical bug where tee shot wasn't counted when GIR = No
- **Delete Hole Modal** - Fixed flickering and validation errors
- **Dashboard Layout** - Stats cards now show even with incomplete rounds
- **Footer Icons** - Fixed duplication issue

### 🔧 Technical Changes
- Updated session cookie configuration in `api/common/session.php`
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

### Known Issues
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

**Current Version:** 3.1.0 (Production)
**Next Version:** 4.0.0 (Future enhancements)

