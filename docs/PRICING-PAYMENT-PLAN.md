# Karl Golf GIR - Pricing & Payment System Plan

**Version:** 3.2.0  
**Status:** 📋 Planning Phase  
**Last Updated:** November 2025

---

## 🎯 Overview

This document outlines the implementation plan for adding a subscription-based payment system to Karl Golf GIR. The system will require users to pay $10/year for unlimited access while allowing a free trial of one complete 18-hole round.

---

## 💰 Pricing Model

### Single Tier Pricing
- **Price:** $10.00 USD per year
- **Billing Cycle:** Annual subscription
- **Free Trial:** 1 complete 18-hole round (no credit card required)

### Access Levels

| User Type | Access | Payment Required |
|-----------|--------|------------------|
| **Guest (Unregistered)** | 1 full 18-hole round | No |
| **Registered (Unpaid)** | Cannot register without payment | Yes |
| **Registered (Paid)** | Unlimited rounds | Yes (paid) |
| **Admin Override** | Unlimited rounds | No (manually granted) |
| **baileypc@gmail.com** | Unlimited rounds | No (hardcoded exception) |

---

## 🔐 User Flow & Access Control

### Flow 1: New Guest User (No Account)
```
1. User opens app → Home page
2. User clicks "Track Round" → Course selection
3. User tracks 1st round (1-18 holes) → ✅ Allowed
4. User completes 1st round → Round saved to localStorage
5. User tries to start 2nd round → 🚫 BLOCKED
6. Paywall modal appears:
   - "Create account & subscribe ($10/year) to continue"
   - "Sign In" (if they already have account)
```

### Flow 2: New User Registration
```
1. User clicks "Create Account" from paywall
2. Registration form appears with:
   - Email
   - Password
   - Payment required checkbox (checked, disabled)
3. User enters email/password
4. Payment gateway opens (Stripe Checkout)
5. User completes payment → Account created
6. User redirected to dashboard with full access
7. Welcome email sent with receipt
```

### Flow 3: Existing User Login
```
1. User clicks "Sign In"
2. Login form appears
3. User enters credentials
4. Backend checks payment status:
   - If paid → Full access granted
   - If unpaid → Redirect to payment page
   - If admin override → Full access granted
```

### Flow 4: Admin Override
```
1. Admin logs into admin dashboard
2. Admin navigates to "Users" section
3. Admin finds user by email
4. Admin clicks "Grant Access" button
5. User's `subscription_status` set to "admin_override"
6. User gets unlimited access without payment
```

---

## 📊 Database Schema Changes

### New User Files (per user directory)

#### `subscription.json`
```json
{
  "status": "active|inactive|trial|admin_override",
  "plan": "annual",
  "price": 10.00,
  "currency": "USD",
  "payment_method": "stripe",
  "stripe_customer_id": "cus_xxxxx",
  "stripe_subscription_id": "sub_xxxxx",
  "start_date": "2025-11-18",
  "expiry_date": "2026-11-18",
  "last_payment_date": "2025-11-18",
  "auto_renew": true,
  "trial_used": false,
  "trial_rounds_completed": 0,
  "created_at": "2025-11-18 10:30:00",
  "updated_at": "2025-11-18 10:30:00"
}
```

#### Updated `rounds.json` Structure
```json
[
  {
    "roundId": "uuid-v4",
    "timestamp": "2025-11-18 10:30:00",
    "date": "2025-11-18",
    "courseName": "Branson Hills Golf Club",
    "roundNumber": 1,
    "holes": [...],
    "stats": {...},
    "is_trial_round": true  // NEW: Track if this was a trial round
  }
]
```

### Updated User Directory Structure
```
/data/
  /{user_hash}/
    ├── password.txt              (existing)
    ├── email.txt                 (existing)
    ├── rounds.json               (existing - updated)
    ├── current_round.json        (existing)
    ├── reset_token.json          (existing)
    ├── subscription.json         (NEW)
    └── payment_history.json      (NEW)
```

