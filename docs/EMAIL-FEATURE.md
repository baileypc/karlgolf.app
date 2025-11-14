# Email Results Feature

## Overview
Karl's GIR now automatically prompts users to email their round results after completing hole 9 (front 9) and hole 18 (full round).

## How It Works

### User Experience
1. **After Hole 9**: User completes the 9th hole and is prompted:
   - "Front 9 Complete! 🎉"
   - Option to enter email and receive front 9 results
   - Can click "Skip" to continue to back 9

2. **After Hole 18**: User completes the 18th hole and is prompted:
   - "Round Complete! 🏆"
   - Option to enter email and receive full round results
   - Can click "Skip" to view results without emailing

3. **Round Limit**: App stops accepting new holes after hole 18
   - Shows completion message with trophy emoji
   - Offers "Start New Round" button to reset

### Email Content
The email includes:
- **Round Summary Stats**:
  - Total Score (with to-par)
  - GIR percentage and count
  - Fairway percentage and count
  - Total putts and average
  - Scrambling percentage
  - Total penalties

- **Hole-by-Hole Breakdown**:
  - Each hole's par, score, putts
  - Visual badges for GIR, penalties, sand saves, up & downs
  - Color-coded table with hover effects

- **Professional HTML Design**:
  - Uses three-color design system: `#0a140a` (dark), `#DDEDD2` (light green), `#F2D1A4` (brown accent)
  - Light green (`#DDEDD2`) header and borders
  - Stat cards with large numbers
  - Clean table layout
  - Responsive design
  - Fallback plain text version

## Technical Implementation

### Frontend (index.html)
- **State Management**:
  ```javascript
  - showEmailModal: Controls email prompt visibility
  - emailModalType: '9hole' or '18hole'
  - userEmail: User's input email address
  - emailSending: Loading state during send
  - emailSent: Success confirmation
  ```

- **Trigger Logic**:
  ```javascript
  // In addHole function
  if (currentHole === 9 || currentHole === 18) {
    setEmailModalType(currentHole === 9 ? '9hole' : '18hole');
    setShowEmailModal(true);
  }
  ```

- **Email Modal Features**:
  - Email input with validation
  - "Skip" button to dismiss
  - "Send Email" button with loading state
  - Success confirmation with checkmark
  - Auto-closes after 2 seconds on success

### Backend (send-email.php)

#### SiteGround Compatibility
- Uses native PHP `mail()` function (standard on SiteGround)
- No external dependencies required
- Works on all SiteGround shared hosting plans
- Proper headers for HTML emails

#### Email Configuration
```php
From: Karl's GIR <noreply@cloudvirtue.com>
Reply-To: noreply@cloudvirtue.com
Content-Type: text/html; charset=UTF-8
MIME-Version: 1.0
```

#### Security Features
- Email validation using `filter_var()`
- JSON input validation
- Sanitized output
- CORS headers configured
- Error handling with JSON responses

#### API Endpoint
**URL**: `/karlsgir/send-email.php`

**Method**: POST

**Request Body**:
```json
{
  "email": "user@example.com",
  "roundType": "9hole" or "18hole",
  "holes": [...array of hole objects...],
  "stats": {
    "totalHoles": 9,
    "totalScore": 45,
    "totalPar": 36,
    "toPar": 9,
    "girsHit": 4,
    "totalGirs": 9,
    "fairwaysHit": 5,
    "eligibleFairways": 7,
    "totalPutts": 18,
    "avgPutts": "2.00",
    "scrambles": 2,
    "missedGirs": 5,
    "penalties": 1
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "Error description"
}
```

## Deployment Notes

### SiteGround Requirements
✅ **No additional setup needed** - uses standard PHP mail()

### Testing Locally (Laragon)
⚠️ **Email will NOT send** on localhost (requires mail server)
- Test modal UI and validation
- Check console for fetch errors (expected)
- Deploy to SiteGround for full testing

### Deployment Checklist
1. Upload `send-email.php` to `/karlsgir/` directory
2. Ensure PHP version is 7.4+ (SiteGround default)
3. Verify file permissions (644 for PHP files)
4. Test with real email address on live site
5. Check spam folder if email doesn't arrive

### Troubleshooting

**Email not received?**
1. Check spam/junk folder
2. Verify email address is correct
3. Check SiteGround email logs in cPanel
4. Ensure sender domain (cloudvirtue.com) has valid DNS/SPF records

**PHP errors?**
1. Enable error display in PHP temporarily
2. Check SiteGround error logs
3. Verify JSON data is correctly formatted
4. Ensure file permissions are correct

**Modal not appearing?**
1. Check browser console for JavaScript errors
2. Verify hole count is exactly 9 or 18
3. Clear localStorage if testing repeatedly

## Future Enhancements (Optional)
- [ ] Remember user's email in localStorage
- [ ] Add BCC copy to admin email
- [ ] Include course name/location input
- [ ] Add PDF attachment option
- [ ] Save email history in database
- [ ] Add email template customization

## User Privacy
- Email addresses are NOT stored
- Used only for single email transmission
- No email marketing or retention
- No third-party sharing
