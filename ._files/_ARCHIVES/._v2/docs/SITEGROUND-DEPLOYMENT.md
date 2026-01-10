# SiteGround Deployment Guide - karlsgolf.app

## Pre-Deployment Checklist

### ✅ Code Readiness
- [x] All files use relative paths (no hardcoded domains in code)
- [x] Email headers updated to use karlsgolf.app domain
- [x] Service worker configured for relative paths
- [x] Manifest.json uses relative paths
- [x] Security headers configured in .htaccess

### ⚠️ Pre-Deployment Requirements

1. **Domain Setup**
   - [ ] Domain karlsgolf.app is pointed to SiteGround nameservers
   - [ ] DNS propagation completed (check with `nslookup karlsgolf.app`)

2. **SSL Certificate**
   - [ ] Install free Let's Encrypt SSL certificate via SiteGround cPanel
   - [ ] Enable HTTPS enforcement (SiteGround usually does this automatically)
   - [ ] Verify SSL is active before deploying (critical for cookie security)

3. **PHP Configuration**
   - [ ] Verify PHP version is 7.4+ (SiteGround default is usually 8.0+)
   - [ ] Ensure PHP mail() function is enabled (SiteGround default: enabled)
   - [ ] Check that required PHP modules are enabled (usually all standard modules are)

## Deployment Steps

### Option 1: File Manager (Recommended for First Time)

1. Log into SiteGround cPanel
2. Navigate to **File Manager**
3. Go to `public_html/` (root directory for karlsgolf.app)
4. Upload all files:
   - `index.html`
   - `index.php`
   - `login.html`
   - `dashboard.html`
   - `reset-password.html`
   - `auth.php`
   - `send-email.php`
   - `send-password-reset.php`
   - `save-round.php`
   - `load-stats.php`
   - `service-worker.js`
   - `manifest.json`
   - `.htaccess`
   - `images/` folder (with karls_gir.png)
   - `data/` folder (will be created automatically, but ensure it exists)
   - `docs/` folder (optional, for documentation)

5. Set file permissions:
   - Files: 644
   - Directories: 755
   - `data/` directory: 755 (must be writable)

### Option 2: FTP/SFTP

1. Connect to SiteGround via FTP/SFTP
2. Navigate to `/home/username/public_html/`
3. Upload all files maintaining directory structure
4. Set permissions as above

## Post-Deployment Configuration

### 1. SSL Certificate Setup

1. In SiteGround cPanel, go to **SSL/TLS Status**
2. Find karlsgolf.app and click **Let's Encrypt**
3. Install the free SSL certificate
4. Wait 5-10 minutes for activation
5. Test: Visit `https://karlsgolf.app` (should load without warnings)

### 2. Email Configuration (if needed)

**Note:** The app uses PHP's `mail()` function which works out of the box on SiteGround. However, if emails don't send:

1. Check SiteGround Email settings in cPanel
2. Verify SPF/DKIM records are set (SiteGround usually handles this)
3. Test email sending functionality after deployment

### 3. Directory Permissions

Ensure the `data/` directory is writable:

```bash
chmod 755 data/
```

If you created the data directory manually, ensure it exists and is writable.

## Post-Deployment Testing

### Functionality Tests

1. **Homepage Load**
   - [ ] Visit `https://karlsgolf.app` - should load without errors
   - [ ] Check browser console for JavaScript errors
   - [ ] Verify all assets load (images, CSS, JS)

2. **Core Features**
   - [ ] Add a test hole (Par 4, hit fairway, GIR, 2 putts)
   - [ ] Verify score calculation works
   - [ ] Check stats display correctly
   - [ ] Test CSV export functionality

3. **Authentication**
   - [ ] Test user registration
   - [ ] Test user login
   - [ ] Verify dashboard loads for logged-in users
   - [ ] Test logout functionality

