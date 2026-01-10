# Product Requirements Document (PRD)
## Karl's GIR - Golf Statistics Tracker

**Version:** 2.0  
**Last Updated:** November 2024  
**Status:** Production

---

## 1. Executive Summary

### 1.1 Product Overview
Karl's GIR is a mobile-first web application designed to help golfers track detailed statistics during rounds and analyze performance over time. The app focuses on Green in Regulation (GIR) statistics and provides comprehensive tracking of scoring, putting, driving, and short game metrics.

### 1.2 Target Users
- **Primary:** High school and college golf students building performance portfolios
- **Secondary:** Serious recreational golfers seeking data-driven improvement
- **Tertiary:** Casual golfers wanting quick round tracking (limited functionality)

### 1.3 Core Value Proposition
- **Comprehensive Statistics:** Track GIR, fairways, putts, scrambling, proximity, and penalties
- **Mobile-Optimized:** Designed for use during rounds on mobile devices
- **Data-Driven Insights:** Professional-grade statistics to identify improvement areas
- **Portfolio Building:** Long-term tracking for students and competitive players
- **Offline Capable:** PWA functionality with local storage persistence

---

## 2. User Personas

### 2.1 Primary Persona: Competitive Student Golfer
- **Age:** 16-22
- **Goals:** Build statistics portfolio, track improvement, identify weaknesses
- **Needs:** Detailed stats, historical tracking, export capabilities, professional presentation
- **Pain Points:** Manual scorecard tracking, lack of detailed statistics, difficulty identifying patterns

### 2.2 Secondary Persona: Serious Recreational Golfer
- **Age:** 25-55
- **Goals:** Improve game, track progress, understand strengths/weaknesses
- **Needs:** Easy data entry, clear statistics, trend analysis
- **Pain Points:** Complex apps, poor mobile experience, lack of actionable insights

### 2.3 Tertiary Persona: Casual Golfer
- **Age:** Any
- **Goals:** Quick round tracking, basic statistics
- **Needs:** Simple interface, no account required, fast entry
- **Pain Points:** Registration barriers, complex features, data persistence

---

## 3. Functional Requirements

### 3.1 Landing Page / Home (`index.html`)

#### 3.1.1 Current Implementation ✅
- Welcome modal with three options:
  - Existing User Login
  - Track a Live Round (no account required)
  - Create an Account
- Auto-redirect based on login state
- PWA manifest and service worker registration
- Mobile-responsive design

#### 3.1.2 Requirements
- **FR-1.1:** Display welcome modal for first-time visitors
- **FR-1.2:** Provide clear navigation to login, registration, or live round tracking
- **FR-1.3:** Auto-redirect logged-in users to round tracking page
- **FR-1.4:** Support PWA installation on mobile devices
- **FR-1.5:** Maintain session state across browser tabs

---

### 3.2 Authentication System

#### 3.2.1 Current Implementation ✅
- User registration with email and password
- Login/logout functionality
- Password reset via email with secure tokens
- Session management with PHP sessions
- Password visibility toggles
- Secure password hashing (bcrypt)

#### 3.2.2 Requirements
- **FR-2.1:** User registration with email validation
- **FR-2.2:** Secure login with session management
- **FR-2.3:** Password reset functionality with email verification
- **FR-2.4:** Password strength requirements
- **FR-2.5:** Session persistence across browser sessions
- **FR-2.6:** Logout functionality with session cleanup

---

### 3.3 Round Entry Page - Registered Users (`track-round.html`)

#### 3.3.1 Current Implementation ✅
- Dynamic hole-by-hole entry form
- Course name selection/entry (modal after first hole)
- Incomplete round detection and continuation
- Real-time statistics display
- Hole editing capability
- Auto-save to server and localStorage
- Score entry (manual)
- Par selection (3, 4, 5)
- Fairway status (auto-skipped for Par 3s)
- GIR tracking (Yes/No)
- Shots to green (when GIR missed)
- Putt tracking with distances
- Penalty tracking
- Tee shot result tracking
- Approach distance tracking
- Round saving (9 or 18 holes)
- Email round summary option

