# Karl's GIR - Documentation Index

**Version:** 3.1.0  
**Last Updated:** November 2025

This directory contains all documentation for the Karl's GIR Golf Tracker application.

---

## 📚 Documentation Overview

### **Essential Reading (Start Here)**

1. **[README.md](../README.md)** - Main project overview, quick start guide
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture, technology stack, design patterns
3. **[DIAGRAMS.md](DIAGRAMS.md)** - Visual diagrams (Mermaid) of system flows and architecture
4. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local development setup and workflow
5. **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Production deployment instructions

### **Reference Documentation**

6. **[VERSION-HISTORY.md](VERSION-HISTORY.md)** - Complete version history and changelog
7. **[TODOS.md](TODOS.md)** - Future features and planned improvements
8. **[PRD.md](PRD.md)** - Product Requirements Document
9. **[SECURITY-ASSESSMENT.md](SECURITY-ASSESSMENT.md)** - Security review and best practices

### **Specialized Guides**

10. **[ADMIN-ANALYTICS.md](ADMIN-ANALYTICS.md)** - Admin dashboard and analytics documentation
11. **[EMAIL-FEATURE.md](EMAIL-FEATURE.md)** - Email functionality documentation
12. **[LARAGON-SETUP.md](LARAGON-SETUP.md)** - Laragon local development setup
13. **[MODAL-COMPONENT-GUIDE.md](MODAL-COMPONENT-GUIDE.md)** - Modal component usage guide
14. **[PAGE-LAYOUT-STANDARD.md](PAGE-LAYOUT-STANDARD.md)** - UI/UX layout standards
15. **[BUTTON-STANDARDS.md](BUTTON-STANDARDS.md)** - Button styling and icon usage standards
16. **[PWA-INSTALL-GUIDE.md](PWA-INSTALL-GUIDE.md)** - PWA installation guide

---

## 🚀 Quick Start for New Developers

### **1. Understand the System**
Read in this order:
1. [README.md](../README.md) - Get the big picture
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand how it works
3. [DIAGRAMS.md](DIAGRAMS.md) - Visualize the system flows

### **2. Set Up Local Development**
1. [LARAGON-SETUP.md](LARAGON-SETUP.md) - Install Laragon (Windows)
2. [DEVELOPMENT.md](DEVELOPMENT.md) - Set up the project locally
3. Run `npm install` and `npm run dev`

### **3. Make Changes**
1. Edit code in `/src/`, `/api/`, or `/admin/`
2. Test locally at `http://karlgolf.app.test/`
3. Run `npm run build` to create production build

### **4. Deploy to Production**
1. [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Follow deployment steps
2. Upload `/public/*` to `/public_html/` on SiteGround
3. Clear server cache and test

---

## 📖 Documentation by Topic

### **Architecture & Design**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [DIAGRAMS.md](DIAGRAMS.md) - Visual system diagrams
- [PRD.md](PRD.md) - Product requirements

### **Development**
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local development setup
- [LARAGON-SETUP.md](LARAGON-SETUP.md) - Laragon configuration
- [MODAL-COMPONENT-GUIDE.md](MODAL-COMPONENT-GUIDE.md) - Component usage
- [PAGE-LAYOUT-STANDARD.md](PAGE-LAYOUT-STANDARD.md) - UI layout standards
- [BUTTON-STANDARDS.md](BUTTON-STANDARDS.md) - Button styling standards

### **Deployment**
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Production deployment
- [VERSION-HISTORY.md](VERSION-HISTORY.md) - Version changelog

### **Features**
- [ADMIN-ANALYTICS.md](ADMIN-ANALYTICS.md) - Admin dashboard
- [EMAIL-FEATURE.md](EMAIL-FEATURE.md) - Email functionality
- [PWA-INSTALL-GUIDE.md](PWA-INSTALL-GUIDE.md) - PWA features

### **Security & Best Practices**
- [SECURITY-ASSESSMENT.md](SECURITY-ASSESSMENT.md) - Security review

### **Future Development**
- [TODOS.md](TODOS.md) - Planned features

---

## 🔑 Key Concepts

### **File-Based Storage**
- No database - all data stored in JSON files
- User data in `/data/{user_hash}/` directories
- Production: `/home/username/data/` (outside public_html)
- Local: `C:\Users\...\karlgolf.app\data\`

### **Build Process**
```
npm run build
  ↓
1. pre-build.js → Update service worker version
2. tsc → TypeScript compilation
3. vite build → Bundle React app
4. build-deploy.js → Copy API, admin, assets
  ↓
Output: /public/ folder (ready for deployment)
```

### **Deployment**
- Build output: `/public/` folder
- Upload to: `/public_html/` on SiteGround
- Data location: `/home/username/data/` (persists between deployments)

### **Environment Detection**
- Local: `http://karlgolf.app.test/` (Laragon)
- Production: `https://karlgolf.app/` (SiteGround)
- Auto-detected by `api/common/environment.php`

---

## 🛠️ Common Tasks

### **Add a New Feature**
1. Create/edit components in `/src/`
2. Add API endpoints in `/api/`
3. Test locally with `npm run dev`
4. Build with `npm run build`
5. Deploy `/public/*` to production

### **Update Admin Dashboard**
1. Edit `/admin/index.html` or `/admin/admin-styles.css`
2. Build with `npm run build` (copies to `/public/admin/`)
3. Deploy `/public/admin/*` to production

### **Fix a Bug**
1. Identify the issue (check browser console, server logs)
2. Make changes in `/src/`, `/api/`, or `/admin/`
3. Test locally
4. Build and deploy

### **Add Documentation**
1. Create new `.md` file in `/docs/`
2. Add entry to this README.md
3. Link from relevant documentation

---

## 📊 System Overview

### **Frontend**
- **Framework:** React 19.2.0 + TypeScript 5.9.3
- **Build Tool:** Vite 7.2.2
- **Routing:** React Router 7.9.5 (hash-based)
- **State:** TanStack Query 5.90.7
- **UI:** Custom CSS with semantic variables

### **Backend**
- **Language:** PHP 8.x
- **Storage:** JSON files (no database)
- **Auth:** Session-based with httpOnly cookies
- **Security:** bcrypt password hashing, input validation

### **Infrastructure**
- **Local:** Laragon (Windows)
- **Production:** SiteGround (Apache + PHP)
- **SSL:** Required for production
- **PWA:** Service worker for offline support

---

## 🔍 Troubleshooting

### **Build Errors**
- Check TypeScript errors: `npm run build`
- Check console for errors
- Verify all imports are correct

### **Local Development Issues**
- Ensure Laragon is running
- Check `http://karlgolf.app.test/` is accessible
- Verify `/data/` directory exists and is writable

### **Production Issues**
- Check `/data/logs/app.log` on server
- Verify file permissions (755 for directories, 644 for files)
- Clear server cache (SiteGround → Speed → Caching)
- Hard refresh browser (Ctrl+Shift+R)

### **Session Issues**
- Check session cookie configuration in `api/common/session.php`
- Verify domain is empty string (current domain only)
- Clear browser cookies and test again

---

## 📞 Support

For questions or issues:
1. Check relevant documentation in this folder
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system understanding
3. Check [TROUBLESHOOTING](DEPLOYMENT-GUIDE.md#-troubleshooting) section
4. Review `/data/logs/app.log` for errors

---

## 📝 Contributing to Documentation

When adding or updating documentation:
1. Use clear, concise language
2. Include code examples where relevant
3. Update this README.md with new document links
4. Use Mermaid diagrams for visual explanations
5. Keep version numbers up to date

---

**Current Version:** 3.1.0  
**Documentation Last Updated:** November 2025

