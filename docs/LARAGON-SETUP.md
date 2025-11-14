# Laragon Local Development Setup

## Required .htaccess File

For local development with Laragon, you need to copy the root `.htaccess` file to Laragon's www directory.

### Steps:

1. **Copy the .htaccess file:**
   - **FROM:** `C:\Users\baile\OneDrive\Documents\__DEV\karlgolf.app\.htaccess`
   - **TO:** `C:\laragon\www\.htaccess`

2. **Verify the file is in place:**
   - The file should be at: `C:\laragon\www\.htaccess`
   - This handles asset path redirects for local development

3. **Restart Laragon** after copying the file

### What This Does:

The root `.htaccess` in Laragon's www directory catches requests to `/assets/`, `/styles.css`, etc. from the server root and redirects them to `/karlgolf.app/dist/assets/`, etc.

### Production:

- This `.htaccess` file is **NOT uploaded to production**
- Production uses `dist/.htaccess` which becomes the root `.htaccess` in production
- Production works correctly because files are in root, not `/dist/`

### Testing:

After copying the file and restarting Laragon:
- Access: `http://localhost/karlgolf.app/dist/`
- Should load all assets correctly