#### 3.3.2 Data Fields Collected Per Hole
1. **Hole Number** (auto-incremented)
2. **Par** (3, 4, or 5) - Required
3. **Score** (manual entry) - Required
4. **Fairway Hit** (Yes/No) - Required for Par 4/5, skipped for Par 3
5. **Tee Shot Result** (if fairway missed: OB, Lost, Water, Left, Right, Other)
6. **Green in Regulation** (Yes/No) - Required
7. **Shots to Green** (if GIR missed) - Required
8. **Approach Distance** (feet from hole) - Optional
9. **Number of Putts** - Required
10. **Putt Distances** (array of distances for each putt) - Required
11. **Penalty** (OB, Water, Lost Ball, Wrong Ball, Other) - Optional

#### 3.3.3 Requirements
- **FR-3.1:** Dynamic form flow based on par and GIR status
- **FR-3.2:** Course name entry/selection after first hole
- **FR-3.3:** Incomplete round detection and continuation
- **FR-3.4:** Real-time statistics calculation and display
- **FR-3.5:** Hole editing capability (no delete, safer data management)
- **FR-3.6:** Auto-save to server and localStorage
- **FR-3.7:** Round saving after 9 or 18 holes
- **FR-3.8:** Email round summary option
- **FR-3.9:** Progress indicator (current hole number)
- **FR-3.10:** Back button to edit previous hole
- **FR-3.11:** Validation to prevent incomplete data submission

#### 3.3.4 Missing Features (Not Currently Implemented)
- **FR-3.12:** Tee selection (forward/middle/back) - **NOT IMPLEMENTED**
- **FR-3.13:** Date selector for round - **PARTIALLY IMPLEMENTED** (auto-set to today)
- **FR-3.14:** Distance to hole entry - **NOT IMPLEMENTED** (only approach distance exists)
- **FR-3.15:** Chip/approach location tracking (Front/Center/Back/Left/Right/Fringe/Bunker) - **NOT IMPLEMENTED**
- **FR-3.16:** Sand save tracking - **NOT IMPLEMENTED** (penalty tracking exists but not specific sand save stat)

---

### 3.4 Live Round Tracking - Non-Registered Users (`track-live.html`)

#### 3.4.1 Current Implementation ✅
- Same hole entry form as registered users
- LocalStorage-only persistence (no server sync)
- Round name entry
- CSV export functionality
- No dashboard or statistics
- No round saving to account

#### 3.4.2 Requirements
- **FR-4.1:** Full hole entry capability without account
- **FR-4.2:** LocalStorage persistence
- **FR-4.3:** CSV export functionality
- **FR-4.4:** No server-side data storage
- **FR-4.5:** Clear indication of limited functionality

---

### 3.5 Dashboard (`dashboard.html`)

#### 3.5.1 Current Implementation ✅
- Current round display (in-progress rounds)
- Cumulative statistics across all rounds
- Individual round cards (one per round, collapsible)
- Statistics displayed:
  - Scoring Average (totalScore / totalHoles)
  - GIR Percentage
  - Fairways Hit Percentage
  - Putts per GIR
  - Scrambling Percentage
  - Penalties
  - Approach Proximity (overall, on GIR, missed GIR)
- Round grouping (individual rounds, not 10-round groups)
- CSV export for cumulative stats
- CSV export per round group
- Reset dashboard functionality

#### 3.5.2 Requirements
- **FR-5.1:** Display current in-progress round with basic stats
- **FR-5.2:** Show cumulative statistics across all saved rounds
- **FR-5.3:** Display individual round cards with expandable details
- **FR-5.4:** Calculate and display key statistics accurately
- **FR-5.5:** Export functionality (CSV)
- **FR-5.6:** Reset dashboard with confirmation

#### 3.5.3 Missing Features (Not Currently Implemented)
- **FR-5.7:** Recent rounds list (last 5-10) - **PARTIALLY IMPLEMENTED** (all rounds shown, not limited)
- **FR-5.8:** Best round / Worst round display - **NOT IMPLEMENTED**
- **FR-5.9:** Quick action button to start new round - **NOT IMPLEMENTED** (link exists but not prominent)
- **FR-5.10:** Navigation menu - **NOT IMPLEMENTED** (only logout and rounds link)
- **FR-5.11:** Visual charts/graphs for trend analysis - **NOT IMPLEMENTED**

---

### 3.6 Statistics Page

#### 3.6.1 Current Implementation ⚠️
- Statistics are displayed on dashboard, but no dedicated statistics page exists
- No filtering options
- No date range selection
- No visual charts/graphs

#### 3.6.2 Requirements
- **FR-6.1:** Dedicated statistics page (separate from dashboard)
- **FR-6.2:** Filter options:
  - Current season
  - Last 10 rounds
  - Last 30 days
  - Custom date range
