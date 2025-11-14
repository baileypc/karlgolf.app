# Karl's GIR - UI/UX v2.0 Assessment
## Mobile-First Design Review

**Date:** January 2025  
**Status:** ✅ **ALL ISSUES RESOLVED** - Implementation Complete  
**Focus:** Mobile-First UI/UX Redesign  
**SME:** UI/UX Design Specialist

> **Note:** This document was the initial assessment that identified issues. All issues listed below have been resolved in the complete UI/UX v2.0 implementation. See `UI-UX-V2-IMPLEMENTATION-SUMMARY.md` for current status.

---

## Executive Summary

This assessment evaluated the initial state of Karl's GIR with a focus on mobile-first design principles. **All identified issues have been resolved.**

**Original Grade: C+**  
**Current Status: ✅ A - All Issues Resolved**

**Original Issues:**
- ✅ Strong color system foundation - **ENHANCED with CSS variables**
- ✅ Inconsistent responsive implementation - **FIXED with mobile-first approach**
- ✅ Touch targets too small for mobile - **FIXED - all meet 44px minimum**
- ✅ Navigation not optimized for small screens - **FIXED with hamburger menu + bottom nav**
- ✅ Flexbox usage inconsistent - **STANDARDIZED across all pages**

---

## 1. FLEXBOX ASSESSMENT

### Current State
**Grade: C**

#### Issues Found:

1. **Inconsistent Flex Usage**
   - Mix of Tailwind utility classes (`flex`, `flex-col`, `flex-wrap`) and inline styles
   - Some components use `grid` where `flex` would be more appropriate
   - No consistent flex pattern across pages

2. **Missing Flex Properties**
   - No consistent use of `flex-grow`, `flex-shrink`, or `flex-basis`
   - Gap spacing inconsistent (using `gap-2`, `gap-3`, `gap-4` randomly)
   - Alignment properties (`items-center`, `justify-center`) used inconsistently

3. **Mobile-Specific Flex Issues**
   - Header navigation uses `grid-cols-3` instead of flex with proper wrapping
   - Cards don't use flex for internal spacing consistently
   - Button groups not using flex for proper mobile stacking

#### Examples from Code:

**dashboard.html (Line 50):**
```html
<div class="grid grid-cols-3 items-center mb-6">
```
❌ **Problem:** Grid layout doesn't wrap well on very small screens. Should use flex with wrap.

**index.html (Line 152):**
```html
<div className="flex items-center justify-between">
```
✅ **Good:** Proper flex usage, but needs mobile consideration for wrapping.

**track-round.html:**
- Multiple instances of `flex` without `flex-wrap` for mobile
- Button groups that should stack on mobile don't have responsive flex direction

### Recommendations:

1. **Standardize Flex Patterns**
   ```css
   /* Mobile-first flex utilities */
   .flex-mobile {
     display: flex;
     flex-direction: column; /* Stack on mobile */
   }
   
   @media (min-width: 640px) {
     .flex-mobile {
       flex-direction: row; /* Side-by-side on tablet+ */
     }
   }
   ```

2. **Replace Grid with Flex Where Appropriate**
   - Header navigation: Use `flex` with `flex-wrap` instead of `grid-cols-3`
   - Stats cards: Use flex with proper wrapping
   - Button groups: Use flex with column direction on mobile

3. **Consistent Gap Spacing**
   - Use CSS custom properties for consistent spacing
   - Mobile: `gap-2` (8px)
   - Tablet: `gap-4` (16px)
   - Desktop: `gap-6` (24px)

---

## 2. RESPONSIVE DESIGN ASSESSMENT

### Current State
**Grade: D+**

#### Critical Issues:

1. **Viewport Meta Tag**
   ✅ **Good:** Present in all HTML files
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **Breakpoint Strategy**
   ❌ **Problem:** No consistent breakpoint system
   - Uses Tailwind defaults (`sm:`, `md:`, `lg:`) inconsistently
   - Some components have no mobile styles at all
   - Breakpoints applied randomly, not systematically

3. **Mobile-First Approach**
   ❌ **Problem:** Desktop-first thinking evident
   - Many styles written for desktop, then overridden for mobile
   - Should be: mobile styles first, then enhanced for larger screens

