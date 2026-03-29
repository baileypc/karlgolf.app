# 🚀 Karl's GIR - Production Deployment Guide

**Version:** 3.6.7
**Last Updated:** December 2025

This guide covers deploying Karl's GIR to SiteGround production hosting.

---

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] Admin dashboard tested
- [ ] Account creation/deletion tested
- [ ] Round tracking tested
- [ ] Stats calculation verified
- [ ] Password reset tested
- [ ] Session authentication working

---

## 🏗️ SiteGround File Structure

### **CRITICAL: Data Storage Location**

Your SiteGround directory structure:

```
/home/yourusername/
├── public_html/              ← Web-accessible (upload /public/ contents here)
│   ├── index.html
│   ├── assets/               ← Bundled JS/CSS (hashed filenames)
│   ├── api/                  ← PHP backend
│   ├── admin/                ← Admin dashboard
│   ├── images/               ← Static images
│   ├── icons/                ← PWA icons
│   ├── service-worker.js
│   ├── manifest.json
│   ├── styles.css
│   └── .htaccess
│
└── data/                     ← User data (OUTSIDE public_html)
    ├── admin/
    │   ├── admin_credentials.json
    │   └── analytics.json
    ├── logs/
    │   └── app.log
    └── {user_hash}/
        ├── password.txt
        ├── email.txt
        ├── rounds.json
        ├── current_round.json (optional sync state)
        └── reset_token.json
```

**Why this matters:**
- ✅ `/data/` is OUTSIDE `public_html` so it's NOT overwritten when you redeploy
- ✅ User accounts, rounds, and analytics persist between deployments
- ✅ Only code updates, data stays safe
- ✅ More secure - data not web-accessible

---

## 📤 First-Time Deployment Steps

### **Step 1: Build the App**
```bash
npm run build
```

This creates the `/public/` folder with all production files ready for deployment.

**Build output includes:**
- Frontend app (React bundle in `/public/assets/`)
- Backend API (copied from `/api/` to `/public/api/`)
- Admin dashboard (copied from `/admin/` to `/public/admin/`)
- Static assets (images, icons, manifest, service worker)
- Configuration files (`.htaccess`)

### **Step 2: Upload to SiteGround**

**Option A: FTP/SFTP (Recommended)**
1. Connect to SiteGround via SFTP (FileZilla, WinSCP, etc.)
2. Navigate to `/home/yourusername/public_html/`
3. Upload **ALL contents** of your local `/public/` folder to `public_html/`
   - `index.html`
   - `assets/` folder (bundled JS/CSS)
   - `api/` folder (PHP backend)
   - `admin/` folder (admin dashboard)
   - `images/` folder
   - `icons/` folder
   - `service-worker.js`
   - `manifest.json`
   - `styles.css`
   - `.htaccess`

**Option B: SiteGround File Manager**
1. Login to SiteGround control panel
2. Go to Site Tools → File Manager
3. Navigate to `public_html/`
4. Upload all files from your local `/public/` folder

**Important:** Upload the **contents** of `/public/`, not the `/public/` folder itself.

### **Step 3: Verify Data Directory**

After first deployment:

1. **Create a test account** at `https://karlgolf.app/`
2. **Check file structure via SFTP or File Manager:**
   - Look for `/home/yourusername/data/` (NOT in public_html)
   - You should see a folder with a hash name (your test user)
3. **If data is in the WRONG place** (`/public_html/data/`):
   - Manually create `/home/yourusername/data/` folder
   - Set permissions to `755`
   - Move existing data from `/public_html/data/` to `/data/`
   - Delete `/public_html/data/`

### **Step 4: Test Everything**

**Core Functionality:**
- [ ] Visit `https://karlgolf.app/`
- [ ] Register a new account
- [ ] Login (should redirect to /track-round)
- [ ] Track a round (9+ holes)
- [ ] Save the round
- [ ] View dashboard stats (click chart icon)
- [ ] Logout and login again
- [ ] Password reset flow