#### `payment_history.json`
```json
[
  {
    "payment_id": "pi_xxxxx",
    "amount": 10.00,
    "currency": "USD",
    "status": "succeeded",
    "payment_method": "card",
    "stripe_invoice_id": "in_xxxxx",
    "receipt_url": "https://...",
    "created_at": "2025-11-18 10:30:00"
  }
]
```

---

## 🛠️ Technical Implementation

### Phase 1: Backend Infrastructure

#### 1.1 New API Endpoints

**`/api/subscription/check-access.php`**
- Check if user has access to track rounds
- Returns: `{ hasAccess: boolean, reason: string, trialRoundsRemaining: number }`

**`/api/subscription/create-checkout.php`**
- Create Stripe Checkout session
- Input: `{ email, priceId }`
- Returns: `{ sessionId, checkoutUrl }`

**`/api/subscription/webhook.php`**
- Handle Stripe webhooks (payment success, subscription updates)
- Verify webhook signature
- Update user subscription status

**`/api/subscription/get-status.php`**
- Get current subscription status for logged-in user
- Returns subscription.json data

**`/api/subscription/cancel.php`**
- Cancel subscription (keeps access until expiry)
- Updates auto_renew to false

**`/api/subscription/portal.php`**
- Generate Stripe Customer Portal link
- Allows users to manage payment methods, view invoices

#### 1.2 Modified API Endpoints

**`/api/auth/register.php`** - Updated
- Add payment requirement check
- Create subscription.json on successful payment
- Prevent registration without payment (except admin override)

**`/api/rounds/save.php`** - Updated
- Check subscription status before saving
- Track trial rounds
- Block saving if no access

**`/api/admin/users.php`** - Updated
- Include subscription status in user list
- Add payment status column

#### 1.3 New Admin Endpoints

**`/api/admin/grant-access.php`**
- Manually grant unlimited access to user
- Set status to "admin_override"
- Input: `{ userHash, reason }`

**`/api/admin/revoke-access.php`**
- Remove admin override
- Set status back to "inactive"

**`/api/admin/subscription-stats.php`**
- Get subscription analytics
- Total paid users, MRR, churn rate, etc.

---

### Phase 2: Frontend Implementation

#### 2.1 New Components

**`<PaywallModal />`**
- Shown when trial limit reached
- Options: "Subscribe Now" or "Sign In"
- Displays pricing and benefits

**`<SubscriptionStatus />`**
- Shows current subscription status on dashboard
- Displays expiry date, renewal date
- Link to manage subscription

**`<PaymentForm />`**
- Stripe Checkout integration
- Embedded or redirect mode

#### 2.2 Modified Components

**`HomePage.tsx`**
- Add subscription status indicator
- Show "Manage Subscription" link for paid users

**`TrackRoundPage.tsx`**
- Check access before allowing round tracking
- Show paywall if limit reached
- Display trial rounds remaining

**`LoginPage.tsx`**
- Update registration flow to include payment
- Add payment requirement notice

**`DashboardPage.tsx`**
- Add subscription status card
- Show payment history
- Link to customer portal

#### 2.3 New Pages

**`/subscription` - Subscription Management**
- View current plan
- Update payment method
- View payment history
- Cancel subscription

**`/payment-success` - Payment Confirmation**
- Thank you page after successful payment
- Display receipt
- Link to start tracking rounds

**`/payment-cancelled` - Payment Cancelled**
- Shown if user cancels Stripe Checkout
- Option to try again

---

### Phase 3: Admin Dashboard Updates

#### 3.1 User Management Enhancements

**New "Subscription" Column in Users Table**
- Status badge (Active, Inactive, Trial, Admin Override)
- Expiry date
- Payment method

**User Actions Menu**
- ✅ Grant Access (admin override)
- ❌ Revoke Access
- 📧 Send Payment Reminder
- 🔍 View Payment History
- 🗑️ Delete User (existing)