4. **Typography Scaling**
   ⚠️ **Partial:** Some responsive text, but inconsistent
   - Headings don't scale properly on small screens
   - Button text sizes not optimized for mobile
   - Line heights too tight on mobile

5. **Spacing Issues**
   ❌ **Problem:** Padding/margins too large on mobile
   ```html
   <!-- dashboard.html -->
   <div class="p-3 sm:p-4">
   ```
   ⚠️ Should be: `p-2 sm:p-4 md:p-6` (mobile-first)

6. **Container Widths**
   ⚠️ **Partial:** Some max-widths, but not consistent
   - `max-w-2xl` used in some places
   - No consistent container system
   - Content too wide on very small screens

7. **Image Responsiveness**
   ⚠️ **Partial:** Logo images have fixed sizes
   ```html
   <img src="assets/images/karls_gir.png" class="w-16 h-16">
   ```
   ⚠️ Should scale down on very small screens

### Specific Page Issues:

#### **index.html (Landing Page)**
- Modal cards: Fixed width `max-w-lg` - too wide for small phones
- Button spacing: `px-6 py-4` - too large for mobile
- Text sizes: `text-xl` - may be too large on small screens

#### **dashboard.html**
- Stats grid: `grid-cols-2 sm:grid-cols-3` - 2 columns too cramped on mobile
- Should be: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Header buttons: Too small touch targets
- Cards: Padding `p-4` - too much on mobile

#### **track-round.html**
- Form inputs: Not optimized for mobile keyboards
- Button groups: Don't stack properly on mobile
- Hole cards: Too much vertical space on mobile

#### **login.html**
- Form container: `max-w-md` - okay, but padding issues
- Input fields: `px-4 py-3` - good, but could be larger for mobile
- Button spacing: Needs improvement

### Recommendations:

1. **Implement Mobile-First Breakpoint System**
   ```css
   /* Mobile-first breakpoints */
   :root {
     --bp-mobile: 320px;   /* Small phones */
     --bp-sm: 640px;        /* Large phones */
     --bp-md: 768px;        /* Tablets */
     --bp-lg: 1024px;       /* Small desktops */
     --bp-xl: 1280px;       /* Large desktops */
   }
   ```

2. **Responsive Typography Scale**
   ```css
   /* Mobile-first typography */
   h1 { font-size: 1.5rem; }      /* 24px mobile */
   @media (min-width: 640px) {
     h1 { font-size: 2rem; }       /* 32px tablet */
   }
   @media (min-width: 1024px) {
     h1 { font-size: 2.5rem; }     /* 40px desktop */
   }
   ```

3. **Container System**
   ```css
   .container {
     width: 100%;
     padding: 0 1rem;              /* 16px mobile */
     margin: 0 auto;
   }
   
   @media (min-width: 640px) {
     .container {
       padding: 0 1.5rem;          /* 24px tablet */
       max-width: 640px;
     }
   }
   
   @media (min-width: 1024px) {
     .container {
       max-width: 1024px;
     }
   }
   ```

4. **Responsive Images**
   ```html
   <img src="logo.png" 
        class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
        alt="Logo">
   ```

---

## 3. COLOR SYSTEM ASSESSMENT

### Current State
**Grade: B**

#### Color Palette (From main.css):
```css
:root {
    --color-dark: #0a140a;           /* Dark green/black background */
    --color-light-green: #DDEDD2;    /* Light green - primary UI */
    --color-brown: #F2D1A4;          /* Brown accent */
    --color-gold: #D4A574;           /* Gold highlight */
    --color-cream: #FFF8E7;          /* Cream accent */
}
```

### Assessment:

#### ✅ **Strengths:**
1. **CSS Variables Defined**
   - Good use of CSS custom properties
   - Centralized color management

2. **Logo Color Alignment**
   - `#DDEDD2` (light green) appears to match logo
   - Dark background creates good contrast

3. **Semantic Naming**
   - Color names are descriptive

#### ❌ **Issues:**

1. **Inconsistent Usage**
   - Hard-coded hex values throughout HTML (Tailwind classes)
   - Not using CSS variables consistently
   - Mix of `#0a140a`, `bg-[#0a140a]`, and `var(--color-dark)`