- **FR-6.3:** Scoring statistics section:
  - Scoring average
  - Best round
  - Worst round
  - Rounds played
- **FR-6.4:** GIR statistics section:
  - Overall GIR percentage
  - GIR by par type (Par 3/4/5 breakdown) - **NOT IMPLEMENTED**
- **FR-6.5:** Putting statistics section:
  - Average putts per round
  - Average putts per GIR
  - Average first putt distance
  - One-putt percentage - **NOT IMPLEMENTED**
- **FR-6.6:** Driving statistics section:
  - Fairway hit percentage
  - Miss tendency chart (left vs right vs penalty) - **NOT IMPLEMENTED**
- **FR-6.7:** Short game statistics section:
  - Up-and-down percentage (scrambling exists but not labeled as "up-and-down")
  - Scrambling percentage
  - Average chip proximity (proximity exists but not specifically "chip")
- **FR-6.8:** Visual charts/graphs for trend analysis - **NOT IMPLEMENTED**

---

### 3.7 Round History Page

#### 3.7.1 Current Implementation ⚠️
- Round history is displayed on dashboard as collapsible cards
- No dedicated round history page
- No delete functionality
- Export functionality exists

#### 3.7.2 Requirements
- **FR-7.1:** Dedicated round history page
- **FR-7.2:** Chronological list of all completed rounds
- **FR-7.3:** Display course name, date, and total score for each round
- **FR-7.4:** Tap/click to expand individual round for hole-by-hole scorecard view
- **FR-7.5:** Detailed round statistics per round:
  - GIR count
  - Total putts
  - Fairways hit
  - Penalties
- **FR-7.6:** Delete round option with confirmation - **NOT IMPLEMENTED**
- **FR-7.7:** Export round data option (CSV) - **IMPLEMENTED** (on dashboard)

---

### 3.8 Profile/Settings Page

#### 3.8.1 Current Implementation ❌
- **NOT IMPLEMENTED** - No profile or settings page exists

#### 3.8.2 Requirements
- **FR-8.1:** Player name and basic information entry
- **FR-8.2:** Season management:
  - Create new season
  - Archive previous seasons
  - View statistics by season
- **FR-8.3:** Goal setting:
  - Target scoring average
  - Target GIR percentage
  - Progress tracking toward goals
- **FR-8.4:** App preferences:
  - Measurement units (yards/meters) - **NOT IMPLEMENTED** (currently feet only)
  - Default tee selection - **NOT IMPLEMENTED**
- **FR-8.5:** Data management:
  - Export all data
  - Clear season data with confirmation
  - Account deletion option

---

### 3.9 Email Functionality

#### 3.9.1 Current Implementation ✅
- Round summary email after saving round
- Password reset email
- Professional HTML email templates
- Secure token system for password reset

#### 3.9.2 Requirements
- **FR-9.1:** Send round summary email after round completion
- **FR-9.2:** Send password reset email with secure token
- **FR-9.3:** Professional email templates matching app design
- **FR-9.4:** Email validation and error handling

---

### 3.10 Data Export

#### 3.10.1 Current Implementation ✅
- CSV export for individual rounds
- CSV export for cumulative statistics
- CSV export for round groups
- Comprehensive data included in exports

#### 3.10.2 Requirements
- **FR-10.1:** CSV export functionality
- **FR-10.2:** Include all hole-level data in exports
- **FR-10.3:** Include summary statistics in exports
- **FR-10.4:** Proper CSV formatting with headers

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1.1:** Page load time < 2 seconds on 3G connection
- **NFR-1.2:** Form submission response time < 500ms
- **NFR-1.3:** Statistics calculation < 100ms for 100+ rounds
- **NFR-1.4:** Mobile-optimized rendering

### 4.2 Usability
- **NFR-2.1:** Touch-friendly buttons (minimum 44x44px)
- **NFR-2.2:** Clear visual hierarchy
- **NFR-2.3:** Intuitive navigation
- **NFR-2.4:** Error messages in plain language
- **NFR-2.5:** Validation feedback before submission

### 4.3 Reliability
- **NFR-3.1:** Auto-save functionality to prevent data loss
- **NFR-3.2:** Offline capability via PWA
- **NFR-3.3:** Data validation to prevent errors
- **NFR-3.4:** Graceful error handling

