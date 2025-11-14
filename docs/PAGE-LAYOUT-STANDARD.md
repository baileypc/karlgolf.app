# Page Layout Standard

**Last Updated:** November 10, 2025  
**Version:** 1.0

## Overview
This document defines the standard page layout for Karl's GIR PWA, optimized for mobile-first golf course usage while maintaining a professional desktop experience.

## Design Philosophy
- **Mobile-First**: Maximize screen space for on-course tracking (95%+ usable area)
- **Touch-Friendly**: Large buttons (52px minimum height) for finger taps
- **Desktop Comfortable**: Content constrained to readable width (900px max)
- **Consistent Alignment**: Header and content visually aligned

---

## Header (IconNav Component)

### Structure
```tsx
<nav style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '60px',
  backgroundColor: 'var(--bg-card)',
  borderBottom: '2px solid var(--border-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1rem',  // 16px
  zIndex: 1000
}}>
```

### Specifications
- **Height:** 60px fixed
- **Width:** Full screen width (100%)
- **Padding:** 1rem (16px) left/right
- **Background:** Semi-transparent mint green (`var(--bg-card)`)
- **z-index:** 1000 (always on top)
- **Backdrop:** Solid black div at z-index 999 prevents content bleed-through

### Content
- **Logo:** 40x40px image + "Karl's GIR" text (left side)
- **Icons:** Chart, Clipboard, Logout (right side, 1.5rem gap)

---

## Page Content Layout

### Container Structure
```tsx
<div style={{ 
  paddingTop: '76px',           // Header height + 16px
  padding: '76px 0.25rem 2rem', // Top, Sides, Bottom
  maxWidth: '900px',            // Desktop max width
  margin: '0 auto'              // Center on desktop
}}>
  <div className="container">
    {/* Page content */}
  </div>
</div>
```

### Specifications

#### Mobile (< 900px)
- **Side Padding:** 0.25rem (4px) - Minimal space from edge
- **Top Padding:** 76px (clears fixed header)
- **Bottom Padding:** 2rem (32px)
- **Width:** ~95% of screen (4px + 16px card padding per side = ~20px total)

#### Desktop (≥ 900px)
- **Max Width:** 900px centered
- **Side Padding:** 0.25rem (4px) within the 900px container
- **Alignment:** Centered on screen

---

## Card Styling

### Base Card (`.card` class)
```css
.card {
    background-color: var(--bg-card);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: 1rem;  /* 16px - Mobile */
    box-shadow: none;
}

@media (min-width: 640px) {
    .card {
        padding: 1.5rem;  /* 24px - Tablet/Desktop */
    }
}
```

### Card Specifications
- **Background:** `rgba(221, 237, 210, 0.2)` (mint 20% opacity)
- **Border:** 2px solid mint green
- **Border Radius:** 12px (`var(--radius-lg)`)
- **Padding:** 16px mobile, 24px desktop
- **Width:** Full width of container (minus outer 4px padding)

---

## Button Styling

### Touch Targets
```css
/* From public/styles.css */
--touch-min: 52px;          /* Minimum button height */
--touch-padding: 14px 20px; /* Button padding */
```

### Button Classes

#### Primary Button (`.btn-primary`)
- **Background:** Solid mint green (`#DDEDD2`)
- **Text:** Black
- **Min Height:** 52px
- **Padding:** 14px vertical, 20px horizontal
- **Use Case:** Main actions (Submit, Continue, Save)

#### Secondary Button (`.btn-secondary`)
- **Background:** Transparent
- **Border:** 2px solid mint green
- **Text:** Mint green
- **Min Height:** 52px
- **Padding:** 14px vertical, 20px horizontal
- **Use Case:** Secondary actions (Discard, Cancel)

---

## Spacing Guidelines

### Outer Spacing
- **Screen Edge to Container:** 4px (0.25rem)
- **Container to Card Border:** 0px (cards touch container edges)
- **Total Wasted Space per Side:** ~20px (4px outer + 16px card padding)

### Inner Spacing
- **Card Internal Padding:** 16px mobile, 24px desktop
- **Section Margin Bottom:** 1.5rem (24px) typical
- **Button Gaps:** 0.75rem (12px) horizontal in button groups

