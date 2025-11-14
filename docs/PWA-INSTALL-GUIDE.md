# PWA Installation Guide - Karl's GIR

## ✅ What's Set Up

Your app is now a **fully functional Progressive Web App (PWA)** with:

1. **Manifest** (`public/manifest.json`)
   - App name, icons, theme colors
   - Shortcuts to Track Round and Dashboard
   - Configured for standalone display mode

2. **Service Worker** (`public/service-worker.js`)
   - Offline functionality
   - Cache-first strategy for assets
   - Network-first for HTML
   - Automatic cache cleanup

3. **Install Prompt** (`src/components/PWAInstallPrompt.tsx`)
   - Custom branded UI
   - Auto-hides when already installed
   - Dismissible (but can be triggered again)

4. **App Icons**
   - 48px, 72px, 96px, 144px, 192px, 512px
   - Maskable versions for Android adaptive icons
   - Golf-themed branding

---

## 🎯 How It Works

### For Users on Desktop (Chrome/Edge):

1. **Visit your site** → Chrome detects PWA capabilities
2. **Install icon** appears in URL bar (right side)
3. **OR** your custom prompt appears at bottom of screen:
   ```
   ┌─────────────────────────────────────┐
   │ ⛳  Install Karl's GIR               │
   │     Quick access from your home screen │
   │                          [Install] [X] │
   └─────────────────────────────────────┘
   ```
4. **User clicks Install** → Native install dialog
5. **After install** → App opens in its own window (no browser UI)
6. **Desktop shortcut** is created automatically

### For Users on Mobile (iOS/Android):

#### **Android (Chrome/Edge)**
1. Visit site → "Add to Home Screen" prompt may appear
2. OR your custom prompt shows up (same as desktop)
3. OR tap menu (⋮) → "Install app" or "Add to Home Screen"
4. Icon appears on home screen
5. Opens in fullscreen standalone mode

#### **iOS (Safari)**
1. Visit site → Tap Share button (box with arrow)
2. Scroll down → Tap "Add to Home Screen"
3. Icon appears with custom name "Karl's GIR"
4. Opens in fullscreen (no Safari UI)

---

## 🔍 Install Prompt Behavior

### **When It Shows:**
- ✅ User visits on desktop/mobile browser
- ✅ Site served over HTTPS (or localhost)
- ✅ Manifest and service worker detected
- ✅ NOT already installed

### **When It Hides:**
- ❌ App is already installed (checks `display-mode: standalone`)
- ❌ User dismissed it (can show again on next visit)
- ❌ User installed via browser's native prompt

### **Smart Detection:**
```typescript
// Checks if already installed
if (window.matchMedia('(display-mode: standalone)').matches) {
  // App is installed - don't show prompt
}
```

---

## 📱 Installed App Features

### **What Users Get:**

1. **No Browser UI**
   - Full screen experience
   - No address bar, no browser tabs
   - Looks like a native app

2. **Home Screen Icon**
   - Branded ⛳ icon
   - Shows "Karl's GIR" name
   - Launches instantly

3. **App Shortcuts** (Android/Windows)
   - Long-press icon → Quick actions:
     - "Track Round"
     - "Dashboard"
     - "Track Live Round"

4. **Offline Support**
   - Service worker caches assets
   - Works without internet (after first visit)
   - Syncs data when back online

5. **Push Notifications** (future capability)
   - Service worker enables this
   - Not implemented yet, but ready for it

---

## 🛠️ Testing PWA Installation

### **Local Testing (localhost):**
```bash
# 1. Build the app
npm run build

# 2. Serve it (already running on XAMPP)
# Visit: http://localhost/karlgolf.app_pwa/dist/

# 3. Open Chrome DevTools → Application tab
# Check:
# - Manifest: Valid ✅
# - Service Worker: Registered ✅
# - Installability: Meets criteria ✅
```

### **Chrome DevTools PWA Testing:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section:
   - Should show "Karl's GIR"
   - All icons loaded
4. Check **Service Workers** section:
   - Should show "activated and is running"
5. Test install:
   - **Application → Manifest → "Install app" button**

### **Mobile Testing:**
1. Use **Chrome Remote Debugging** (Android)
2. Or deploy to HTTPS server and test on real device
3. **ngrok** or **localhost.run** for quick HTTPS testing:
   ```bash
   npx ngrok http 80
   # Opens tunnel: https://abc123.ngrok.io
   ```

---

## 🎨 Customization

### **Change Install Prompt Appearance:**
Edit `src/components/PWAInstallPrompt.tsx`:
- Position (currently: bottom center)
- Colors, padding, animation
- Text content
- Icon/emoji

### **Change App Name/Colors:**
Edit `public/manifest.json`:
```json
{
  "name": "Karl's GIR - Golf Tracker",
  "short_name": "Karl's GIR",
  "theme_color": "#16a34a",  // Green theme
  "background_color": "#0a140a"  // Dark background
}
```

### **Change Cached Assets:**
Edit `public/service-worker.js`:
```javascript
const ASSETS_TO_CACHE = [
  // Add your critical assets here
];
```

---

## 🚀 Production Deployment

### **Requirements for PWA:**
1. ✅ **HTTPS** (or localhost for testing)
2. ✅ Valid `manifest.json`
3. ✅ Service worker registered
4. ✅ Icons (192px and 512px minimum)

### **Deployment Checklist:**
- [ ] Update `manifest.json` start_url to production URL
- [ ] Update service worker cache paths for production
- [ ] Test on real HTTPS domain
- [ ] Verify install prompt appears
- [ ] Test on iOS Safari and Android Chrome
- [ ] Check offline functionality

### **Update Service Worker for Production:**
```javascript
// Change cache paths from:
'/karlgolf.app_pwa/dist/'

// To your production path:
'/'  // Or '/app/' depending on hosting
```

---

## 🔧 Troubleshooting

### **Install Prompt Not Showing:**
1. Check HTTPS (required for production)
2. Clear browser cache
3. Unregister old service workers (DevTools → Application → Service Workers → Unregister)
4. Hard refresh (Ctrl+Shift+R)
5. Check Console for errors

### **Service Worker Not Registering:**
1. Check file path: `/service-worker.js` must be accessible
2. Check Console for registration errors
3. HTTPS required (except localhost)
4. Clear all service workers and try again

### **Icons Not Loading:**
1. Verify icon paths in `public/images/icons/`
2. Check `manifest.json` icon paths
3. Rebuild app (`npm run build`)

### **App Not Working Offline:**
1. Visit app while online first (caches assets)
2. Check service worker is active
3. Go offline (airplane mode or DevTools → Network → Offline)
4. Refresh - should still work

---

## 📊 PWA Analytics

Track install events:
```typescript
window.addEventListener('appinstalled', () => {
  // Track installation
  console.log('PWA was installed');
  // Send to analytics
});
```

Already implemented in `PWAInstallPrompt.tsx`!

---

## 🎯 Next Steps

1. **Test install flow** on your device
2. **Deploy to HTTPS** for real testing
3. **Add push notifications** (optional)
4. **Add offline data sync** (already works with localStorage)
5. **Monitor install rates** via analytics

---

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [PWA Builder](https://www.pwabuilder.com/)

---

**Your PWA is ready! 🎉**

Users can now install your app and use it like a native application on any device.
