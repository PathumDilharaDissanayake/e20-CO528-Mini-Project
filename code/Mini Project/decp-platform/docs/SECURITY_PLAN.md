# DECP Platform — Security Plan & Hardening Guide
**Agent**: A-08 (Security & Authentication Agent)
**Version**: 1.0.0 | **Date**: 2026-03-03 | **Classification**: Internal

---

## OWASP Top 10 Assessment (2021)

| # | Vulnerability | Status | Risk | Remediation |
|---|--------------|--------|------|-------------|
| A01 | Broken Access Control | ⚠ Partial | High | Service-to-service auth token missing |
| A02 | Cryptographic Failures | ✅ Adequate | Low | bcrypt 12 rounds, JWT HS256 |
| A03 | Injection | ✅ Adequate | Low | Sequelize parameterized queries |
| A04 | Insecure Design | ⚠ Partial | Medium | localStorage JWT, no CSRF on state changes |
| A05 | Security Misconfiguration | ⚠ Partial | Medium | Helmet present but CSP not configured |
| A06 | Vulnerable Components | ❌ Unknown | High | No automated dependency scanning |
| A07 | Auth & Session Failures | ✅ Good | Low | Refresh rotation, token revocation |
| A08 | Software & Data Integrity | ❌ Missing | High | No file magic-byte validation |
| A09 | Logging & Monitoring | ⚠ Partial | Medium | Winston logs but no SIEM integration |
| A10 | SSRF | ✅ Not applicable | Low | No server-side URL fetching |

---

## Security Issues — Priority Ordered

---

### SEC-001: File Upload Magic-Byte Validation [P1 — Critical]

**Current state**: Multer validates only the `Content-Type` header sent by the browser. This is trivially bypassed — an attacker can rename `malware.php` to `malware.jpg` or set `Content-Type: image/jpeg` on any file.

**Attack scenario**:
```
POST /api/v1/posts (multipart/form-data)
Content-Type: multipart/form-data; boundary=----boundary

Content-Disposition: form-data; name="files"; filename="shell.jpg"
Content-Type: image/jpeg

<?php system($_GET['cmd']); ?>
```

If the server ever executes files from the uploads directory (e.g., misconfigured Nginx), this becomes remote code execution.

**Fix**: Install `file-type` package and validate magic bytes before saving.

```typescript
// backend/feed-service/src/routes/postRoutes.ts — add this middleware after multer:
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf']);

export const validateFileMagicBytes = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || !(req.files as Express.Multer.File[]).length) return next();
  const files = req.files as Express.Multer.File[];
  for (const file of files) {
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      return res.status(400).json({
        success: false,
        message: `File "${file.originalname}" has an invalid or disallowed type.`
      });
    }
  }
  next();
};
```

**Note**: Switch Multer storage to `memoryStorage()` so the buffer is available before saving to disk.

---

### SEC-002: Service-to-Service Authentication [P1 — Critical]

**Current state**: Downstream services trust the `x-user-id` header unconditionally. Any request to internal ports (3001–3009) that bypasses the gateway can forge any user identity.

**Fix**: Add an internal service token validated by each downstream service.

```typescript
// backend/api-gateway/src/routes/proxyRoutes.ts — add to headers:
headers['x-internal-token'] = process.env.INTERNAL_SERVICE_TOKEN;

// Each downstream service middleware:
export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'];
  if (token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};
```

Set `INTERNAL_SERVICE_TOKEN` to a 64-character random hex string in all `.env` files (same value).

---

### SEC-003: Content Security Policy [P2 — High]

**Current state**: Helmet is configured but CSP is not set. Browsers allow inline scripts, eval(), and any-origin resource loading.

**Fix**: Add strict CSP to API gateway and Nginx:

```typescript
// backend/api-gateway/src/server.ts
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],  // MUI requires this
    imgSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'", process.env.VITE_SOCKET_URL || 'ws://localhost:3007'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

---

### SEC-004: Refresh Token in localStorage [P2 — High]

**Current state**: Both access token (15m) and refresh token (7d) are stored in localStorage. An XSS vulnerability anywhere in the app gives an attacker 7 days of access.

**Recommended fix (Phase 2)**:
- Store refresh token in `httpOnly; Secure; SameSite=Strict` cookie
- Access token can remain in memory (Redux store, not persisted)
- Add CSRF token for state-changing operations (double-submit cookie pattern)

**Phase 1 mitigation**:
- Ensure React never uses `dangerouslySetInnerHTML` with user content
- Install and configure DOMPurify for any HTML rendering

---

### SEC-005: Input Sanitization Against XSS [P2 — High]

**Current state**: Post content and messages are stored raw. If rendered with dangerouslySetInnerHTML in any notification email or future feature, stored XSS is possible.

**Fix** (server-side, feed-service):
```typescript
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window as unknown as Window);

