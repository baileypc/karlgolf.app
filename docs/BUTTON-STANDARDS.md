# Button Standards

**Last Updated:** November 15, 2025  
**Version:** 1.0

## Overview
This document defines the standard button styling and usage patterns for Karl's GIR PWA. All buttons should use Font Awesome icons (not emoticons) and follow consistent styling patterns for a professional, cohesive user experience.

---

## Core Principles

1. **Use Font Awesome Icons** - Never use emoticons (👁️, 📥, etc.) - always use Font Awesome icons
2. **Include Text Labels** - Buttons should have both icons and text for clarity (except icon-only utility buttons)
3. **Consistent Classes** - Use `.btn .btn-primary` or `.btn .btn-secondary` classes
4. **Touch-Friendly** - Minimum 52px height for all primary/secondary buttons
5. **Flexbox Alignment** - Use flexbox for icon + text alignment with consistent gap spacing

---

## Button Types

### 1. Primary Button (`.btn .btn-primary`)

**Purpose:** Main call-to-action buttons (Submit, Continue, Save, Create Account)

**Styling:**
```tsx
<button className="btn btn-primary">
  Button Text
</button>
```

**Visual Characteristics:**
- **Background:** Solid mint green (`#DDEDD2`)
- **Text Color:** Black (`#0a140a`)
- **Border:** None
- **Min Height:** 52px
- **Padding:** 14px vertical, 20px horizontal
- **Font Weight:** 600 (semi-bold)
- **Border Radius:** 12px (`var(--radius-lg)`)

**Use Cases:**
- Form submissions (Sign In, Create Account, Reset Password)
- Primary navigation (Start Round, Continue Round)
- Confirming actions in modals
- Main page CTAs

**Examples:**
<augment_code_snippet path="src/pages/HomePage.tsx" mode="EXCERPT">
````tsx
<button
  onClick={handleStartRound}
  className="btn btn-primary w-full"
>
  Start Round
</button>
````
</augment_code_snippet>

---

### 2. Secondary Button (`.btn .btn-secondary`)

**Purpose:** Secondary actions, outlined buttons, cancel/discard actions

**Styling:**
```tsx
<button className="btn btn-secondary">
  Button Text
</button>
```

**Visual Characteristics:**
- **Background:** Transparent
- **Text Color:** Mint green (`#DDEDD2`)
- **Border:** 2px solid mint green
- **Min Height:** 52px
- **Padding:** 14px vertical, 20px horizontal
- **Font Weight:** 600 (semi-bold)
- **Border Radius:** 12px (`var(--radius-lg)`)

**Use Cases:**
- Secondary navigation (Back to Login, Cancel)
- Discard/Delete actions (when not destructive primary)
- Alternative options
- Modal cancel buttons

**Examples:**
<augment_code_snippet path="src/pages/HomePage.tsx" mode="EXCERPT">
````tsx
<button
  onClick={() => navigate('/login')}
  className="btn btn-secondary"
>
  Login / Register
</button>
````
</augment_code_snippet>

---

### 3. Destructive Button (Secondary with Red Styling)

**Purpose:** Delete, remove, or destructive actions

**Styling:**
```tsx
<button
  className="btn btn-secondary"
  style={{
    borderColor: '#ef4444',
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  }}
>
  <FontAwesomeIcon icon={faTrash} />
  Delete Round
</button>
```

**Visual Characteristics:**
- **Background:** Light red tint (`rgba(239, 68, 68, 0.1)`)
- **Text Color:** Red (`#ef4444`)
- **Border:** 2px solid red (`#ef4444`)
- **Icon:** Font Awesome icon (e.g., `faTrash`, `faUserSlash`)

**Use Cases:**
- Delete round
- Delete account
- Delete all rounds
- Discard incomplete data

**Examples:**
<augment_code_snippet path="src/pages/DashboardPage.tsx" mode="EXCERPT">
````tsx
<button
  className="btn btn-secondary"
  style={{
    borderColor: '#ef4444',
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  }}
>
  <FontAwesomeIcon icon={faTrash} />
  Delete Round
</button>
````
</augment_code_snippet>

---

### 4. Icon + Text Button Pattern

**Purpose:** Buttons with both icon and text label for clarity

**Styling:**
```tsx
<button
  className="btn btn-secondary"
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }}
>
  <FontAwesomeIcon icon={faDownload} />
  Download CSV
</button>
```

**Key Properties:**
- **display:** `flex`
- **alignItems:** `center`
- **justifyContent:** `center`
- **gap:** `0.5rem` (8px between icon and text)

**Common Icons:**
- `faDownload` - Download/export actions
- `faTrash` - Delete actions
- `faRotateRight` - Refresh/clear cache
- `faUserSlash` - Delete account
- `faCheckCircle` - View/confirm actions
- `faPencil` - Edit actions

**Examples:**
<augment_code_snippet path="src/pages/TrackRoundPage.tsx" mode="EXCERPT">
````tsx
<button
  className="btn btn-secondary"
  style={{
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }}
>
  <FontAwesomeIcon icon={faDownload} />
  Download Round as CSV
</button>
````
</augment_code_snippet>

---

### 5. Icon-Only Utility Buttons

**Purpose:** Small utility buttons (password visibility toggle, edit, delete in lists)

**Styling:**
```tsx
<button
  type="button"
  onClick={handleClick}
  style={{
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.25rem',
  }}
>
  <FontAwesomeIcon icon={faEye} />
</button>
```