### 4.4 Security
- **NFR-4.1:** HTTPS enforcement
- **NFR-4.2:** Secure password hashing (bcrypt)
- **NFR-4.3:** Session security (httponly, secure cookies)
- **NFR-4.4:** Input validation and sanitization
- **NFR-4.5:** Content Security Policy (CSP)
- **NFR-4.6:** XSS protection
- **NFR-4.7:** CSRF protection

### 4.5 Compatibility
- **NFR-5.1:** Support modern browsers (Chrome, Safari, Firefox, Edge)
- **NFR-5.2:** Mobile-first responsive design
- **NFR-5.3:** PWA support for iOS and Android
- **NFR-5.4:** Works on screen sizes 320px and above

### 4.6 Accessibility
- **NFR-6.1:** Semantic HTML structure
- **NFR-6.2:** Keyboard navigation support
- **NFR-6.3:** Color contrast ratios meet WCAG AA standards
- **NFR-6.4:** Screen reader compatibility (future enhancement)

---

## 5. Technical Architecture

### 5.1 Technology Stack
- **Frontend:**
  - React 18 (via CDN)
  - Tailwind CSS
  - Vanilla JavaScript (no build process)
  - PWA (Service Worker, Manifest)
- **Backend:**
  - PHP 7.4+
  - File-based data storage (JSON)
  - Session management
- **Infrastructure:**
  - Apache web server
  - SSL/TLS encryption
  - SiteGround hosting

### 5.2 Data Storage
- **User Data:** `/data/{userHash}/rounds.json`
- **Current Round:** `/data/{userHash}/current_round.json`
- **Passwords:** `/data/{userHash}/password.txt` (hashed)
- **File Structure:** One directory per user (hashed email)

### 5.3 API Endpoints
- `api/auth/login.php` - Authentication
- `api/auth/password-reset.php` - Password reset
- `api/rounds/save.php` - Save round data
- `api/rounds/sync.php` - Sync current round
- `api/rounds/incomplete.php` - Get incomplete rounds
- `api/rounds/courses.php` - Get course names
- `api/stats/load.php` - Load statistics
- `api/email/send.php` - Send emails

### 5.4 Design System
- **Color Palette:**
  - `#0a140a` - Dark background
  - `#DDEDD2` - Light green (primary)
  - `#F2D1A4` - Brown accent
  - `#D4A574` - Gold accent
  - `#FFF8E7` - Cream highlight
- **Typography:** System fonts (San Francisco, Segoe UI, Roboto)
- **Spacing:** Tailwind CSS spacing scale
- **Components:** React functional components

---

## 6. Statistics Calculations

### 6.1 Implemented Statistics ✅
1. **Scoring Average:** `totalScore / totalHoles`
2. **GIR Percentage:** `(girsHit / totalHoles) × 100`
3. **Fairway Hit Percentage:** `(fairwaysHit / eligibleFairways) × 100` (Par 4/5 only)
4. **Putts per GIR:** `totalPuttsOnGIR / girHolesCount`
5. **Scrambling Percentage:** `(scrambles / missedGirs) × 100`
6. **Average Putts per Round:** `totalPutts / totalHoles`
7. **Approach Proximity:**
   - Overall: `sum(approachDistances) / count(approaches)`
   - On GIR: `sum(girApproachDistances) / count(girApproaches)`
   - Missed GIR: `sum(missedGirApproachDistances) / count(missedGirApproaches)`
8. **Penalties:** Count and total penalty strokes
9. **To Par:** `totalScore - totalPar`

### 6.2 Missing Statistics (Not Currently Calculated)
1. **GIR by Par Type:** Separate GIR% for Par 3, Par 4, Par 5
2. **One-Putt Percentage:** `(onePutts / totalHoles) × 100`
3. **Three-Putt Percentage:** `(threePutts / totalHoles) × 100`
4. **Miss Tendency:** Left vs Right vs Penalty breakdown
5. **Sand Save Percentage:** `(sandSaves / sandOpportunities) × 100`
6. **Best Round:** Lowest score
7. **Worst Round:** Highest score
8. **Average First Putt Distance:** `sum(firstPuttDistances) / count(firstPutts)`

---

## 7. User Flows

### 7.1 New User Registration Flow
1. User lands on home page
2. Clicks "Create an Account"
3. Enters email and password
4. Account created, auto-logged in
5. Redirected to round tracking page
6. After first hole, prompted for course name
7. Round continues, data auto-saves

