# Admin Analytics Dashboard

**Location:** `/admin/index.html`  
**Version:** 3.0 (Updated for PWA v3)

## Features

### Authentication
- Protected by admin credentials stored in `data/admin/admin_credentials.json`
- Session-based authentication via PHP
- Login status persists across page refreshes

### Analytics Tracked

1. **Page Visits**
   - Tracks user visits to different pages
   - IP hashing for privacy
   - User agent and referrer tracking

2. **Signups**
   - New user registrations
   - Email tracking (hashed)
   - Signup date/time

3. **Round Events**
   - Round started
   - Round saved/completed
   - Round abandoned
   - Tracks both guest (live) and registered users
   - Hole count when abandoned

### Data Storage
- All analytics stored in `data/admin/analytics.json`
- File-lock mechanism prevents data corruption
- JSON format for easy querying

### API Endpoints

**Admin Authentication:**
- `POST /api/admin/auth.php?action=login` - Login
- `GET /api/admin/auth.php?action=logout` - Logout
- `GET /api/admin/auth.php?action=check` - Check auth status

**Analytics:**
- `GET /api/admin/analytics.php` - Get aggregated analytics
  - Optional params: `startDate`, `endDate` for filtering
  - Returns comprehensive market stats for app promotion

**Users:**
- `GET /api/admin/users.php` - Get list of all registered users
  - Returns user hash, email (if available), rounds count, signup date, last activity
  - Requires admin authentication

**Tracking (called from main app):**
- `POST /api/admin/track.php` - Track events from main app

### Tracking Functions (PHP Backend)

Located in `/api/common/analytics-tracker.php`:

```php
trackPageVisit($page, $ip, $userAgent, $referrer)
trackSignup($email, $ip, $userAgent)
trackRoundEvent($eventType, $roundType, $userHash, $holesCount, $completed)
```

### Main App Integration

Analytics client located at `/src/lib/analytics.ts`:

```typescript
Analytics.trackPageVisit(page)
Analytics.trackSignup(userHash)
Analytics.trackRoundEvent(eventType, roundType, userHash, holesCount, completed)
Analytics.trackLiveVersionVisit()
```

**Note:** Analytics tracking in main React app is currently not wired up to pages. Backend is ready for integration when needed.

## Admin Dashboard UI

### Key Stats Displayed:
- **Total Users** - Registered user count with conversion rate
- **Page Visits** - Total visits across all pages
- **Completion Rate** - Percentage of rounds completed
- **Active Users** - Users with rounds tracked

### Market Research Insights (for App Promotion):
- **User Acquisition** - Total signups with conversion rate and growth percentage
- **Daily Active Users (DAU)** - Users active in last 24 hours
- **Weekly Active Users (WAU)** - Users active in last 7 days
- **Engagement Score** - Composite score (0-100) based on completion, activity, and rounds per user
- **Retention Rate** - Percentage of users returning after 7 days
- **Average Rounds Per User** - Engagement metric
- **User Acquisition Trend** - 30-day visualization of signup patterns

### User Directory:
- Complete list of all registered users
- Email addresses (when available)
- User hash identifiers
- Rounds count per user
- Signup dates
- Last activity timestamps
- Sortable and filterable table view

### Additional Analytics:
- Page visit distribution
- Signup trends over time
- Round completion rates
- Live vs Registered user comparison
- Average holes before abandonment
- User journey funnel visualization
- Engagement & drop-off analysis
- Detailed activity logs (collapsible)

### Date Range Filtering
- Filter all analytics data by start/end date
- Real-time stats recalculation
- Preserves user directory (not filtered by date)

## Styling
- Standalone CSS at `/admin/admin-styles.css`
- **Updated to match Version 3 PWA design system:**
  - Black background (`#000000`)
  - Mint green accents (`#DDEDD2`)
  - Card-based layout with 20% opacity backgrounds
  - Modern stat cards with hover effects
  - Responsive design for mobile/desktop
  - Touch-friendly buttons (52px min height)
  - Consistent with main app visual identity

## Market Stats Calculation

### Daily Active Users (DAU)
- Counts unique users with round events in last 24 hours
- Based on userHash from round events

### Weekly Active Users (WAU)
- Counts unique users with round events in last 7 days
- Based on userHash from round events

### Engagement Score
- Composite metric (0-100) calculated as:
  - 40% completion rate
  - 30% weekly active user percentage
  - 30% rounds per user (capped at 10 rounds = 100 points)

### Retention Rate
- Percentage of users who return after 7 days from signup
- Calculated by checking if users have round events after their signup date + 7 days

### Growth Rate
- Compares signups in last 7 days vs previous 7 days
- Shows percentage change (positive or negative)

### Average Rounds Per User
- Total round starts divided by total registered users
- Indicates user engagement level

## User Directory Features

The user directory scans the `/data` directory for user folders:
- Identifies registered users by presence of `password.txt` file
- Attempts to retrieve email from rounds.json metadata (if stored)
- Counts rounds from `rounds.json` files
- Matches signup dates from analytics data
- Shows last activity from most recent round

**Note:** Email addresses may not be available for all users if not stored in rounds metadata. User hashes are always available.

## Security Notes
- Admin credentials separate from user accounts
- IP addresses hashed (SHA-256 with salt)
- Analytics data isolated from user rounds
- No PII stored in analytics (emails hashed on signup only)
- User directory only accessible to authenticated admins
- All API endpoints require admin session authentication
