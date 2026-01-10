# Karl's GIR - Quick Reference

## Access
🔗 **URL**: https://karlsgolf.app

## Quick Deploy
```bash
# Via SiteGround File Manager:
1. Upload all files to public_html/ (root directory)
2. Install SSL certificate
3. Visit https://karlsgolf.app
```

## Features at a Glance
✅ Track GIR (Greens in Regulation)  
✅ Track Fairways Hit  
✅ Record Putts & Distances  
✅ Sand Saves & Chip-Ups  
✅ Real-Time Analysis  
✅ Smart Recommendations  
✅ User Accounts & Authentication  
✅ Password Recovery  
✅ Dashboard for Long-Term Stats  
✅ CSV Export  
✅ Email Round Results  
✅ Mobile Optimized  
✅ Five-Color Design System:
   - `#0a140a` - Dark background
   - `#DDEDD2` - Light green (borders, buttons, text)
   - `#F2D1A4` - Brown accent
   - `#D4A574` - Gold (metric accents)
   - `#FFF8E7` - Cream (metric highlights)  

## What Gets Tracked Per Hole
1. **Green in Regulation** - Did you reach the green in regulation strokes?
2. **Fairway** - Did you hit the fairway? (Center/Left/Right)
3. **Putts** - How many putts did you take?
4. **Putt Length** - Distance of first putt (feet)
5. **Sand Save** - Did you save par from a bunker?
6. **Chip Up** - Did you chip in or get up & down?

## Analysis Provides
📊 **Stats Tracked**:
- GIRs: X/18
- Fairways: X/18
- Total Putts (with average)
- Up & Downs
- 3-Putts count
- Sand Saves

🎯 **Smart Feedback**:
- Identifies biggest weakness
- Provides practice recommendations
- Analyzes patterns in your game

## How to Use
1. **Start Round** - Open app on phone
2. **After Each Hole** - Record your stats
3. **During Round** - Check real-time analysis
4. **After Round** - Export CSV for records

## Technology
- React 18 (CDN)
- Tailwind CSS
- No build process
- No server needed
- Works offline

## Files
```
karlsgolf.app/
├── index.html              # Landing page
├── login.html              # Authentication
├── dashboard.html          # Statistics dashboard
├── reset-password.html     # Password reset
├── track-live.html         # Live round (no login)
├── track-round.html        # Round tracking (logged in)
├── api/                    # API endpoints
│   ├── auth/              # Authentication
│   ├── rounds/            # Round management
│   ├── stats/             # Statistics
│   └── email/             # Email functionality
├── assets/                 # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── images/            # Images
├── service-worker.js       # PWA support
├── manifest.json           # PWA manifest
├── .htaccess              # Security headers
└── data/                  # User data (auto-created)
```

## Export Format
CSV with columns:
- Hole Number
- GIR (true/false)
- Fairway (true/false)
- Fairway Direction
- Putts
- Putt Length
- Sand Save
- Chip Up

## Browser Support
✅ Chrome, Edge, Safari, Firefox (all modern versions)  
✅ Mobile browsers (iOS Safari, Chrome Android)  

## Data Storage
- **Guest Mode**: Data stored in browser localStorage
- **User Accounts**: Rounds saved to user account (10+ rounds unlocks dashboard)
- **Privacy**: Secure password hashing, no email storage
- **Reset**: Clears current round data
- **Export**: Download CSV to device

---
**Need Help?** Contact Bailey @ cloudvirtue.com
