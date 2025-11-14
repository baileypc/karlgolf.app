# Modal Component Usage Guide

## Overview
Standardized modal component for all confirmations, alerts, notices, and info dialogs in Karl's GIR PWA.

## Design Features
- ✅ Matches site design system (mint green, black background)
- ✅ Mobile-optimized with large touch targets (52px buttons)
- ✅ Smooth slide-in animation
- ✅ FontAwesome icons for visual context
- ✅ Backdrop click to close
- ✅ ESC key support (future enhancement)
- ✅ Accessible close button

---

## Import

```tsx
import Modal, { useModal } from '@/components/Modal';
```

---

## Basic Usage

### Simple Alert (Info)
```tsx
function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <button onClick={open}>Show Info</button>
      
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Information"
        message="This is an informational message."
        type="info"
        confirmText="Got it"
        showCancel={false}
      />
    </>
  );
}
```

### Confirmation Dialog
```tsx
function MyComponent() {
  const { isOpen, open, close } = useModal();

  const handleDelete = () => {
    // Delete logic here
    console.log('Deleted!');
  };

  return (
    <>
      <button onClick={open}>Delete Round</button>
      
      <Modal
        isOpen={isOpen}
        onClose={close}
        onConfirm={handleDelete}
        title="Delete Round?"
        message="Are you sure you want to delete this round? This action cannot be undone."
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
      />
    </>
  );
}
```

### Success Message
```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  title="Round Saved!"
  message="Your round has been successfully saved to your statistics."
  type="success"
  confirmText="View Dashboard"
  showCancel={false}
/>
```

### Warning Message
```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  title="Incomplete Round"
  message="You have 1-8 holes recorded. You need at least 9 holes to save this round."
  type="warning"
  confirmText="Continue Adding Holes"
  cancelText="Discard"
  showCancel={true}
/>
```

---

## Props Reference

### Required Props
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Called when modal is closed |
| `title` | `string` | Modal heading text |
| `message` | `string \| React.ReactNode` | Modal body content |

### Optional Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onConfirm` | `() => void` | `undefined` | Called when confirm button clicked |
| `type` | `'success' \| 'warning' \| 'info' \| 'confirm'` | `'info'` | Visual style and icon |
| `confirmText` | `string` | `'OK'` | Confirm button label |
| `cancelText` | `string` | `'Cancel'` | Cancel button label |
| `showCancel` | `boolean` | `true` | Show/hide cancel button |

---

## Modal Types

### `type="info"` (Default)
- **Icon:** Info circle (ℹ️)
- **Use Case:** General information, notices
- **Example:** "Your data has been synced"

### `type="success"`
- **Icon:** Check circle (✓)
- **Use Case:** Success confirmations
- **Example:** "Round saved successfully!"

### `type="warning"`
- **Icon:** Exclamation triangle (⚠️)
- **Use Case:** Warnings, non-destructive alerts
- **Example:** "Incomplete round - need 9 holes minimum"

### `type="confirm"`
- **Icon:** Exclamation triangle (⚠️)
- **Use Case:** Confirmation dialogs for actions
- **Example:** "Delete this round?"

---

## Advanced Usage

### Complex Message Content
```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  title="Save Incomplete Round"
  message={
    <>
      <p>You have completed {completeNines * 9} holes.</p>
      <p style={{ marginTop: '0.5rem' }}>
        The remaining {incompleteHoles} hole{incompleteHoles !== 1 ? 's' : ''} will be deleted.
      </p>
    </>
  }
  type="confirm"
  confirmText="Save & Finish"
  cancelText="Keep Tracking"
/>
```

### Multiple Modals
```tsx
function MyComponent() {
  const deleteModal = useModal();
  const saveModal = useModal();
  const successModal = useModal();

  const handleSave = () => {
    // Save logic
    saveModal.close();
    successModal.open();
  };

  return (
    <>
      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Delete Round?"
        message="This action cannot be undone."
        type="confirm"
        onConfirm={() => {/* delete logic */}}
      />

      {/* Save Modal */}
      <Modal
        isOpen={saveModal.isOpen}
        onClose={saveModal.close}
        title="Save Round?"
        message="Save this round to your statistics?"
        type="confirm"
        onConfirm={handleSave}
      />

      {/* Success Modal */}
      <Modal
        isOpen={successModal.isOpen}
        onClose={successModal.close}
        title="Saved!"
        message="Round saved successfully."
        type="success"
        showCancel={false}
      />
    </>
  );
}
```

---