**Subscription Filters**
- All Users
- Active Subscribers
- Expired Subscriptions
- Trial Users
- Admin Overrides

#### 3.2 New Analytics Section

**Subscription Metrics Dashboard**
- Total Subscribers
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Churn Rate
- Trial Conversion Rate
- Average Customer Lifetime Value

**Charts**
- Subscription growth over time
- Revenue over time
- Trial to paid conversion funnel

---

## 💳 Payment Integration (Stripe)

### Stripe Setup Requirements

1. **Stripe Account**
   - Create Stripe account
   - Get API keys (test & live)
   - Set up webhook endpoint

2. **Products & Prices**
   - Create product: "Karl Golf GIR Annual Subscription"
   - Create price: $10.00 USD / year
   - Recurring billing enabled

3. **Webhook Events to Handle**
   - `checkout.session.completed` - Payment successful
   - `customer.subscription.updated` - Subscription changed
   - `customer.subscription.deleted` - Subscription cancelled
   - `invoice.payment_succeeded` - Renewal payment successful
   - `invoice.payment_failed` - Payment failed

### Environment Variables

```env
# Stripe API Keys
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs
STRIPE_ANNUAL_PRICE_ID=price_xxxxx
```

---

## 🔒 Security Considerations

1. **Webhook Signature Verification**
   - Always verify Stripe webhook signatures
   - Prevent replay attacks

2. **Payment Data**
   - Never store credit card numbers
   - Only store Stripe customer/subscription IDs
   - Use Stripe Customer Portal for payment updates

3. **Access Control**
   - Server-side validation on every round save
   - Don't trust client-side checks
   - Rate limiting on API endpoints

4. **Admin Override Logging**
   - Log all admin access grants/revokes
   - Include admin email and reason
   - Audit trail for compliance

---

## 📧 Email Notifications

### New Email Templates

1. **Payment Successful**
   - Thank you message
   - Receipt with amount paid
   - Subscription details (start/end date)
   - Link to dashboard

2. **Subscription Expiring Soon**
   - Sent 7 days before expiry
   - Reminder to update payment method
   - Link to customer portal

3. **Subscription Expired**
   - Sent on expiry date
   - Account now limited to trial
   - Link to renew

4. **Payment Failed**
   - Sent when renewal payment fails
   - Instructions to update payment method
   - Grace period notice (if applicable)

5. **Admin Access Granted**
   - Notification that admin granted access
   - No payment required
   - Link to start using app

---

## 🧪 Testing Plan

### Test Scenarios

1. **Guest User Trial**
   - ✅ Track 1st round (allowed)
   - ✅ Complete 1st round (saved)
   - ✅ Try 2nd round (blocked)
   - ✅ Paywall appears

2. **Registration & Payment**
   - ✅ Register with payment
   - ✅ Payment succeeds → Account created
   - ✅ Payment fails → Error shown
   - ✅ Payment cancelled → Return to registration

3. **Subscription Management**
   - ✅ View subscription status
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ Reactivate subscription

4. **Admin Override**
   - ✅ Grant access to user
   - ✅ User gets unlimited access
   - ✅ Revoke access
   - ✅ User blocked again

5. **Edge Cases**
   - ✅ Expired subscription → Block access
   - ✅ Failed renewal → Grace period
   - ✅ Multiple devices → Sync status
   - ✅ Offline mode → Check on reconnect

---

## 📋 Implementation Checklist

### Backend
- [ ] Create subscription.json schema
- [ ] Create payment_history.json schema
- [ ] Implement `/api/subscription/check-access.php`
- [ ] Implement `/api/subscription/create-checkout.php`
- [ ] Implement `/api/subscription/webhook.php`
- [ ] Implement `/api/subscription/get-status.php`
- [ ] Implement `/api/subscription/cancel.php`
- [ ] Implement `/api/subscription/portal.php`
- [ ] Update `/api/auth/register.php`
- [ ] Update `/api/rounds/save.php`
- [ ] Implement `/api/admin/grant-access.php`
- [ ] Implement `/api/admin/revoke-access.php`
- [ ] Implement `/api/admin/subscription-stats.php`
- [ ] Add baileypc@gmail.com hardcoded exception

