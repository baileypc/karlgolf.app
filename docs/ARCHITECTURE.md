# Karl's GIR - System Architecture

**Version:** 3.1.0  
**Last Updated:** November 2025

This document provides a comprehensive overview of the Karl's GIR system architecture for developers who need to understand, maintain, or rebuild the application.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Build Process](#build-process)
5. [Data Flow](#data-flow)
6. [Authentication System](#authentication-system)
7. [API Architecture](#api-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Admin Dashboard](#admin-dashboard)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

Karl's GIR is a Progressive Web App (PWA) for tracking golf statistics. It uses a **file-based storage system** (no database) with PHP backend and React frontend.

### Key Characteristics

- **No Database:** All data stored in JSON files
- **Dual Mode:** Works for both guest users (localStorage) and registered users (server storage)
- **PWA:** Installable, offline-capable, mobile-first
- **Session-Based Auth:** PHP sessions with httpOnly cookies
- **Auto-Calculated Scores:** Golf scoring logic built into the frontend

---

## Technology Stack

### Frontend
- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.2** - Build tool and dev server
- **React Router 7.9.5** - Client-side routing (hash-based)
- **TanStack Query 5.90.7** - Data fetching and caching
- **React Hot Toast 2.6.0** - Toast notifications
- **FontAwesome 7.1.0** - Icons

### Backend
- **PHP 8.x** - Server-side logic
- **JSON Files** - Data storage
- **File Locking** - Concurrent write protection
- **bcrypt** - Password hashing

### Infrastructure
- **SiteGround** - Production hosting
- **Laragon** - Local development (Windows)
- **HTTPS/SSL** - Required for production
- **Service Worker** - PWA offline support

---

## Directory Structure

```
karlgolf.app/
├── src/                          # TypeScript source code
│   ├── components/               # Reusable React components
│   │   ├── IconNav.tsx          # Top navigation bar
│   │   ├── Modal.tsx            # Modal component with hook
│   │   ├── PWAInstallPrompt.tsx # PWA install banner
│   │   └── ErrorBoundary.tsx    # Error handling
│   ├── pages/                   # Page components
│   │   ├── HomePage.tsx         # Landing page
│   │   ├── LoginPage.tsx        # Login/Register
│   │   ├── DashboardPage.tsx    # User dashboard
│   │   ├── TrackRoundPage.tsx   # Round tracking
│   │   ├── TrackLivePage.tsx    # Guest entry point
│   │   ├── ResetPasswordPage.tsx # Password reset
│   │   ├── OfflinePage.tsx      # Offline fallback
│   │   └── NotFoundPage.tsx     # 404 page
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   └── usePageTracking.ts   # Analytics tracking
│   ├── lib/                     # Utility libraries
│   │   ├── api.ts               # API client
│   │   ├── stats.ts             # Statistics calculations
│   │   ├── storage.ts           # localStorage wrapper
│   │   ├── csv-export.ts        # CSV export logic
│   │   └── analytics.ts         # Analytics tracking
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # Type definitions
│   ├── main.tsx                 # App entry point
│   └── App.tsx                  # Router configuration
│
├── public/                      # Static assets (copied to build)
│   ├── api/                     # PHP backend (copied during build)
│   │   ├── auth/                # Authentication endpoints
│   │   │   ├── login.php        # Login/register/check/logout
│   │   │   └── password-reset.php # Password reset
│   │   ├── rounds/              # Round management
│   │   │   ├── save.php         # Save round
│   │   │   ├── load.php         # Load rounds
│   │   │   ├── delete.php       # Delete round
│   │   │   └── incomplete.php   # Get incomplete rounds
│   │   ├── stats/               # Statistics
│   │   │   └── load.php         # Load user stats
│   │   ├── admin/               # Admin endpoints
│   │   │   ├── auth.php         # Admin authentication
│   │   │   ├── analytics.php    # Analytics data
│   │   │   ├── delete-user.php  # Delete user
│   │   │   └── user-stats.php   # Individual user stats
│   │   └── common/              # Shared PHP utilities
│   │       ├── session.php      # Session management
│   │       ├── file-lock.php    # File locking
│   │       ├── validation.php   # Input validation
│   │       ├── logger.php       # Logging utilities
│   │       ├── environment.php  # Environment detection
│   │       └── analytics-tracker.php # Analytics tracking
│   ├── admin/                   # Admin dashboard
│   │   ├── index.html           # Admin UI (React from CDN)
│   │   ├── admin-styles.css     # Admin styles
│   │   └── .htaccess            # Admin access control
│   ├── images/                  # Static images
│   │   └── karls_gir.png        # App logo
│   ├── icons/                   # PWA icons
│   ├── styles.css               # Global CSS (semantic variables)
│   ├── manifest.json            # PWA manifest
│   ├── service-worker.js        # Service worker
│   ├── .htaccess                # Apache configuration
│   └── index.html               # HTML template (Vite injects scripts)
│
├── api/                         # Source API files (copied to public during build)
├── admin/                       # Source admin files (copied to public during build)
├── data/                        # User data (local dev only)
│   └── {user_hash}/             # Per-user directories
│       ├── password.txt         # Hashed password
│       ├── email.txt            # User email
│       ├── rounds.json          # Completed rounds
│       ├── current_round.json   # Incomplete round
│       └── reset_token.json     # Password reset token
│
├── docs/                        # Documentation
├── pre-build.js                 # Pre-build script (version update)
├── build-deploy.js              # Post-build script (copy assets)
├── package.json                 # NPM dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # Main documentation
```

---

## Build Process

### Build Pipeline

```
npm run build
    ↓
1. pre-build.js          → Updates version in service-worker.js
    ↓
2. tsc                   → TypeScript compilation (type checking)
    ↓
3. vite build            → Bundles React app to public/
    ↓
4. build-deploy.js       → Copies api/, admin/, static assets to public/
    ↓
5. Output: public/       → Ready for deployment
```

### Build Scripts

**`pre-build.js`**
- Updates service worker cache version from package.json
- Ensures cache busting on new deployments

**`build-deploy.js`**
- Copies `/api/` folder to `/public/api/`
- Copies `/admin/` folder to `/public/admin/`
- Copies static assets (`.htaccess`, etc.)
- Updates service worker cache version
- Removes Vite build artifacts

### Output Structure

After build, `/public/` contains:
```
public/
├── index.html              # Main app entry
├── assets/                 # Bundled JS/CSS (hashed filenames)
│   ├── index-{hash}.js    # Main app bundle
│   ├── vendor-{hash}.js   # Vendor libraries
│   └── query-{hash}.js    # React Query
├── api/                    # PHP backend
├── admin/                  # Admin dashboard
├── images/                 # Static images
├── icons/                  # PWA icons
├── styles.css              # Global CSS
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker
└── .htaccess               # Apache config
```

---

## Data Flow

### User Registration Flow

```
User fills form → LoginPage.tsx
    ↓
handleRegister() → useAuth hook
    ↓
authAPI.register() → api/auth/login.php?action=register
    ↓
PHP validates email/password
    ↓
Creates /data/{hash}/ directory
    ↓
Saves password.txt (bcrypt hash)
    ↓
Saves email.txt
    ↓
Creates session ($_SESSION['user_email'], $_SESSION['user_hash'])
    ↓
Returns success → Frontend navigates to /track-round
```

### Round Tracking Flow (Registered User)

```
User enters hole data → TrackRoundPage.tsx
    ↓
calculateScore() → Auto-calculates score
    ↓
Saves to local state (holes array)
    ↓
On "Save Hole" → roundsAPI.saveRound()
    ↓
api/rounds/save.php
    ↓
Validates session
    ↓
Loads existing rounds.json or current_round.json
    ↓
Merges/appends hole data
    ↓
Writes to current_round.json (if incomplete)
    ↓
OR moves to rounds.json (if 9 or 18 holes)
    ↓
Returns success → Frontend updates UI
```

### Statistics Calculation Flow

```
User visits dashboard → DashboardPage.tsx
    ↓
useQuery(['stats']) → api/stats/load.php
    ↓
PHP loads rounds.json
    ↓
Calculates aggregate stats:
  - GIR percentage
  - Fairway percentage
  - Average putts
  - Scrambling percentage
  - Average score to par
    ↓
Returns JSON → Frontend displays stats
```

---

## Authentication System

### Session Management

**File:** `api/common/session.php`

```php
// Session configuration
session_set_cookie_params([
    'lifetime' => 0,           // Session cookie (expires on browser close)
    'path' => '/',
    'domain' => '',            // Current domain only
    'secure' => $isSecure,     // HTTPS only in production
    'httponly' => true,        // No JavaScript access
    'samesite' => 'Lax'        // CSRF protection
]);
```

### Authentication Flow

1. **Login:** User submits email/password
2. **Verification:** PHP verifies bcrypt hash
3. **Session Creation:** Sets `$_SESSION['user_email']` and `$_SESSION['user_hash']`
4. **Session Regeneration:** `session_regenerate_id(true)` for security
5. **Frontend State:** `useAuth` hook manages `isLoggedIn` state
6. **Persistence:** Session cookie persists across page loads

### Password Reset Flow

1. User requests reset → Email sent with 6-digit token
2. Token stored in `/data/{hash}/reset_token.json` (1-hour expiry)
3. User enters token → Validated against stored token
4. New password saved → Token deleted

---

## API Architecture

### Common Utilities

All API endpoints use shared utilities from `/api/common/`:

- **`session.php`** - Session initialization, auth checking
- **`file-lock.php`** - Prevents concurrent write conflicts
- **`validation.php`** - Email validation, input sanitization
- **`logger.php`** - Error/info logging
- **`environment.php`** - Production vs development detection
- **`analytics-tracker.php`** - User activity tracking

### API Endpoint Pattern

```php
<?php
require_once __DIR__ . '/../common/session.php';
require_once __DIR__ . '/../common/file-lock.php';
require_once __DIR__ . '/../common/validation.php';

initSession();  // Start session, set headers

$action = $_GET['action'] ?? '';

if ($action === 'example') {
    $auth = requireAuth();  // Exits if not logged in
    $userHash = $auth['userHash'];
    
    // Business logic here
    
    echo json_encode(['success' => true, 'data' => $result]);
    exit;
}
```

### File Locking

Prevents race conditions when multiple requests modify the same file:

```php
$lockFile = $userDir . '/.lock';
$lock = acquireLock($lockFile);

// Critical section - read/modify/write
$data = json_decode(file_get_contents($file), true);
$data[] = $newItem;
file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));

releaseLock($lock);
```

---

## Frontend Architecture

### State Management

- **React Query** - Server state (API data)
- **React State** - Local UI state
- **localStorage** - Guest user data, login state persistence

### Key Hooks

**`useAuth`** - Authentication state management
```typescript
const { isLoggedIn, login, register, logout } = useAuth();
```

**`useQuery`** - Data fetching with caching
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['stats'],
  queryFn: () => fetch('/api/stats/load.php'),
  staleTime: 5 * 60 * 1000  // 5 minutes
});
```

### Routing

Hash-based routing for compatibility with static hosting:

```typescript
<HashRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/track-round" element={<TrackRoundPage />} />
  </Routes>
</HashRouter>
```

---

## Admin Dashboard

### Architecture

- **Standalone HTML** - Not part of React build
- **React from CDN** - Uses unpkg.com for React/ReactDOM
- **Babel Standalone** - Compiles JSX in browser
- **Session-Based Auth** - Separate admin session

### Features

1. **Analytics Dashboard** - User metrics, engagement stats
2. **User Management** - View all users, delete users
3. **Individual User Stats** - Detailed per-user statistics
4. **PDF Reports** - Marketing reports with jsPDF

### Access Control

Protected by `.htaccess` and session check:
```php
if (!isset($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(['loggedIn' => false]);
    exit;
}
```

---

## Deployment Architecture

### Local Development (Laragon)

```
http://karlgolf.app.test/
├── Frontend: Vite dev server (port 3000)
├── Backend: Laragon PHP
└── Data: C:\Users\...\karlgolf.app\data\
```

### Production (SiteGround)

```
https://karlgolf.app/
├── Frontend: /public_html/ (static files)
├── Backend: /public_html/api/ (PHP)
├── Admin: /public_html/admin/
└── Data: /home/username/data/ (outside public_html)
```

### Environment Detection

**File:** `api/common/environment.php`

```php
function isProduction() {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    return !in_array($host, ['localhost', '127.0.0.1']) 
           && !str_ends_with($host, '.local')
           && !str_ends_with($host, '.test');
}
```

### Data Directory Location

- **Local:** `{project_root}/data/`
- **Production:** `/home/{username}/data/` (outside public_html for security)

---

## Security Features

1. **HTTPS Enforcement** - `.htaccess` redirects HTTP to HTTPS
2. **Content Security Policy** - Restricts script sources
3. **httpOnly Cookies** - Prevents XSS cookie theft
4. **bcrypt Password Hashing** - Industry-standard hashing
5. **Session Regeneration** - Prevents session fixation
6. **Input Validation** - Email validation, sanitization
7. **File Permissions** - Data directory outside web root (production)
8. **Rate Limiting** - Prevents brute force attacks

---

**For detailed deployment instructions, see [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)**  
**For development setup, see [DEVELOPMENT.md](DEVELOPMENT.md)**