### 7.2 Existing User Login Flow
1. User lands on home page
2. Clicks "Existing User Login"
3. Enters email and password
4. Logged in, redirected to round tracking page
5. If incomplete round exists, prompted to continue
6. Otherwise, starts new round

### 7.3 Live Round Tracking Flow (No Account)
1. User lands on home page
2. Clicks "Track a Live Round"
3. Enters round name
4. Tracks holes (same form as registered users)
5. Data saved to localStorage only
6. Can export CSV
7. Data lost if localStorage cleared

### 7.4 Round Completion Flow
1. User completes 9 or 18 holes
2. Clicks "Save Round"
3. Round saved to account
4. Option to email round summary
5. Redirected to dashboard
6. Round appears in dashboard statistics

---

## 8. Future Enhancements (Not in Current Scope)

### 8.1 Planned Features
- Visual charts and graphs for trend analysis
- Dedicated statistics page with filters
- Round history page with delete functionality
- Profile/settings page
- Season management
- Goal setting and tracking
- Tee selection
- GIR by par type breakdown
- One-putt percentage tracking
- Miss tendency visualization
- Best/worst round display

### 8.2 Potential Features
- Social sharing of rounds
- Comparison with friends
- Course database integration
- Handicap calculation
- Tournament mode
- Practice round tracking
- Shot tracking (advanced)
- GPS integration
- Photo attachments
- Notes per hole

---

## 9. Success Metrics

### 9.1 User Engagement
- Number of registered users
- Rounds tracked per user
- Average rounds per month
- User retention rate

### 9.2 Feature Usage
- Percentage of users using email feature
- Percentage of users exporting data
- Average holes tracked per round
- Incomplete round completion rate

### 9.3 Performance
- Page load times
- Form submission success rate
- Error rate
- Data accuracy (user-reported issues)

---

## 10. Appendix

### 10.1 Glossary
- **GIR:** Green in Regulation - reaching the green in the expected number of strokes (Par 3: 1 shot, Par 4: 2 shots, Par 5: 3 shots)
- **Scrambling:** Making par or better after missing GIR
- **Up-and-Down:** Same as scrambling (making par after missing GIR)
- **Proximity:** Distance from hole when putting
- **Approach Distance:** Distance from hole on approach shot (when putting)

### 10.2 Data Model
```json
{
  "roundNumber": 1,
  "courseName": "Course Name",
  "date": "2024-11-06",
  "timestamp": "2024-11-06 11:43:26",
  "holes": [
    {
      "holeNumber": 1,
      "par": 3,
      "score": 2,
      "gir": true,
      "putts": 1,
      "puttDistances": [23],
      "fairway": null,
      "teeShotResult": null,
      "approachDistance": 23,
      "penalty": "",
      "shotsToGreen": null
    }
  ],
  "stats": {
    "totalHoles": 18,
    "totalScore": 72,
    "totalPar": 72,
    "toPar": 0,
    "avgScore": 4.0,
    "girsHit": 12,
    "girPct": 66.7,
    "fairwaysHit": 10,
    "fairwayPct": 66.7,
    "totalPutts": 30,
    "avgPutts": 1.67,
    "puttsPerGIR": 1.5,
    "scrambles": 4,
    "scramblingPct": 66.7,
    "penalties": 0,
    "totalPenaltyStrokes": 0,
    "avgProximity": 20.5,
    "avgProximityGIR": 18.2,
    "avgProximityMissed": 25.0
  }
}
```

### 10.3 File Structure
```
karlgolf.app/
├── index.html (Landing page)
├── login.html (Login/Registration)
├── reset-password.html (Password reset)
├── track-round.html (Registered user round tracking)
├── track-live.html (Non-registered user round tracking)
├── dashboard.html (Statistics dashboard)
├── api/
│   ├── auth/ (Authentication endpoints)
│   ├── rounds/ (Round management endpoints)
│   ├── stats/ (Statistics endpoints)
│   └── email/ (Email endpoints)
├── assets/
│   ├── css/ (Stylesheets)
│   ├── js/ (JavaScript modules)
│   └── images/ (Images and icons)
├── data/ (User data storage)
└── docs/ (Documentation)
```

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 2024 | Initial | Initial PRD based on functional requirements |
| 2.0 | Nov 2024 | Updated | Comprehensive PRD based on actual implementation |

---

**Document Status:** Complete  
**Next Review:** As features are added or requirements change