### Frontend
- [ ] Create `<PaywallModal />` component
- [ ] Create `<SubscriptionStatus />` component
- [ ] Create `<PaymentForm />` component
- [ ] Update `TrackRoundPage.tsx` with access checks
- [ ] Update `LoginPage.tsx` registration flow
- [ ] Update `DashboardPage.tsx` with subscription info
- [ ] Create `/subscription` page
- [ ] Create `/payment-success` page
- [ ] Create `/payment-cancelled` page
- [ ] Add trial rounds counter to UI

### Admin Dashboard
- [ ] Add subscription column to users table
- [ ] Add "Grant Access" button
- [ ] Add "Revoke Access" button
- [ ] Add subscription filters
- [ ] Create subscription metrics dashboard
- [ ] Add payment history view per user
- [ ] Add subscription analytics charts

### Stripe Integration
- [ ] Create Stripe account
- [ ] Set up products & prices
- [ ] Configure webhook endpoint
- [ ] Test webhook events
- [ ] Add environment variables
- [ ] Test payment flow (test mode)
- [ ] Test subscription renewal
- [ ] Test payment failure handling

### Email Templates
- [ ] Payment successful email
- [ ] Subscription expiring email
- [ ] Subscription expired email
- [ ] Payment failed email
- [ ] Admin access granted email

### Testing
- [ ] Test guest trial flow
- [ ] Test registration with payment
- [ ] Test subscription management
- [ ] Test admin override
- [ ] Test edge cases
- [ ] Test on mobile devices
- [ ] Test offline behavior

### Documentation
- [ ] Update README with pricing info
- [ ] Create user guide for subscription
- [ ] Create admin guide for user management
- [ ] Document Stripe setup process
- [ ] Update deployment guide

---

## 🚀 Deployment Strategy

### Phase 1: Development (v3.2.0-dev)
- Build all features in test mode
- Use Stripe test keys
- Test with fake credit cards
- Internal testing only

### Phase 2: Beta (v3.2.0-beta)
- Deploy to staging environment
- Invite beta testers
- Collect feedback
- Fix bugs

### Phase 3: Production (v3.2.0)
- Switch to Stripe live keys
- Deploy to production
- Monitor for issues
- Gradual rollout (existing users grandfathered?)

---

## 💡 Future Enhancements

1. **Multiple Plans**
   - Monthly option ($1.99/month)
   - Lifetime option ($49.99 one-time)

2. **Team/Coach Plans**
   - Coach can manage multiple students
   - Bulk pricing

3. **Promo Codes**
   - Discount codes for marketing
   - Referral program

4. **Gift Subscriptions**
   - Buy subscription for someone else

5. **Free Tier with Ads**
   - Alternative to paid subscription
   - Display ads in app

---

## ❓ Open Questions

1. **Grandfathering Existing Users?**
   - Should current users get free access?
   - Or require payment after grace period?

2. **Grace Period for Failed Payments?**
   - How many days before blocking access?
   - Send reminder emails?

3. **Refund Policy?**
   - Full refund within 30 days?
   - Pro-rated refunds?

4. **Tax Handling?**
   - Does Stripe handle sales tax?
   - International VAT?

5. **Trial Round Definition?**
   - Must be 18 holes to count as "1 round"?
   - Or any round (9 holes, 1 hole)?

---

## 📞 Support & Contact

For questions about this implementation plan, contact:
- **Developer:** baileypc@gmail.com
- **Admin:** Karl Golf GIR Admin Dashboard

---

**End of Document**

