// Karl's GIR - Build Script for Production Deployment
// Copies API and data folders into /public for single-folder deployment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');
const staticSrc = path.join(__dirname, 'static');
const apiSrc = path.join(__dirname, 'api');
const apiDest = path.join(publicDir, 'api');
const adminSrc = path.join(__dirname, 'admin');
const adminDest = path.join(publicDir, 'admin');
const dataSrc = path.join(__dirname, 'data', '.htaccess');
const dataDest = path.join(publicDir, 'data');
console.log('📦 Preparing deployment package...\n');

// NOTE: User data is stored in root /data/ (not /public/data/)
// Vite only clears /public/, so user accounts are safe from build deletion
// The API auto-detects the correct path (local vs production) via getDataDirectory()

// Helper function to copy directory recursively (including dotfiles)
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  // Include dotfiles by using withFileTypes and not filtering
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      // Log dotfiles being copied for debugging
      if (entry.name.startsWith('.')) {
        console.log(`  ✅ Copied dotfile: ${entry.name}`);
      }
    }
  }
}

try {
  // NOTE: User data is now in root /data/ (not /public/data/)
  // Vite only clears /public/, so data is safe - no backup/restore needed
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Error: /public folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Copy static assets (images, styles, manifest, etc.) to /public
  console.log('📂 Copying static assets to /public...');
  if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, publicDir);
    console.log('✅ Static assets copied');
  }

  // Update service worker cache version
  console.log('🔄 Updating service worker cache version...');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const swPath = path.join(publicDir, 'service-worker.js');

  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    // Replace the cache name with versioned name (matches v1, v3.1.0, etc.)
    swContent = swContent.replace(
      /const CACHE_NAME = ['"]karls-gir-v[^'"]+['"]/,
      `const CACHE_NAME = 'karls-gir-v${version}'`
    );
    fs.writeFileSync(swPath, swContent);
    console.log(`✅ Service worker cache version updated to v${version}`);
  } else {
    console.warn('⚠️ Service worker not found, skipping version update');
  }

  // Copy /api folder to /public/api
  console.log('📂 Copying /api folder to /public/api...');
  if (fs.existsSync(apiDest)) {
    fs.rmSync(apiDest, { recursive: true, force: true });
  }
  copyDir(apiSrc, apiDest);
  console.log('✅ API folder copied');

  // Copy /admin folder to /public/admin
  console.log('📂 Copying /admin folder to /public/admin...');
  if (fs.existsSync(adminDest)) {
    fs.rmSync(adminDest, { recursive: true, force: true });
  }
  copyDir(adminSrc, adminDest);
  console.log('✅ Admin folder copied');

  // NOTE: Data directory is now in root /data/ (not /public/data/)
  // This prevents Vite from deleting user accounts during builds
  // The API auto-detects the correct path (local vs production)
  // No need to copy or preserve data here - it's safe in root /data/

  // Remove .vite folder (build artifacts not needed in production)
  const viteDir = path.join(publicDir, '.vite');
  if (fs.existsSync(viteDir)) {
    console.log('🧹 Removing .vite build artifacts...');
    fs.rmSync(viteDir, { recursive: true, force: true });
    console.log('✅ Build artifacts removed');
  }

  console.log('\n✨ Deployment package ready in /public folder!');
  console.log('📤 Upload ALL contents of /public folder to production root directory.\n');

} catch (error) {
  console.error('❌ Error during build preparation:', error.message);
  process.exit(1);
}

