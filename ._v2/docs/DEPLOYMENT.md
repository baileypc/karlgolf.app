# Karl's GIR - Deployment Guide

## Universal Configuration

### Simplified .htaccess Approach
The app uses a **single `.htaccess` file** optimized for maximum compatibility:

- **Local Development**: Basic security headers compatible with XAMPP/WAMP
- **Production**: SiteGround server-level configuration provides full security
- **No auto-switching**: Keeps compatibility with older Apache versions

### Why This Approach
- **Maximum Compatibility**: Works with Apache 2.2+ (older XAMPP/WAMP versions)
- **No 500 Errors**: Avoids complex directives that cause server errors
- **Production Security**: SiteGround handles advanced security server-side
- **Simple Deployment**: Same file works everywhere

## Local Development Setup

### Current Configuration
- **.htaccess**: Universal auto-switching configuration
- **Security**: Automatically detects local environment and applies appropriate security
- **Features**: All app functionality works without SSL requirements

### Testing Locally
1. Place files in your web server directory (e.g., `htdocs/karlsgir/`)
2. Access via `http://localhost/karlsgir/`
3. All features work without SSL requirements
4. The .htaccess automatically applies local-friendly settings

## Production Deployment (SiteGround)

### Upload Methods

#### Option 1: File Manager (Recommended)

1. Log into your SiteGround cPanel
2. Navigate to **File Manager**
3. Go to `public_html/` (root directory for karlsgolf.app)
4. Upload all files including `.htaccess`
5. Set permissions: 644 for files, 755 for directories
6. Ensure `data/` directory exists and is writable (755)

#### Option 2: FTP/SFTP

1. Connect to your SiteGround server
2. Navigate to `/home/username/public_html/`
3. Upload all files
4. The `.htaccess` will provide security headers

### SiteGround Security Configuration

Since the local `.htaccess` is simplified for compatibility, SiteGround will provide production security through:

1. **SSL Certificate**: Install via cPanel → SSL/TLS Status
2. **HTTPS Enforcement**: Configure via cPanel security settings
3. **Advanced Headers**: Set via server configuration or additional .htaccess rules
4. **Security Modules**: Enable mod_security, HSTS, etc.

### SSL Certificate Setup

1. In SiteGround cPanel, go to **SSL/TLS Status**
2. Install free Let's Encrypt certificate for your domain
3. The .htaccess will automatically redirect HTTP to HTTPS

## Post-Deployment Verification

### Security Check
- [ ] HTTPS working (automatic redirect from HTTP)
- [ ] Security headers present (check browser dev tools → Network)
- [ ] Content Security Policy active
- [ ] No mixed content warnings

### Functionality Check
- [ ] App loads without errors
- [ ] Email sending works
- [ ] CSV export functions
- [ ] Mobile responsive
- [ ] All form validations work

## Troubleshooting

### 500 Internal Server Error
**Cause:** .htaccess incompatible with server configuration
**Solution:**
1. Check Apache modules are enabled (mod_rewrite, mod_headers, mod_expires)
2. Use local .htaccess for testing
3. Contact SiteGround to enable required modules

### HTTPS Not Working
**Cause:** SSL certificate not installed or server name not detected properly
**Solution:**
1. Install SSL certificate in SiteGround cPanel
2. Verify domain is not localhost/127.0.0.1 (should auto-detect production)
3. Clear browser cache (HTTPS redirects may be cached)

### Email Not Sending
**Cause:** PHP mail() configuration or permissions
**Solution:**
1. Verify PHP mail() is enabled
2. Check send-email.php permissions (644)
3. Test with SiteGround's email testing tools

## Security Notes

### Environment Auto-Detection
The `.htaccess` file uses server name detection to automatically apply the correct security level:

- **Local Development**: `localhost`, `127.0.0.1`, or `*.local` domains
- **Production**: All other domains (automatically enables full security)

### Security Features
- **Local**: Basic security with relaxed CSP for development compatibility
- **Production**: Enterprise-grade security with strict CSP, HSTS, and comprehensive headers

## File Structure

```
karlsgir/
├── index.html              # Main app
├── index.php              # Clean URL redirect
├── send-email.php         # Email handler
├── .htaccess              # Universal auto-switching configuration
├── README.md              # Documentation
├── docs/                  # Documentation folder
└── images/                # Assets (favicon)
```

## Support

For deployment issues, contact SiteGround support or Bailey at CLOUD VIRTUE