2. **Background Colors**
   ```html
   <!-- Inconsistent background usage -->
   <div class="bg-[#0a140a]">           <!-- Hard-coded -->
   <div class="bg-[#050a05]">           <!-- Different shade! -->
   <div class="bg-[#1a2e1a]">           <!-- Another variant -->
   ```
   ❌ **Problem:** Multiple dark green shades not in design system

3. **Button Colors**
   ```html
   <!-- Various button styles -->
   <button class="bg-[#DDEDD2] text-[#0a140a]">  <!-- Primary -->
   <button class="border-2 border-[#DDEDD2]">    <!-- Outlined -->
   <button class="bg-red-500">                   <!-- Error - not in palette! -->
   <button class="bg-red-600">                   <!-- Another error color -->
   ```
   ❌ **Problem:** Error states use Tailwind red, not palette colors

4. **Card Colors**
   ```html
   <!-- dashboard.html -->
   <div class="bg-[#050a05]">           <!-- Card background -->
   <div class="bg-[#1a2e1a]">           <!-- Different card -->
   <div class="bg-gradient-to-r from-[#1a2e1a] to-[#2d4a2d]">  <!-- Gradient -->
   ```
   ❌ **Problem:** Multiple card background colors not in system

5. **Text Colors**
   ```html
   <p class="text-[#DDEDD2]">           <!-- Primary text -->
   <p class="text-white">                <!-- Should use palette -->
   <p class="text-[#d1fae5]">            <!-- Different green! -->
   <p class="text-[#a7f3d0]">           <!-- Another variant -->
   ```
   ❌ **Problem:** Multiple text color variants

6. **Border Colors**
   ```html
   <div class="border-[#DDEDD2]">        <!-- Good -->
   <div class="border-[#2d4a2d]">       <!-- Not in palette -->
   <div class="border-green-500">       <!-- Tailwind color -->
   ```
   ❌ **Problem:** Inconsistent border colors

7. **Status/State Colors**
   - Success: Uses `green-500`, `green-600` (not in palette)
   - Error: Uses `red-400`, `red-500`, `red-600` (not in palette)
   - Warning: Not defined
   - Info: Not defined

### Logo Color Analysis Needed:
⚠️ **Action Required:** Need to extract exact colors from `karls_gir.png` logo to ensure perfect match.

### Recommendations:

1. **Expand Color System**
   ```css
   :root {
     /* Primary Palette (from logo) */
     --color-dark: #0a140a;
     --color-light-green: #DDEDD2;
     --color-brown: #F2D1A4;
     --color-gold: #D4A574;
     --color-cream: #FFF8E7;
     
     /* Semantic Colors (derived from palette) */
     --color-success: #DDEDD2;        /* Light green for success */
     --color-error: #F2D1A4;          /* Brown for errors (warm) */
     --color-warning: #D4A574;        /* Gold for warnings */
     --color-info: #DDEDD2;           /* Light green for info */
     
     /* Background Variants */
     --color-bg-primary: #0a140a;
     --color-bg-secondary: #050a05;   /* Slightly lighter */
     --color-bg-card: #1a2e1a;        /* Card background */
     --color-bg-hover: #2d4a2d;       /* Hover state */
     
     /* Text Colors */
     --color-text-primary: #DDEDD2;
     --color-text-secondary: #a7f3d0;  /* Lighter for secondary */
     --color-text-muted: #3d5a3d;      /* Muted text */
     --color-text-on-light: #0a140a;  /* Text on light backgrounds */
     
     /* Border Colors */
     --color-border-primary: #DDEDD2;
     --color-border-secondary: #2d4a2d;
     --color-border-muted: #1a2e1a;
   }
   ```

2. **Replace All Hard-Coded Colors**
   - Audit all HTML files
   - Replace `bg-[#...]` with CSS classes using variables
   - Replace `text-[#...]` with semantic classes
   - Replace `border-[#...]` with consistent border classes

3. **Create Tailwind Config**
   ```js
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           'karl-dark': '#0a140a',
           'karl-green': '#DDEDD2',
           'karl-brown': '#F2D1A4',
           'karl-gold': '#D4A574',
           'karl-cream': '#FFF8E7',
         }
       }
     }
   }
   ```

