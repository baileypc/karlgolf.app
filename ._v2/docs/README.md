# Karl's GIR - Golf Tracking App

A simple, mobile-friendly golf round tracker that helps analyze your game performance.

## Features

- **Auto-Calculated Scores**: No manual score entry - calculates based on your game situation
- **User Accounts**: Register and login to save your rounds and track progress over time
- **Dashboard**: View statistics across 10+ rounds with cumulative averages
- **Password Recovery**: Secure password reset via email
- **Comprehensive Tracking**: GIR, fairways, putts, penalties, scrambling, and more
- **Smart Analysis**: AI-powered insights on what's hurting your score most
- **Professional Stats**: Proximity, scrambling percentage, sand saves, and detailed breakdowns
- **Export Data**: Download your round data as CSV for further analysis
- **Email Results**: Send professional round summaries via email
- **Mobile Friendly**: Works great on your phone during your round
- **Crash-Proof**: Comprehensive validation prevents errors
- **Design System**: Professional golf-themed design using a five-color palette:
  - `#0a140a` - Dark background
  - `#DDEDD2` - Light green (borders, buttons, text)
  - `#F2D1A4` - Brown accent (secondary actions, highlights)
  - `#D4A574` - Gold (metric accents)
  - `#FFF8E7` - Cream (metric highlights)
- **Mobile-First UI/UX**: Complete redesign with hamburger menu, bottom navigation, and contextual navigation
- **Standardized Modals**: Unified modal system across all pages with consistent styling
- **Touch-Optimized**: Hidden scrollbars, 44px minimum touch targets, mobile-first responsive design
- **Edit Functionality**: Edit holes to correct mistakes (no delete, safer data management)

## How to Use

1. For each hole, record:
   - **Par** (3, 4, or 5)
   - **Distance** to hole (optional)
   - **Fairway** hit (auto-skipped on Par 3s)
   - **Green in Regulation** (Yes/No)
   - **Approach distance** (feet from hole when putting)
   - **Number of putts**
   - **Finish putt distance** (distance of final putt)
   - **Penalties** (if applicable)
   - **Sand saves/chip-ups** (if applicable)

2. **Score calculates automatically** - no manual entry needed!

3. View real-time statistics and AI-powered analysis as you play

3. Export your round data at the end for record keeping

## Tech Stack

- React 18 (via CDN)
- Tailwind CSS
- Pure JavaScript (no build process needed)
- Runs entirely in the browser

## Deployment

The app is ready for production deployment on SiteGround at `karlsgolf.app`.

**Quick Deploy:**
1. Upload all files to `public_html/` directory
2. Install SSL certificate (required for authentication)
3. Set `data/` directory permissions to 755
4. Visit `https://karlsgolf.app`

See **[SiteGround Deployment Guide](SITEGROUND-DEPLOYMENT.md)** for complete instructions.

**Note**: SSL certificate must be installed before authentication features will work.

## Documentation

- **[Quick Start Guide](docs/QUICK-START-V2.md)** - How to use the app
- **[Enhancements](docs/ENHANCEMENTS-V2.md)** - What's new in v2.0
- **[UI/UX v2.0 Implementation](docs/UI-UX-V2-IMPLEMENTATION-SUMMARY.md)** - Complete UI/UX redesign summary
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Technical deployment info
- **[Email Feature](docs/EMAIL-FEATURE.md)** - Email functionality details
- **[Quick Reference](docs/QUICK-REFERENCE.md)** - Feature overview
- **[Summary](docs/SUMMARY.md)** - Project summary
- **[Update Summary](docs/UPDATE-SUMMARY.md)** - Recent changes
- **[Security Assessment](docs/SECURITY-ASSESSMENT.md)** - Complete security analysis

## Security

This application implements enterprise-grade security measures:
- **Content Security Policy (CSP)** protection
- **HTTPS enforcement** with HSTS
- **Comprehensive security headers**
- **Input validation and sanitization**
- **Request method restrictions**

**Security Rating:** 🟢🟢 EXCELLENT (95/100)  
**Production Ready:** ✅ APPROVED

## Created for

Karl - to help improve his golf game through data-driven insights.