**Visual Characteristics:**
- **Background:** Transparent
- **Border:** None
- **Color:** Secondary text color or contextual (red for delete)
- **Padding:** Minimal (0.25rem)
- **Size:** Small, inline with content

**Use Cases:**
- Password visibility toggle (eye icon)
- Edit button in hole list
- Delete button in hole list
- Small inline actions

**Examples:**
<augment_code_snippet path="src/pages/LoginPage.tsx" mode="EXCERPT">
````tsx
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  style={{
    position: 'absolute',
    right: '0.5rem',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  }}
>
  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
</button>
````
</augment_code_snippet>

---

### 6. Text-Only Link Buttons

**Purpose:** Subtle navigation links (Back to Home, Forgot Password, Maybe Later)

**Styling:**
```tsx
<button
  onClick={handleClick}
  style={{
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textDecoration: 'underline',
  }}
>
  Forgot Password?
</button>
```

**Visual Characteristics:**
- **Background:** None/transparent
- **Border:** None
- **Color:** Primary text color
- **Text Decoration:** Underline (optional)
- **Font Size:** Usually smaller (`var(--font-sm)`)

**Use Cases:**
- "Forgot Password?" link
- "Back to Home" link
- "Maybe Later" in modals
- Subtle secondary navigation

---

## Button Layout Patterns

### Vertical Stacked Buttons (Full Width)

**Use Case:** Dashboard cards, footer actions, mobile-first layouts

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
  <button className="btn btn-primary" style={{ width: '100%' }}>
    Primary Action
  </button>
  <button className="btn btn-secondary" style={{ width: '100%' }}>
    Secondary Action
  </button>
</div>
```

**Spacing:** `gap: '0.75rem'` (12px between buttons)

---

### Horizontal Button Groups

**Use Case:** Modal actions, form submit/cancel pairs

```tsx
<div style={{ display: 'flex', gap: '0.75rem' }}>
  <button className="btn btn-secondary" style={{ flex: 1 }}>
    Cancel
  </button>
  <button className="btn btn-primary" style={{ flex: 1 }}>
    Confirm
  </button>
</div>
```

**Spacing:** `gap: '0.75rem'` (12px between buttons)
**Sizing:** `flex: 1` for equal width buttons

---

## Font Awesome Icon Usage

### Required Imports

```tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, 
  faTrash, 
  faRotateRight, 
  faUserSlash,
  faEye,
  faEyeSlash,
  faPencil,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
```

### Common Icons Reference

| Icon | Import | Use Case |
|------|--------|----------|
| 📥 → | `faDownload` | Download/Export |
| 🗑️ → | `faTrash` | Delete |
| 🔄 → | `faRotateRight` | Refresh/Clear |
| 👁️ → | `faEye` | Show password |
| 👁️‍🗨️ → | `faEyeSlash` | Hide password |
| ✏️ → | `faPencil` | Edit |
| ✓ → | `faCheckCircle` | View/Confirm |
| 👤 → | `faUserSlash` | Delete account |

**IMPORTANT:** Never use emoticons - always use Font Awesome icons!

---

## Implementation Checklist

When adding or updating buttons:

- [ ] Use `.btn .btn-primary` or `.btn .btn-secondary` class
- [ ] Include Font Awesome icon (not emoticon) if applicable
- [ ] Add text label for clarity (except icon-only utility buttons)
- [ ] Use flexbox for icon + text alignment (`display: 'flex'`, `gap: '0.5rem'`)
- [ ] Ensure minimum 52px height for primary/secondary buttons
- [ ] Use consistent spacing (`gap: '0.75rem'` for button groups)
- [ ] Apply destructive styling (red) for delete/remove actions
- [ ] Test on mobile (touch-friendly sizing)

---

## Examples by Page

### Dashboard Page
- ✅ Continue Round (primary, full width)
- ✅ Delete Round (secondary, red, icon + text)
- ✅ Export All Data (secondary, icon + text)
- ✅ Clear Cache (secondary, icon + text)
- ✅ Delete All Rounds (secondary, red, icon + text)
- ✅ Delete Account (secondary, darker red, icon + text)

### Track Round Page
- ✅ Start Round (primary, full width)
- ✅ Continue Round (primary, full width)
- ✅ Save & Finish (primary, full width)
- ✅ Discard Round (secondary, full width)
- ✅ Download Round as CSV (secondary, icon + text)
- ✅ Submit Hole (primary)
- ✅ Cancel Edit (secondary)
- ✅ End/Pause Round (secondary, full width)

### Login/Register Page
- ✅ Sign In (primary, full width)
- ✅ Create Account (primary, full width)
- ✅ Password visibility toggle (icon-only, eye icon)
- ✅ Forgot Password? (text-only link)
- ✅ Back to Home (text-only link)

### Reset Password Page
- ✅ Send Reset Link (primary, full width)
- ✅ Reset Password (primary, full width)
- ✅ Back to Login (secondary, full width)
- ✅ Password visibility toggle (icon-only, eye icon) - **FIXED**

---

## Version History

### v1.0 - November 15, 2025
- Initial button standards documentation
- Established Font Awesome icon requirement (no emoticons)
- Defined primary, secondary, and destructive button patterns
- Documented icon + text button pattern with flexbox alignment
- Fixed emoticon eye icons in ResetPasswordPage
- Standardized all dashboard and track round buttons