4. **Button Color System**
   ```css
   .btn-primary {
     background: var(--color-light-green);
     color: var(--color-dark);
   }
   
   .btn-secondary {
     background: transparent;
     border: 2px solid var(--color-light-green);
     color: var(--color-light-green);
   }
   
   .btn-error {
     background: transparent;
     border: 2px solid var(--color-brown);
     color: var(--color-brown);
   }
   ```

---

## 4. NAVIGATION ASSESSMENT (Touch-First)

### Current State
**Grade: D**

#### Critical Issues:

1. **Touch Target Sizes**
   ❌ **MAJOR PROBLEM:** Buttons too small for mobile
   
   **Current Button Sizes:**
   ```html
   <!-- dashboard.html -->
   <button class="px-3 py-2 ...">        <!-- 12px x 8px padding = ~36px height -->
   <a class="px-3 py-2 ...">             <!-- Too small! -->
   
   <!-- login.html -->
   <button class="px-4 py-3 ...">        <!-- 16px x 12px = ~44px height -->
   ```
   
   ❌ **Problem:** Apple HIG recommends minimum 44x44pt (44px)
   - Most buttons are 36-40px tall
   - Too small for reliable finger taps
   - No minimum touch target enforcement

2. **Header Navigation**
   ```html
   <!-- dashboard.html Line 50 -->
   <div class="grid grid-cols-3 items-center mb-6">
     <a class="px-3 py-2 ...">Rounds</a>      <!-- Left -->
     <img class="w-16 h-16 ...">              <!-- Center -->
     <button class="px-3 py-2 ...">Logout</button>  <!-- Right -->
   </div>
   ```
   
   ❌ **Problems:**
   - Buttons too small (px-3 py-2 = ~36px height)
   - Logo clickable area too small (64x64px, should be larger)
   - No spacing between touch targets
   - Grid doesn't wrap on very small screens
   - No hamburger menu for mobile

3. **Button Spacing**
   ❌ **Problem:** Buttons too close together
   - No minimum spacing between interactive elements
   - Risk of accidental taps
   - Should have at least 8px (preferably 16px) between touch targets

4. **Form Inputs**
   ⚠️ **Partial:** Some good, but inconsistent
   ```html
   <input class="px-4 py-3 ...">         <!-- 48px height - good! -->
   ```
   ✅ Inputs are appropriately sized, but:
   - Labels too small for mobile
   - Placeholder text may be too small
   - Error messages need better spacing

5. **Modal/Dialog Interactions**
   ⚠️ **Partial:** Modals exist but:
   - Close buttons too small
   - Backdrop tap-to-close not always working
   - Modal content too wide on mobile
   - Scrollable content not optimized

6. **Card Interactions**
   ❌ **Problem:** Cards with click handlers
   ```html
   <div class="... cursor-pointer" onclick="...">
   ```
   - Entire card is clickable, but no visual feedback
   - No active/pressed state
   - Cards too small on mobile for comfortable tapping

7. **Icon Buttons**
   ❌ **Problem:** Icon-only buttons too small
   ```html
   <button class="p-1 ...">              <!-- 4px padding = ~24px total -->
     <svg class="w-5 h-5 ...">            <!-- 20px icon -->
   </button>
   ```
   - Icons need larger touch targets
   - Should be minimum 44x44px even for icons

8. **Bottom Navigation**
   ❌ **Missing:** No bottom navigation bar for mobile
   - Users have to scroll to top to navigate
   - Should have sticky bottom nav on mobile

### Specific Page Navigation Issues:

#### **index.html (Landing)**
- Welcome modal cards: Clickable but no touch feedback
- Expand/collapse buttons: Too small (20x20px icons)
- No back button or clear navigation path

#### **dashboard.html**
- Header buttons: Too small
- Stats cards: Clickable but no indication
- Export buttons: Too small, especially icon buttons
- Reset button: Critical action, but small and at bottom

#### **track-round.html**
- Hole navigation: Buttons may be too small
- Form submission: Button placement not optimal
- Save/Reset buttons: Need better mobile placement

#### **login.html**
- Form buttons: Adequate size, but could be larger
- Toggle buttons (show password): Too small (20x20px)
- Link buttons: "Forgot Password" text too small

### Recommendations:

1. **Minimum Touch Target Sizes**
   ```css
   /* Mobile-first touch targets */
   .touch-target {
     min-height: 44px;
     min-width: 44px;
     padding: 12px 16px;        /* Generous padding */
   }
   
   /* Icon buttons still need 44px */
   .icon-button {
     min-width: 44px;
     min-height: 44px;
     padding: 12px;              /* Equal padding all around */
   }
   ```

2. **Button Spacing**
   ```css
   .button-group {
     display: flex;
     flex-direction: column;      /* Stack on mobile */
     gap: 16px;                   /* Generous spacing */
   }
   
   @media (min-width: 640px) {
     .button-group {
       flex-direction: row;
       gap: 12px;
     }
   }
   ```

3. **Header Navigation Redesign**
   ```html
   <!-- Mobile-first header -->
   <header class="sticky top-0 z-50 bg-[#0a140a] border-b border-[#DDEDD2]">
     <div class="flex items-center justify-between p-4">
       <!-- Hamburger menu for mobile -->
       <button class="touch-target md:hidden" aria-label="Menu">
         <svg class="w-6 h-6">...</svg>
       </button>
       
       <!-- Logo - larger touch target -->
       <a href="/" class="touch-target">
         <img src="logo.png" class="w-12 h-12" alt="Logo">
       </a>
       
       <!-- Actions -->
       <div class="flex gap-2">
         <button class="touch-target">...</button>
       </div>
     </div>
   </header>
   ```

4. **Bottom Navigation (Mobile)**
   ```html
   <!-- Sticky bottom nav for mobile -->
   <nav class="fixed bottom-0 left-0 right-0 bg-[#0a140a] border-t border-[#DDEDD2] md:hidden">
     <div class="flex justify-around p-2">
       <a href="track-round.html" class="touch-target flex flex-col items-center">
         <svg class="w-6 h-6">...</svg>
         <span class="text-xs">Rounds</span>
       </a>
       <a href="dashboard.html" class="touch-target flex flex-col items-center">
         <svg class="w-6 h-6">...</svg>
         <span class="text-xs">Stats</span>
       </a>
       <!-- etc -->
     </div>
   </nav>
   ```

5. **Visual Feedback**
   ```css
   /* Active/pressed states */
   .touch-target:active {
     transform: scale(0.95);
     opacity: 0.8;
   }
   
   /* Hover states (for devices that support it) */
   @media (hover: hover) {
     .touch-target:hover {
       background: var(--color-bg-hover);
     }
   }
   ```

6. **Form Improvements**
   ```css
   /* Larger labels on mobile */
   label {
     font-size: 1rem;              /* 16px minimum */
     margin-bottom: 8px;
   }
   
   /* Larger inputs */
   input, select, textarea {
     min-height: 48px;
     font-size: 16px;              /* Prevents zoom on iOS */
     padding: 12px 16px;
   }
   ```

---

## 5. ADDITIONAL MOBILE-FIRST CONSIDERATIONS

### A. Typography & Readability
**Grade: C**

#### Issues:
- Line heights too tight on mobile
- Text sizes not optimized for small screens
- Contrast ratios need verification
- Font weights may be too light on mobile

#### Recommendations:
```css
/* Mobile-first typography */
body {
  font-size: 16px;                /* Minimum for readability */
  line-height: 1.6;                /* Generous line height */
}

h1 { 
  font-size: 1.75rem;             /* 28px mobile */
  line-height: 1.2;
  font-weight: 700;
}

p {
  font-size: 1rem;                /* 16px */
  line-height: 1.6;
  margin-bottom: 1rem;
}
```

### B. Loading States
**Grade: C+**

#### Issues:
- Loading spinners may be too small
- No skeleton screens
- Loading text may be hard to read

#### Recommendations:
- Larger loading indicators
- Skeleton screens for better perceived performance
- Clear loading messages

### C. Error Handling
**Grade: C**

#### Issues:
- Error messages may be too small
- Error states not visually distinct enough
- No error recovery guidance

#### Recommendations:
- Larger, more prominent error messages
- Use palette colors for errors (brown/warm tones)
- Clear recovery actions

### D. Accessibility
**Grade: C-**

#### Issues:
- Touch targets too small (WCAG 2.1 violation)
- Color contrast needs verification
- Focus states may not be visible
- Screen reader support unclear