// In postService.createPost:
const cleanContent = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
// Strips ALL HTML — posts are plain text only
```

Install: `npm install dompurify isomorphic-dompurify @types/dompurify`

---

### SEC-006: Auth Endpoint Rate Limiting [P2 — High]

**Current state**: Gateway rate limit is 2000 req/15min globally. Auth endpoints (login, register, forgot-password) are not separately limited. This allows credential stuffing at 2000 attempts per 15 minutes.

**Fix**: Per-route rate limiting in auth-service using `rate-limiter-flexible` (already installed):

```typescript
// backend/auth-service/src/middleware/authRateLimiter.ts
import { RateLimiterMemory } from 'rate-limiter-flexible';

const loginLimiter = new RateLimiterMemory({ points: 10, duration: 900 }); // 10/15min

export const loginRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await loginLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ success: false, message: 'Too many login attempts. Try again in 15 minutes.' });
  }
};
```

Apply to: `POST /login`, `POST /forgot-password`, `POST /register`

---

### SEC-007: Dependency Vulnerability Scanning [P2 — High]

**Current state**: No automated dependency vulnerability scanning is configured.

**Fix**: Add to CI pipeline:
```yaml
- name: Security Audit
  run: |
    npm audit --audit-level=high
    npx better-npm-audit audit --level high
```

Add `npm audit` check to pre-commit hook via husky.

---

### SEC-008: Sensitive Data in Logs [P3 — Medium]

**Current state**: Loggers use `logger.error('Login error:', error)` which may include stack traces with PII (email addresses, user IDs) in log files.

**Fix**: Structured logging with PII redaction:
```typescript
logger.info('Login attempt', {
  email: email.replace(/(.{2}).*@/, '$1***@'),  // redacted
  ip: req.ip,
  success: false
});
```

---

### SEC-009: Password Reset Token Collision [P3 — Medium]

**Current state**: `uuidv4()` tokens are stored in plain text in the database. If the database is compromised, all pending reset tokens are exposed.

**Fix**: Store SHA-256 hash of reset token in DB, compare hash on verification:
```typescript
import { createHash } from 'crypto';
const tokenHash = createHash('sha256').update(resetToken).digest('hex');
await user.update({ passwordResetToken: tokenHash, ... });
// On verify: compare createHash('sha256').update(token).digest('hex') === stored
```

---

## Security Configuration Checklist

### HTTP Headers (Helmet)
```typescript
app.use(helmet({
  contentSecurityPolicy: { ... },           // SEC-003
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },           // Clickjacking
  hidePoweredBy: true,                      // Remove X-Powered-By
  hsts: { maxAge: 31536000, includeSubDomains: true },  // Force HTTPS
  noSniff: true,                            // No MIME sniffing
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));
```

### Authentication Security Matrix
| Control | Status | Action |
|---------|--------|--------|
| Password hashing | ✅ bcrypt 12 rounds | - |
| JWT algorithm | ✅ HS256 | Consider RS256 for multi-issuer |
| Access token TTL | ✅ 15 minutes | - |
| Refresh token TTL | ✅ 7 days | - |
| Refresh token rotation | ✅ On every refresh | - |
| Refresh token revocation | ✅ On logout + password reset | - |
| Email verification | ✅ UUID token | Hash token in DB (SEC-009) |
| Password reset expiry | ✅ 1 hour | - |
| Account lockout | ❌ Missing | Add after N failed logins |
| MFA/2FA | ❌ Not implemented | Phase 3 feature |
| IP-based rate limiting | ⚠ Gateway only | Add per-endpoint (SEC-006) |

---

## Security Environment Variables Required

Add to all `.env` files:

```bash
# Internal service authentication (SEC-002)
INTERNAL_SERVICE_TOKEN=<64-char-random-hex>

# Content Security Policy
CSP_REPORT_URI=

# Rate limiting
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

Generate `INTERNAL_SERVICE_TOKEN`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Penetration Testing Checklist (Pre-Production)

- [ ] IDOR: Can user A access user B's private posts by ID guessing?
- [ ] Auth bypass: Can requests reach downstream services without gateway token?
- [ ] File upload: Can malicious files be uploaded and executed?
- [ ] SQL injection: Are all Sequelize queries parameterized?
- [ ] XSS: Does post content with `<script>` tags render/execute?
- [ ] Rate limiting: Can brute-force login be performed?
- [ ] JWT: Is algorithm none accepted? RS256 downgrade possible?
- [ ] Mass assignment: Can users update fields like `role` through profile update?
- [ ] Directory traversal: Are uploaded file paths sanitized?
- [ ] CORS: Are arbitrary origins accepted in production?

---

*Maintained by A-08 (Security & Authentication Agent). Security issues must be addressed before A-12 production approval.*