---

## Color System

### Background Colors
- **Page Background:** `#000000` (black)
- **Card Background:** `rgba(221, 237, 210, 0.2)` (mint 20%)
- **Header Background:** `rgba(221, 237, 210, 0.2)` (mint 20%)

### Interactive Colors
- **Primary:** `#DDEDD2` (mint green)
- **Text on Dark:** `var(--text-primary)` (mint green)
- **Text on Light:** Black
- **Border:** `var(--border-primary)` (mint green)

### Placeholder Text
- **Opacity:** 60% (`rgba(221, 237, 210, 0.6)`)

---

## Responsive Breakpoints

### Mobile-First Approach
```css
/* Mobile default: < 640px */
/* Full width, minimal padding */

/* Tablet: ≥ 640px */
@media (min-width: 640px) {
  /* Increased card padding to 24px */
}

/* Desktop: ≥ 900px */
/* Content constrained to 900px, centered */
```

### Content Max-Width
- **All Pages:** 900px on desktop
- **Reasoning:** Comfortable reading width, aligns with header content area

---

## Implementation Examples

### Dashboard Page
```tsx
return (
  <>
    <IconNav />
    <div className="min-h-screen" style={{ 
      padding: '0.25rem', 
      paddingTop: '76px', 
      maxWidth: '900px', 
      margin: '0 auto' 
    }}>
      <div className="container">
        {/* Dashboard content */}
      </div>
    </div>
  </>
);
```

### Track Round Page
```tsx
return (
  <>
    <IconNav />
    <div style={{ 
      paddingTop: '76px', 
      padding: '76px 0.25rem 2rem', 
      maxWidth: '900px', 
      margin: '0 auto' 
    }}>
      <div className="container">
        {/* Track round content */}
      </div>
    </div>
  </>
);
```

---

## Pages Using This Standard

- ✅ **TrackRoundPage** - `/track-round`
- ✅ **DashboardPage** - `/dashboard`
- ⏳ **HomePage** - `/` (needs update)
- ⏳ **LoginPage** - `/login` (needs update)
- ⏳ **TrackLivePage** - `/track-live` (needs update)
- ⏳ **ResetPasswordPage** - `/reset-password` (needs update)

---

## Testing Checklist

### Mobile Testing
- [ ] Cards use ~95% of screen width
- [ ] Buttons are 52px tall minimum
- [ ] No horizontal scrolling
- [ ] Text is readable in all cards
- [ ] Touch targets don't overlap

### Desktop Testing
- [ ] Content max-width 900px
- [ ] Content centered on screen
- [ ] Header spans full width
- [ ] Logo and content visually aligned
- [ ] No excessive whitespace

### Cross-Browser
- [ ] Chrome/Edge
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Samsung Internet

---

## Design Rationale

### Why 4px Outer Padding?
- Prevents card borders from clipping at screen edges
- Minimal visual impact (~1% of mobile width)
- Safe zone for rounded corners

### Why 16px Card Padding?
- Comfortable reading distance from border
- Prevents text from feeling cramped
- Matches standard UI padding conventions

### Why 52px Button Height?
- Apple recommends 44px minimum for touch targets
- 52px provides extra comfort for outdoor use (gloves, cold hands)
- Easier to tap while moving (golf cart, walking)

### Why 900px Max Width?
- Optimal reading line length (45-75 characters)
- Comfortable for data-heavy tables
- Prevents excessive eye movement on large screens

---

## Future Considerations

### Potential Adjustments
- **Landscape Mobile:** Could increase to 1200px max-width for better tablet landscape use
- **Large Screens:** Could add breakpoint at 1440px+ for multi-column layouts
- **Accessibility:** May need to increase touch targets to 56-60px for accessibility compliance

### Pending Features
- PWA install prompt positioning
- Toast notification placement
- Modal dialog sizing
- Offline banner positioning

---

## Version History

### v1.0 - November 10, 2025
- Initial standard documentation
- Mobile-first approach: 95% screen usage
- Desktop max-width: 900px
- Button height: 52px
- Outer padding: 4px (0.25rem)
- Card padding: 16px mobile, 24px desktop