## Replacing Browser Alerts

### Before (Browser Alert)
```tsx
if (confirm('Delete this round?')) {
  // Delete logic
}
```

### After (Modal Component)
```tsx
const { isOpen, open, close } = useModal();

const handleDelete = () => {
  // Delete logic
};

// In JSX:
<button onClick={open}>Delete</button>

<Modal
  isOpen={isOpen}
  onClose={close}
  onConfirm={handleDelete}
  title="Delete Round?"
  message="Are you sure you want to delete this round?"
  type="confirm"
/>
```

---

## Common Use Cases in Karl's GIR

### 1. Discard Incomplete Round
```tsx
<Modal
  isOpen={discardModal.isOpen}
  onClose={discardModal.close}
  onConfirm={handleDiscard}
  title="Discard Round?"
  message={`Discard ${holes.length} hole${holes.length !== 1 ? 's' : ''} from ${courseName}?`}
  type="confirm"
  confirmText="Discard"
  cancelText="Keep"
/>
```

### 2. Save with Incomplete Holes
```tsx
<Modal
  isOpen={saveModal.isOpen}
  onClose={saveModal.close}
  onConfirm={handleSaveCompleteNines}
  title="Save Complete Holes?"
  message={`Save first ${completeNines * 9} holes and delete holes ${firstIncomplete}-${lastIncomplete}?`}
  type="confirm"
  confirmText="Save & Finish"
  cancelText="Cancel"
/>
```

### 3. Missing Required Fields
```tsx
<Modal
  isOpen={errorModal.isOpen}
  onClose={errorModal.close}
  title="Missing Information"
  message="Please select a Par value before submitting."
  type="warning"
  confirmText="OK"
  showCancel={false}
/>
```

### 4. Round Saved Successfully
```tsx
<Modal
  isOpen={successModal.isOpen}
  onClose={() => {
    successModal.close();
    navigate('/dashboard');
  }}
  title="Round Saved!"
  message={`${holes.length} holes saved successfully.`}
  type="success"
  confirmText="View Dashboard"
  showCancel={false}
/>
```

### 5. Logout Confirmation
```tsx
<Modal
  isOpen={logoutModal.isOpen}
  onClose={logoutModal.close}
  onConfirm={handleLogout}
  title="Logout?"
  message="Are you sure you want to logout?"
  type="confirm"
  confirmText="Logout"
  cancelText="Stay"
/>
```

---

## Styling Notes

- Modal uses `.card` class for consistent styling
- Buttons use `.btn-primary` and `.btn-secondary` classes
- Animation: 200ms slide-in from top
- Backdrop: 85% opacity black
- Max width: 500px (comfortable reading on desktop)
- Mobile: Full width minus 1rem padding per side
- z-index: 9998 (above everything except potential toasts at 9999)

---

## Accessibility

### Current Features
- Close button with aria-label
- Backdrop click to close
- Stop propagation on modal card (prevents accidental close)

### Future Enhancements
- [ ] ESC key to close
- [ ] Focus trap (tab cycles within modal)
- [ ] Focus first button on open
- [ ] Return focus to trigger element on close
- [ ] ARIA roles (dialog, alertdialog)
- [ ] Screen reader announcements

---

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Samsung Internet
- ⚠️ IE11 (not supported - uses modern React features)

---

## Migration Guide

### Step 1: Replace `confirm()` calls
Find all instances of:
```tsx
if (confirm('message')) { ... }
```

Replace with:
```tsx
const modal = useModal();
// ...
<Modal isOpen={modal.isOpen} onClose={modal.close} ... />
```

### Step 2: Replace `alert()` calls
Find all instances of:
```tsx
alert('message');
```

Replace with:
```tsx
<Modal type="info" showCancel={false} ... />
```

### Step 3: Test thoroughly
- Test on mobile (touch targets)
- Test backdrop click
- Test close button
- Test confirm/cancel flow
- Test with long messages

---

## Future Enhancements

- **Toast Notifications:** Non-blocking quick messages (3s auto-dismiss)
- **Loading Modal:** Spinner overlay for async operations
- **Input Modal:** Modal with form fields
- **Multi-step Modal:** Wizard-style flows
- **Custom Icons:** Allow passing custom FontAwesome icons
- **Animation Options:** Slide from different directions, fade, etc.

---

## Version History

### v1.0 - November 10, 2025
- Initial modal component
- Support for success, warning, info, confirm types
- useModal hook for state management
- Slide-in animation
- Mobile-optimized (52px buttons)
