# Security Audit Plan - Admin & User Authentication

## Audit Overview
**Date:** December 2025  
**Scope:** Full security audit of authentication systems (admin and user)  
**Method:** Runtime debugging with instrumentation logs

---

## Phase 1: Common Security Vulnerabilities (Typical Issues)

### 1.1 Session Security Issues
**Hypothesis A:** Session fixation - session ID not regenerated on privilege escalation  
**Hypothesis B:** Session hijacking - missing HttpOnly/Secure flags on session cookies  
**Hypothesis C:** Session timeout not enforced properly  
**Hypothesis D:** Session data exposed in error logs or responses

### 1.2 Password Security Issues
**Hypothesis E:** Weak password hashing (not using bcrypt or insufficient cost)  
**Hypothesis F:** Password stored in plaintext or weak encoding  
**Hypothesis G:** Password reset token not properly invalidated after use  
**Hypothesis H:** Password reset token timing attack vulnerability

### 1.3 CSRF Protection
**Hypothesis I:** No CSRF tokens on state-changing operations  
**Hypothesis J:** CSRF protection bypass via JSON content-type  
**Hypothesis K:** SameSite cookie attribute not set

### 1.4 Rate Limiting Issues
**Hypothesis L:** Rate limiting bypass via IP spoofing  
**Hypothesis M:** Rate limiting not applied to all sensitive endpoints  
**Hypothesis N:** Rate limit files not properly secured (readable/writable)

### 1.5 Input Validation Issues
**Hypothesis O:** Path traversal in file operations (../ attacks)  
**Hypothesis P:** Email validation insufficient (allows injection)  
**Hypothesis Q:** JSON injection in API requests  
**Hypothesis R:** XSS via unsanitized output

### 1.6 Authorization Issues
**Hypothesis S:** Admin endpoints accessible without proper auth check  
**Hypothesis T:** User can access other users' data via hash manipulation  
**Hypothesis U:** Privilege escalation (user accessing admin functions)

---

## Phase 2: App-Specific Security Issues

### 2.1 File System Security
**Hypothesis V:** User directory creation vulnerable to race conditions  
**Hypothesis W:** File permissions too permissive (world-readable)  
**Hypothesis X:** Data directory path traversal vulnerability

### 2.2 Token Security
**Hypothesis Y:** Reset token stored in predictable location  
**Hypothesis Z:** Token expiration not properly checked  
**Hypothesis AA:** Token reuse after password reset

### 2.3 Session Management
**Hypothesis AB:** Admin and user sessions not properly isolated  
**Hypothesis AC:** Session timeout different between admin and user  
**Hypothesis AD:** Concurrent session handling issues

### 2.4 API Security
**Hypothesis AE:** API endpoints accept GET for state-changing operations  
**Hypothesis AF:** Missing authentication on protected endpoints  
**Hypothesis AG:** Error messages leak sensitive information

---

## Testing Methodology

1. **Instrument authentication files** with debug logs to test all hypotheses
2. **Test session security** - cookie flags, regeneration, timeout
3. **Test password security** - hashing, storage, reset flow
4. **Test CSRF protection** - token validation, SameSite cookies
5. **Test rate limiting** - bypass attempts, IP spoofing
6. **Test input validation** - path traversal, injection, XSS
7. **Test authorization** - admin/user separation, data access
8. **Test file system** - permissions, path traversal, race conditions
9. **Test token security** - generation, storage, expiration
10. **Test API endpoints** - method restrictions, error handling

---

## Files to Instrument

- `api/auth/login.php` - User authentication
- `api/admin/auth.php` - Admin authentication  
- `api/common/session.php` - Session management
- `api/common/validation.php` - Input validation
- `api/common/rate-limiter.php` - Rate limiting
- `api/common/data-path.php` - Path resolution
- `api/common/file-lock.php` - File operations

---

## Expected Findings

Based on code review, potential issues to verify:
1. Session cookie configuration (HttpOnly, Secure, SameSite)
2. CSRF token implementation (currently missing)
3. Rate limiting IP spoofing vulnerability
4. Path traversal in user directory creation
5. Admin/user session isolation
6. Token expiration enforcement
7. Error message information leakage

