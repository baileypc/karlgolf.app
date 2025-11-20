// Karl's GIR - Automated Version Sync Script
// This script automatically updates version numbers in all markdown files
// to match the version in package.json
//
// Usage:
//   node sync-version.js
//
// This script will:
// 1. Read version from package.json
// 2. Find all markdown files (.md) in the project
// 3. Update version references in common patterns:
//    - **Version:** X.X.X
//    - Version: X.X.X
//    - Current Version: X.X.X
//    - vX.X.X
//    - (X.X.X)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const newVersion = packageJson.version;

if (!newVersion) {
  console.error('❌ Error: No version found in package.json');
  process.exit(1);
}

console.log(`🔄 Syncing version to ${newVersion}...\n`);

// Patterns to match and replace
const versionPatterns = [
  // **Version:** 3.1.0
  {
    pattern: /\*\*Version:\*\*\s+(\d+\.\d+\.\d+)/g,
    replacement: `**Version:** ${newVersion}`,
    description: 'Bold version headers'
  },
  // Version: 3.1.0
  {
    pattern: /^Version:\s+(\d+\.\d+\.\d+)/gm,
    replacement: `Version: ${newVersion}`,
    description: 'Version headers'
  },
  // Current Version: 3.1.0
  {
    pattern: /\*\*Current Version:\*\*\s+(\d+\.\d+\.\d+)/g,
    replacement: `**Current Version:** ${newVersion}`,
    description: 'Current version references'
  },
  {
    pattern: /Current Version:\s+(\d+\.\d+\.\d+)/g,
    replacement: `Current Version: ${newVersion}`,
    description: 'Current version (non-bold)'
  },
  // v3.1.0 in text
  {
    pattern: /\bv(\d+\.\d+\.\d+)\b/g,
    replacement: `v${newVersion}`,
    description: 'Version with v prefix'
  },
  // (3.1.0) in parentheses
  {
    pattern: /\((\d+\.\d+\.\d+)\)/g,
    replacement: `(${newVersion})`,
    description: 'Version in parentheses'
  },
  // Version 3.1.0 - Title format
  {
    pattern: /^## Version (\d+\.\d+\.\d+) -/gm,
    replacement: (match, oldVersion) => {
      // Only update if it's the current version section (not historical versions)
      // We'll handle this more carefully in the file processing
      return match;
    },
    description: 'Version section headers (handled separately)'
  }
];

// Recursively find all markdown files
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.git', 'dist', 'public', '.vite'].includes(file)) {
        findMarkdownFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Update version in a file
function updateFileVersion(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  let changes = [];

  // Check if file contains version references
  const hasVersion = /\d+\.\d+\.\d+/.test(content);
  if (!hasVersion) {
    return { updated: false, changes: [] };
  }

  // Apply each pattern
  versionPatterns.forEach(({ pattern, replacement, description }) => {
    if (typeof replacement === 'function') {
      // Skip function replacements for now (version section headers)
      return;
    }

    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const oldContent = content;
      content = content.replace(pattern, replacement);
      if (content !== oldContent) {
        updated = true;
        changes.push(`${description}: ${matches.length} replacement(s)`);
      }
    }
  });

  // Special handling for README.md - update "Version X.X.X - Current Release" section
  if (path.basename(filePath) === 'README.md') {
    const currentReleasePattern = /## 🎉 Version (\d+\.\d+\.\d+) - Current Release/g;
    if (currentReleasePattern.test(content)) {
      content = content.replace(currentReleasePattern, `## 🎉 Version ${newVersion} - Current Release`);
      updated = true;
      changes.push('Current Release section header');
    }
  }

  // Special handling for VERSION-HISTORY.md - only update "Current Version" at bottom
  if (path.basename(filePath) === 'VERSION-HISTORY.md') {
    // Don't update historical version headers, only the "Current Version" line
    const currentVersionPattern = /\*\*Current Version:\*\*\s+(\d+\.\d+\.\d+)/g;
    if (currentVersionPattern.test(content)) {
      content = content.replace(currentVersionPattern, `**Current Version:** ${newVersion}`);
      updated = true;
      changes.push('Current Version reference');
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { updated, changes };
}

// Main execution
try {
  const markdownFiles = findMarkdownFiles(__dirname);
  let totalUpdated = 0;
  let totalFiles = 0;

  console.log(`📄 Found ${markdownFiles.length} markdown file(s)\n`);

  markdownFiles.forEach(filePath => {
    const relativePath = path.relative(__dirname, filePath);
    const result = updateFileVersion(filePath);

    if (result.updated) {
      totalUpdated++;
      totalFiles++;
      console.log(`✅ Updated: ${relativePath}`);
      result.changes.forEach(change => {
        console.log(`   - ${change}`);
      });
    } else {
      totalFiles++;
    }
  });

  console.log(`\n✨ Version sync complete!`);
  console.log(`   Updated: ${totalUpdated} file(s)`);
  console.log(`   Checked: ${totalFiles} file(s)`);
  console.log(`   Version: ${newVersion}\n`);

} catch (error) {
  console.error('❌ Error during version sync:', error.message);
  process.exit(1);
}