4. **Email Functionality**
   - [ ] Complete 9 holes and test email sending
   - [ ] Check email arrives in inbox
   - [ ] Verify email content is correct
   - [ ] Check spam folder if email doesn't arrive

5. **Data Persistence**
   - [ ] Register and save a round
   - [ ] Logout and login again
   - [ ] Verify saved round appears in dashboard

6. **Mobile Testing**
   - [ ] Test on mobile device
   - [ ] Verify responsive design works
   - [ ] Test PWA installation (if applicable)

### Security Tests

1. **HTTPS Enforcement**
   - [ ] Visit `http://karlsgolf.app` - should redirect to HTTPS
   - [ ] Check browser shows secure padlock icon

2. **Security Headers**
   - [ ] Open browser DevTools → Network tab
   - [ ] Reload page
   - [ ] Check response headers for:
     - Content-Security-Policy
     - X-Frame-Options
     - X-XSS-Protection
     - X-Content-Type-Options

3. **Session Security**
   - [ ] Verify cookies are marked as Secure and HttpOnly
   - [ ] Check cookies in DevTools → Application → Cookies

## Troubleshooting

### Issue: 500 Internal Server Error

**Cause:** .htaccess configuration incompatible with server

**Solution:**
1. Temporarily rename `.htaccess` to `.htaccess.bak`
2. Test if site loads
3. If it loads, gradually add back .htaccess rules
4. Check SiteGround error logs in cPanel

### Issue: HTTPS Not Working / Mixed Content

**Cause:** SSL certificate not installed or HTTP redirect not working

**Solution:**
1. Install SSL certificate in SiteGround cPanel
2. Verify domain DNS is correctly pointing to SiteGround
3. Wait 24-48 hours for full SSL propagation
4. Clear browser cache

### Issue: Email Not Sending

**Cause:** PHP mail() configuration or email authentication

**Solution:**
1. Check SiteGround cPanel → Email → Email Accounts
2. Verify SPF/DKIM records are set
3. Test with SiteGround's email testing tool
4. Check SiteGround error logs

### Issue: Data Directory Not Writable

**Cause:** Incorrect permissions

**Solution:**
1. Set `data/` directory permissions to 755
2. Ensure parent directory permissions are correct
3. Check SiteGround File Manager shows correct permissions

### Issue: Sessions Not Working

**Cause:** Cookie security settings require HTTPS

**Solution:**
1. Ensure SSL certificate is installed and active
2. Verify HTTPS is working before testing authentication
3. If SSL isn't available yet, temporarily modify .htaccess:
   ```apache
   php_value session.cookie_secure 0
   ```
   (Change back to 1 once SSL is active)

## Production Readiness Summary

### ✅ Ready for Production

The site is **ready for production deployment** with the following:

1. **Code Quality**: ✅ All relative paths, no hardcoded domains
2. **Security**: ✅ Comprehensive security headers, input validation
3. **Functionality**: ✅ All features implemented and tested
4. **Email**: ✅ Updated to use karlsgolf.app domain
5. **Mobile**: ✅ Responsive design, PWA support

### ⚠️ Pre-Deployment Actions Required

1. **SSL Certificate**: Must be installed before going live
2. **Domain DNS**: Must point to SiteGround nameservers
3. **Permissions**: Verify `data/` directory is writable
4. **Testing**: Complete all post-deployment tests above

### 📝 Notes

- The site was originally built for `works.cloudvirtue.com/karlsgir/` but has been updated for root domain deployment at `karlsgolf.app`
- All documentation references to the old domain are informational only and don't affect functionality
- The `.htaccess` file is configured for production security but may need minor adjustments based on SiteGround's specific Apache configuration

## Support

For deployment issues:
- Check SiteGround cPanel documentation
- Review SiteGround error logs
- Contact SiteGround support for server-specific issues

---

**Last Updated**: Ready for karlsgolf.app deployment
**Status**: ✅ Production Ready (pending SSL setup)