**Admin Dashboard:**
- [ ] Visit `https://karlgolf.app/admin/`
- [ ] Login with admin credentials
- [ ] View analytics dashboard
- [ ] View individual user stats
- [ ] Download PDF report
- [ ] Delete test user

**PWA Features:**
- [ ] Install prompt appears (mobile)
- [ ] Service worker registers
- [ ] Offline mode works
- [ ] App shortcuts work

---

## 🔄 Subsequent Deployments (Updates)

### **When you need to update the app:**

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload `/public/` folder contents to `/public_html/`**
   - This overwrites code files only
   - **Does NOT touch `/data/` folder** ✅

3. **Clear server cache (SiteGround):**
   - Go to Site Tools → Speed → Caching
   - Click "Purge All Caches"
   - This ensures users get the latest version

4. **User data is preserved:**
   - All user accounts remain intact
   - All rounds remain intact
   - All analytics remain intact

### **What gets updated:**
- ✅ Frontend code (React app in `/assets/`)
- ✅ Backend API code (PHP files in `/api/`)
- ✅ Admin dashboard code (`/admin/`)
- ✅ Service worker (cache version auto-increments)
- ✅ Styles and static assets

### **What stays untouched:**
- ✅ User accounts (`/data/{hash}/`)
- ✅ Admin credentials (`/data/admin/admin_credentials.json`)
- ✅ Analytics data (`/data/admin/analytics.json`)
- ✅ Logs (`/data/logs/app.log`)

---

## 🔐 Security Checklist

After deployment, verify:

- [ ] HTTPS is working (SiteGround should auto-redirect)
- [ ] `.htaccess` is in place (security headers)
- [ ] Admin dashboard requires login
- [ ] Rate limiting is working (try 6 failed logins)
- [ ] Session cookies are secure
- [ ] Password reset emails work (check spam folder)

---

## 🐛 Troubleshooting

### **Problem: Data folder is in public_html instead of root**

**Solution:**
1. Via SFTP, manually create `/home/yourusername/data/` folder
2. Set permissions to `755`
3. Move existing data from `/public_html/data/` to `/data/`
4. Delete `/public_html/data/`
5. Test by creating a new account

### **Problem: "Failed to create data directory" error**

**Solution:**
1. Check folder permissions on `/data/` (should be `755`)
2. Check PHP user has write access
3. Contact SiteGround support if needed

### **Problem: Users lost after redeployment**

**Cause:** Data was stored in `/public_html/data/` and got overwritten

**Solution:**
1. Check if SiteGround has backups (they usually do)
2. Restore `/public_html/data/` from backup
3. Move it to `/data/` at root level
4. Redeploy with fixed `data-path.php`

### **Problem: Admin login not working**

**Solution:**
1. Check if `/data/admin/admin_credentials.json` exists
2. If not, it will be auto-created on first admin login attempt
3. Default credentials:
   - Username: `karl`
   - Password: `+1 867-5309 Jenny`

---

## 📊 Monitoring

### **Check Logs:**
- Location: `/data/logs/app.log`
- View via SFTP or File Manager
- Look for errors, warnings, or suspicious activity

### **Check Analytics:**
- Login to admin dashboard: `https://karlgolf.app/admin/`
- View user signups, page visits, round events

---

## 🔮 Future: Database Migration

**When to consider migrating to a database:**
- 100+ active users
- Performance issues with file I/O
- Need for complex queries (leaderboards, user comparisons)
- Want automated backups

**Database options on SiteGround:**
- MySQL (recommended)
- PostgreSQL

**Migration plan:**
- Create migration script to import JSON data to database
- Update API endpoints to use database queries
- Keep file-based system as fallback/backup

---

## 📞 Support

If you encounter issues:
1. Check `/data/logs/app.log` for errors
2. Test locally first to isolate production-specific issues
3. Verify file permissions on SiteGround
4. Contact SiteGround support for server-level issues

---

## ✅ Deployment Complete!

Your app is now live at: **https://karlgolf.app/** 🎉⛳

Remember:
- User data is safe between deployments
- Only upload `/public` folder contents
- Test thoroughly after each deployment

