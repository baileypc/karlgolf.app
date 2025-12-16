# Karl's GIR - System Diagrams

**Version:** 3.2.1  
**Last Updated:** December 2025

This document contains visual diagrams of the Karl's GIR system architecture using Mermaid.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [User Authentication Flow](#user-authentication-flow)
3. [Round Tracking Flow](#round-tracking-flow)
4. [Build Process](#build-process)
5. [Data Storage Structure](#data-storage-structure)
6. [API Request Flow](#api-request-flow)
7. [Admin Dashboard Architecture](#admin-dashboard-architecture)

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        A[User Browser]
        B[React App]
        C[Service Worker]
        D[localStorage]
    end
    
    subgraph "Backend (PHP)"
        E[API Endpoints]
        F[Session Management]
        G[File Operations]
    end
    
    subgraph "Storage"
        H[JSON Files]
        I[User Data Directory]
    end
    
    subgraph "Admin"
        J[Admin Dashboard]
        K[Admin API]
    end
    
    A -->|HTTPS| B
    B -->|API Calls| E
    B -->|Guest Data| D
    B -->|Offline Cache| C
    E -->|Auth Check| F
    E -->|Read/Write| G
    G -->|File Lock| H
    H -->|Per User| I
    J -->|Admin Auth| K
    K -->|Analytics| I
```

---

## User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant A as API (PHP)
    participant S as Session
    participant D as Data Files
    
    U->>F: Enter email/password
    F->>A: POST /api/auth/login.php?action=register
    A->>A: Validate email format
    A->>A: Hash password (bcrypt)
    A->>D: Create /data/{hash}/ directory
    A->>D: Save password.txt
    A->>D: Save email.txt
    A->>S: Create session ($_SESSION)
    A->>A: session_regenerate_id()
    A->>F: Return success
    F->>F: Update isLoggedIn state
    F->>U: Navigate to /track-round
```

---

## Round Tracking Flow

```mermaid
sequenceDiagram
    participant U as User
    participant T as TrackRoundPage
    participant C as Score Calculator
    participant API as Rounds API
    participant F as File System
    
    U->>T: Enter hole data (par, GIR, putts, etc.)
    T->>C: calculateScore(holeData)
    C->>C: Apply golf scoring rules
    C->>T: Return calculated score
    T->>T: Add to holes array
    U->>T: Click "Save Hole"
    T->>API: POST /api/rounds/save.php
    API->>API: Check session auth
    API->>F: Load current_round.json
    API->>F: Append hole data
    
    alt Round Complete (9 or 18 holes)
        API->>F: Move to rounds.json
        API->>F: Delete current_round.json
    else Round Incomplete
        API->>F: Update current_round.json
    end
    
    API->>T: Return success
    T->>U: Show success message
```

---

## Build Process

```mermaid
flowchart TD
    A[npm run build] --> B[pre-build.js]
    B --> C[Update service-worker.js version]
    C --> D[tsc - TypeScript Compilation]
    D --> E{Type Errors?}
    E -->|Yes| F[Build Fails]
    E -->|No| G[vite build]
    G --> H[Bundle React App]
    H --> I[Output to /public/]
    I --> J[build-deploy.js]
    J --> K[Copy /api/ to /public/api/]
    J --> L[Copy /admin/ to /public/admin/]
    J --> M[Copy static assets]
    J --> N[Update service worker cache]
    J --> O[Remove .vite artifacts]
    O --> P[Build Complete - /public/ ready]
    P --> Q{Deploy?}
    Q -->|Yes| R[Upload /public/* to /public_html/]
    Q -->|No| S[Test locally]
```

---

## Data Storage Structure

```mermaid
graph TB
    subgraph "Production: /home/username/data/"
        A[data/]
        A --> B[user_hash_1/]
        A --> C[user_hash_2/]
        A --> D[user_hash_n/]
    end
    
    subgraph "Per User Directory"
        B --> E[password.txt - bcrypt hash]
        B --> F[email.txt - user email]
        B --> G[rounds.json - completed rounds]
        B --> H[current_round.json - incomplete round]
        B --> I[reset_token.json - password reset]
        B --> J[.lock - file lock]
    end
    
    subgraph "rounds.json Structure"
        G --> K["[{
            courseName: string,
            date: timestamp,
            holes: Hole[]
        }]"]
    end
    
    subgraph "Hole Structure"
        K --> L["{
            holeNumber: 1-18,
            par: 3|4|5,
            score: number,
            gir: boolean,
            putts: number,
            fairway: l|c|r|null,
            shotsToGreen: number,
            penalty: string|null
        }"]
    end
```

---

## API Request Flow

```mermaid
flowchart TD
    A[Client Request] --> B{Request Type}
    
    B -->|GET| C[api/stats/load.php]
    B -->|POST| D[api/rounds/save.php]
    B -->|POST| E[api/auth/login.php]
    
    C --> F[initSession]
    D --> F
    E --> F
    
    F --> G[requireAuth or checkAuth]
    
    G --> H{Authenticated?}
    H -->|No| I[Return 401 Unauthorized]
    H -->|Yes| J[Get userHash from session]
    
    J --> K[acquireLock]
    K --> L[Read JSON file]
    L --> M[Process data]
    M --> N[Write JSON file]
    N --> O[releaseLock]
    O --> P[Return JSON response]
    
    I --> Q[Client handles error]
    P --> R[Client updates UI]
```

---

## Admin Dashboard Architecture

```mermaid
graph TB
    subgraph "Admin Dashboard (Standalone)"
        A[admin/index.html]
        B[React from CDN]
        C[Babel Standalone]
        D[jsPDF Library]
    end
    
    subgraph "Admin API"
        E[admin/auth.php]
        F[admin/analytics.php]
        G[admin/delete-user.php]
        H[admin/user-stats.php]
    end
    
    subgraph "Data Access"
        I[All User Directories]
        J[Analytics Aggregation]
    end
    
    A --> B
    A --> C
    A --> D
    A -->|Login| E
    A -->|Dashboard| F
    A -->|Delete User| G
    A -->|View Stats| H
    
    E -->|Session| K[Admin Session]
    F -->|Read All| I
    G -->|Delete| I
    H -->|Read One| I
    
    F --> J
    J -->|Metrics| L[DAU, WAU, Signups, etc.]
    
    D -->|Generate| M[PDF Report]
```

---

## Guest vs Registered User Flow

```mermaid
flowchart TD
    A[User Opens App] --> B{Logged In?}
    
    B -->|No - Guest| C[localStorage Only]
    B -->|Yes - Registered| D[Server Storage]
    
    C --> E[Track Round]
    D --> E
    
    E --> F[Enter Hole Data]
    F --> G{User Type?}
    
    G -->|Guest| H[Save to localStorage]
    G -->|Registered| I[Save to Server API]
    
    H --> J[Data persists on device only]
    I --> K[Data synced to server]
    
    J --> L{Create Account?}
    L -->|Yes| M[Migrate localStorage to Server]
    L -->|No| N[Continue as Guest]
    
    M --> K
```

---

## Score Calculation Logic

```mermaid
flowchart TD
    A[User Enters Hole Data] --> B{GIR?}
    
    B -->|Yes| C[Score = par - 2 + putts + penalties]
    B -->|No| D[Score = 1 tee + shotsToGreen + putts + penalties]
    
    C --> E{Validate Score}
    D --> E
    
    E --> F{Score >= Par - 2?}
    F -->|Yes| G[Valid Score]
    F -->|No| H[Show Warning - Possible Error]
    
    G --> I[Save Hole]
    H --> I
    
    I --> J{Hole Count}
    J -->|9 or 18| K[Complete Round]
    J -->|Other| L[Incomplete Round]
    
    K --> M[Move to rounds.json]
    L --> N[Save to current_round.json]
```

---

## Session Management Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend
    participant A as API
    participant S as PHP Session
    
    Note over B,S: Initial Page Load
    B->>F: Load App
    F->>A: GET /api/auth/login.php?action=check
    A->>S: Check $_SESSION['user_email']
    
    alt Session Exists
        S->>A: Return user data
        A->>F: {loggedIn: true, email: "..."}
        F->>F: Set isLoggedIn = true
    else No Session
        S->>A: No session data
        A->>F: {loggedIn: false}
        F->>F: Set isLoggedIn = false
    end
    
    Note over B,S: User Logs In
    B->>F: Submit login form
    F->>A: POST /api/auth/login.php?action=login
    A->>A: Verify password
    A->>S: $_SESSION['user_email'] = email
    A->>S: $_SESSION['user_hash'] = hash
    A->>A: session_regenerate_id(true)
    A->>F: {success: true}
    F->>F: Set isLoggedIn = true
    F->>B: Navigate to /track-round
```

---

## PWA Architecture

```mermaid
graph TB
    subgraph "Browser"
        A[User]
        B[React App]
        C[Service Worker]
    end
    
    subgraph "Cache Storage"
        D[App Shell Cache]
        E[API Cache]
        F[Image Cache]
    end
    
    subgraph "Network"
        G[API Server]
        H[Static Assets]
    end
    
    A -->|Interact| B
    B -->|Register| C
    
    C -->|Cache First| D
    C -->|Network First| E
    C -->|Cache First| F
    
    D -.->|Fallback| H
    E -.->|Fallback| G
    
    B -->|Offline?| I{Network Available?}
    I -->|No| C
    I -->|Yes| G
    
    C -->|Serve from Cache| B
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development (Local)"
        A[Vite Dev Server :3000]
        B[Laragon PHP]
        C[Local Data Directory]
    end
    
    subgraph "Build Process"
        D[npm run build]
        E[/public/ folder]
    end
    
    subgraph "Production (SiteGround)"
        F[/public_html/]
        G[Apache + PHP]
        H[/home/username/data/]
    end
    
    A -->|Proxy /api/*| B
    B -->|Read/Write| C
    
    D --> E
    E -->|FTP Upload| F
    
    F --> G
    G -->|Read/Write| H
    
    I[User Browser] -->|HTTPS| F
```

---

**For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)**  
**For development setup, see [DEVELOPMENT.md](DEVELOPMENT.md)**

