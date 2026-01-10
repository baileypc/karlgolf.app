# Pre-Deployment Checklist
## Karl's GIR - SiteGround Deployment

**Date:** December 2024  
**Status:** Ready for Deployment

---

## Critical Items (Must Complete Before Launch)

### 1. SSL Certificate Installation ⚠️
- [ ] Log into SiteGround cPanel
- [ ] Navigate to **SSL/TLS Status**
- [ ] Find karlsgolf.app domain
- [ ] Click **Let's Encrypt** to install free SSL certificate
- [ ] Wait 5-10 minutes for activation
- [ ] Test: Visit `https://karlsgolf.app` (should load without warnings)
- [ ] Verify secure padlock icon in browser

### 2. Domain DNS Configuration ⚠️
- [ ] Verify karlsgolf.app DNS points to SiteGround nameservers
- [ ] Check DNS propagation: `nslookup karlsgolf.app`
- [ ] Wait 24-48 hours for full DNS propagation if needed
- [ ] Verify domain resolves correctly

### 3. File Permissions ⚠️
- [ ] Verify `data/` directory exists and is writable (755)
- [ ] Ensure PHP can create subdirectories in `data/`
- [ ] Test: Create a test user account to verify directory creation
- [ ] Verify file permissions allow PHP to write JSON files

### 4. PHP Configuration Verification
- [ ] Verify PHP version is 7.4+ (SiteGround default is usually 8.0+)
- [ ] Ensure PHP `mail()` function is enabled (SiteGround default: enabled)
- [ ] Check that required PHP modules are enabled
- [ ] Test: Send a test email to verify mail() works

---

## Important Items (Should Complete Before Launch)

### 5. Post-Deployment Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test round entry (add at least 3 holes)
- [ ] Test round saving
- [ ] Test dashboard display
- [ ] Test CSV export
- [ ] Test email functionality (round summary)
- [ ] Test password reset
- [ ] Test logout/login recovery
- [ ] Test mobile responsiveness
- [ ] Test on actual mobile device
- [ ] Test cross-browser (Chrome, Safari, Firefox, Edge)

### 6. Security Verification
- [ ] Verify HTTPS redirect works (http:// → https://)
- [ ] Check security headers in browser DevTools
- [ ] Verify session cookies are Secure and HttpOnly
- [ ] Test Content Security Policy (CSP) doesn't block resources
- [ ] Verify no mixed content warnings

### 7. Error Logging
- [ ] Verify `logs/` directory exists and is writable
- [ ] Check that error logs are being written
- [ ] Monitor logs for first 24 hours after launch
- [ ] Set up log rotation if needed

---

## Nice-to-Have Items (Can Complete Post-Launch)

### 8. Performance Optimization
- [ ] Monitor page load times
- [ ] Check server response times
- [ ] Optimize if needed (likely not required)

### 9. User Feedback Collection
- [ ] Set up feedback mechanism
- [ ] Monitor user registration patterns
- [ ] Collect feature requests

### 10. Documentation Updates
- [ ] Update any domain-specific documentation
- [ ] Create user guide if needed
- [ ] Document any SiteGround-specific configurations

---

## Deployment Steps

### Step 1: Upload Files
1. Connect to SiteGround via FTP/SFTP or File Manager
2. Navigate to `public_html/` (root directory)
3. Upload all files maintaining directory structure:
   - All HTML files (index.html, login.html, dashboard.html, etc.)
   - `api/` directory with all subdirectories
   - `assets/` directory with all subdirectories
   - `manifest.json`
   - `service-worker.js`
   - `.htaccess`
   - `data/` directory (will be created automatically, but ensure it exists)

### Step 2: Set Permissions
```bash
# Files: 644
# Directories: 755
# data/ directory: 755 (must be writable)
```

### Step 3: Install SSL Certificate
- Follow steps in Critical Items #1 above

### Step 4: Verify Configuration
- Test HTTPS is working
- Test authentication
- Test file operations

### Step 5: Complete Testing
- Follow Post-Deployment Testing checklist above

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Rollback:**
   - Rename `.htaccess` to `.htaccess.bak` if causing 500 errors
   - Check SiteGround error logs
   - Verify file permissions

2. **Data Backup:**
   - Backup `data/` directory before making changes
   - Export user data if needed

3. **Communication:**
   - Document any issues found
   - Create fix plan
   - Re-deploy after fixes

---

## Success Criteria

Deployment is successful when:

- ✅ Site loads at `https://karlsgolf.app` without errors
- ✅ Users can register and login
- ✅ Users can track rounds and save data
- ✅ Dashboard displays statistics correctly
- ✅ Email functionality works
- ✅ No console errors in browser
- ✅ Mobile experience works correctly
- ✅ All security headers are present

---

## Support Resources

- **Deployment Guide:** `docs/SITEGROUND-DEPLOYMENT.md`
- **Security Assessment:** `docs/SECURITY-ASSESSMENT.md`
- **Troubleshooting:** See deployment guide troubleshooting section
- **SiteGround Support:** Available via cPanel or support ticket

---

**Checklist Status:** Ready for Deployment  
**Last Updated:** December 2024