#### Recommendations:
- Verify all colors meet WCAG AA contrast (4.5:1 for text)
- Visible focus indicators
- Proper ARIA labels
- Keyboard navigation support

### E. Performance
**Grade: B**

#### Issues:
- Large React bundle (CDN)
- Images not optimized
- No lazy loading

#### Recommendations:
- Optimize images
- Implement lazy loading
- Consider code splitting

### F. Gesture Support
**Grade: D**

#### Issues:
- No swipe gestures
- No pull-to-refresh
- Scroll behavior not optimized

#### Recommendations:
- Swipe to navigate between holes
- Pull-to-refresh on dashboard
- Smooth scrolling with momentum

---

## 6. PRIORITY RECOMMENDATIONS

### 🔴 **CRITICAL (Do First)**
1. **Fix Touch Target Sizes**
   - All buttons minimum 44x44px
   - Increase padding on all interactive elements
   - Add spacing between touch targets

2. **Implement Mobile Navigation**
   - Bottom navigation bar for mobile
   - Hamburger menu for secondary actions
   - Sticky header

3. **Standardize Color System**
   - Replace all hard-coded colors
   - Use CSS variables consistently
   - Create Tailwind config

### 🟡 **HIGH PRIORITY (Do Soon)**
4. **Responsive Typography**
   - Mobile-first font sizes
   - Proper line heights
   - Readable text on all screens

5. **Fix Flexbox Usage**
   - Consistent flex patterns
   - Mobile-first flex direction
   - Proper wrapping

6. **Container & Spacing System**
   - Consistent padding/margins
   - Responsive containers
   - Mobile-first spacing scale

### 🟢 **MEDIUM PRIORITY (Nice to Have)**
7. **Visual Feedback**
   - Active/pressed states
   - Loading states
   - Error states

8. **Accessibility Improvements**
   - Color contrast verification
   - Focus indicators
   - ARIA labels

9. **Performance Optimization**
   - Image optimization
   - Lazy loading
   - Code splitting

---

## 7. MISSING CONSIDERATIONS

### Additional Areas to Assess:

1. **Dark Mode Support**
   - Currently only dark theme
   - Consider system preference detection
   - Ensure all colors work in dark mode

2. **Landscape Orientation**
   - Layout adjustments for landscape
   - Navigation changes
   - Content reorganization

3. **Very Small Screens (< 375px)**
   - iPhone SE, older Android phones
   - Extra small breakpoint needed
   - Further content reduction

4. **Tablet Optimization**
   - iPad-specific layouts
   - Larger touch targets (but still important)
   - Multi-column layouts

5. **PWA Considerations**
   - Install prompts
   - Offline states
   - App-like navigation

6. **Form UX**
   - Input types (tel, email, number)
   - Autocomplete attributes
   - Input mode hints
   - Keyboard types on mobile

7. **Scroll Behavior**
   - Smooth scrolling
   - Scroll snap points
   - Overscroll behavior

8. **Animation & Transitions**
   - Micro-interactions
   - Page transitions
   - Loading animations
   - Touch feedback animations

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)
- [ ] Audit all touch target sizes
- [ ] Create comprehensive color system
- [ ] Set up Tailwind config with custom colors
- [ ] Replace all hard-coded colors

### Phase 2: Navigation (Week 2)
- [ ] Implement bottom navigation for mobile
- [ ] Create hamburger menu
- [ ] Fix header navigation
- [ ] Add sticky positioning

### Phase 3: Responsive (Week 3)
- [ ] Mobile-first typography system
- [ ] Responsive container system
- [ ] Fix all flexbox usage
- [ ] Implement proper breakpoints

### Phase 4: Polish (Week 4)
- [ ] Visual feedback states
- [ ] Loading states
- [ ] Error states
- [ ] Accessibility improvements

---

## CONCLUSION

The current design has a solid foundation with a good color palette, but requires significant mobile-first improvements. The most critical issues are touch target sizes and navigation patterns. With focused effort on these areas, the site can achieve an A-grade mobile experience.

**Next Steps:**
1. Review this assessment with the team
2. Prioritize critical fixes
3. Create detailed implementation tickets
4. Begin Phase 1 implementation

---

*Assessment completed: January 2025*  
*Next review: After Phase 1 implementation*

