# DECP Platform - Security Documentation

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication Mechanisms](#authentication-mechanisms)
3. [Authorization (RBAC)](#authorization-rbac)
4. [Data Protection](#data-protection)
5. [API Security](#api-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Compliance](#compliance)

---

## Security Overview

DECP Platform implements a comprehensive security framework based on industry best practices and standards. Security is integrated into every layer of the application, from infrastructure to user interface.

### Security Principles

| Principle | Implementation |
|-----------|----------------|
| Defense in Depth | Multiple security layers across infrastructure, application, and data |
| Least Privilege | Users and services have minimum required permissions |
| Zero Trust | Verify every request, never trust by default |
| Secure by Design | Security considerations in architecture decisions |
| Continuous Monitoring | Real-time security monitoring and alerting |

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Security Layers                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Infrastructure Security                               │   │
│  │  • AWS WAF, Security Groups, VPC Isolation                      │   │
│  │  • DDoS Protection, Network ACLs                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 2: Application Security                                  │   │
│  │  • TLS 1.3, API Authentication, Rate Limiting                   │   │
│  │  • Input Validation, XSS/CSRF Protection                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 3: Data Security                                         │   │
│  │  • Encryption at Rest, Encryption in Transit                    │   │
│  │  • Database Access Control, Key Management                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Layer 4: Identity & Access Management                          │   │
│  │  • JWT Authentication, RBAC, OAuth 2.0                          │   │
│  │  • Multi-Factor Authentication (planned)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Mechanisms

### JWT-Based Authentication

DECP uses JSON Web Tokens (JWT) for stateless authentication.

#### Token Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         JWT Token Structure                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Header:                                                                │
│  {                                                                      │
│    "alg": "RS256",     # RSA with SHA-256                              │
│    "typ": "JWT"                                                         │
│  }                                                                      │
│                                                                         │
│  Payload (Access Token):                                                │
│  {                                                                      │
│    "sub": "user-uuid",  # Subject (User ID)                            │
│    "iat": 1646140800,   # Issued at                                    │
│    "exp": 1646141700,   # Expiration (15 minutes)                      │
│    "jti": "token-id",   # JWT ID                                       │
│    "roles": ["STUDENT"],                                                │
│    "permissions": ["feed:read", "feed:write"]                          │
│  }                                                                      │
│                                                                         │
│  Signature:                                                             │
│  RS256(base64(header) + "." + base64(payload), private_key)           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Token Types

| Token Type | Expiry | Purpose | Storage |
|------------|--------|---------|---------|
| Access Token | 15 minutes | API access | Memory only |
| Refresh Token | 7 days | Obtain new access token | HttpOnly cookie |
| Email Token | 24 hours | Email verification | Database |
| Reset Token | 1 hour | Password reset | Database |

#### Authentication Flow

```
┌──────────┐                              ┌─────────────────┐
│  Client  │                              │  Auth Service   │
└────┬─────┘                              └────────┬────────┘
     │                                             │
     │ 1. POST /api/v1/auth/login                 │
     │    { email, password }                     │
     │────────────────────────────────────────────▶│
     │                                             │
     │                                             │ 2. Validate credentials
     │                                             │ 3. Generate tokens (RS256)
     │                                             │
     │                    4. 200 OK                │
     │                    {                        │
     │                      accessToken,          │
     │                      refreshToken,         │
     │                      expiresIn: 900        │
     │                    }                       │
     │◀────────────────────────────────────────────│
     │                                             │
     │ 5. Store access token in memory            │
     │    Store refresh token in HttpOnly cookie  │
     │                                             │
     │ 6. API Request with Bearer token           │
     │    Authorization: Bearer <accessToken>     │
     │────────────────────────────────────────────▶│
     │                                             │
     │                                             │ 7. Verify signature
     │                                             │ 8. Check expiration
     │                                             │ 9. Extract user info
     │                                             │
     │                    10. 200 OK              │
     │◀────────────────────────────────────────────│
     │                                             │
     │ [Token Expired]                            │
     │ 11. POST /api/v1/auth/refresh              │
     │     { refreshToken }                       │
     │────────────────────────────────────────────▶│
     │                                             │
     │                    12. 200 OK              │
     │                    { new accessToken }     │
     │◀────────────────────────────────────────────│
```

### OAuth 2.0 Integration

DECP supports OAuth 2.0 for third-party authentication:

#### Supported Providers

| Provider | Use Case | Scopes |
|----------|----------|--------|
| Google | Quick registration | email, profile |
| LinkedIn | Professional networking | r_emailaddress, r_liteprofile |
| GitHub | Developer profiles | user:email, read:user |

#### OAuth Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Client  │     │  DECP Server │     │  OAuth Provider │     │  Database    │
└────┬─────┘     └──────┬───────┘     └────────┬────────┘     └──────┬───────┘
     │                  │                      │                     │
     │ 1. Click "Login with Google"            │                     │
     │─────────────────▶│                      │                     │
     │                  │                      │                     │
     │                  │ 2. Redirect to Google│                     │
     │◀─────────────────│                      │                     │
     │                  │                      │                     │
     │ 3. User authenticates                   │                     │
     │────────────────────────────────────────▶│                     │
     │                  │                      │                     │
     │ 4. Redirect back with code              │                     │
     │◀────────────────────────────────────────│                     │
     │                  │                      │                     │
     │ 5. Send code to server                  │                     │
     │─────────────────▶│                      │                     │
     │                  │                      │                     │
     │                  │ 6. Exchange code for tokens                 │
     │                  │─────────────────────▶│                     │
     │                  │                      │                     │
     │                  │ 7. Get user profile  │                     │
     │                  │─────────────────────▶│                     │
     │                  │                      │                     │
     │                  │ 8. Create/Update user│                     │
     │                  │────────────────────────────────────────────▶│
     │                  │                      │                     │
     │ 9. Return DECP tokens                   │                     │
     │◀─────────────────│                      │                     │
```

---

## Authorization (RBAC)

### Role-Based Access Control

DECP implements a hierarchical RBAC system with four primary roles:

#### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Role Hierarchy                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ADMIN (Highest)                                                        │
│  └── All permissions + System administration                            │
│                                                                         │
│  FACULTY                                                                │
│  └── Alumni permissions + Event management, Moderation                  │
│                                                                         │
│  ALUMNI                                                                 │
│  └── Student permissions + Job posting, Mentorship                      │
│                                                                         │
│  STUDENT (Base)                                                         │
│  └── Basic platform access                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Role Permissions Matrix

| Permission | STUDENT | ALUMNI | FACULTY | ADMIN |
|------------|:-------:|:------:|:-------:|:-----:|
| feed:read | ✅ | ✅ | ✅ | ✅ |
| feed:write | ✅ | ✅ | ✅ | ✅ |
| jobs:read | ✅ | ✅ | ✅ | ✅ |
| jobs:write | ❌ | ✅ | ✅ | ✅ |
| events:read | ✅ | ✅ | ✅ | ✅ |
| events:write | ❌ | ❌ | ✅ | ✅ |
| research:read | ✅ | ✅ | ✅ | ✅ |
| research:write | ✅ | ✅ | ✅ | ✅ |
| messaging:read | ✅ | ✅ | ✅ | ✅ |
| messaging:write | ✅ | ✅ | ✅ | ✅ |
| users:read | ✅ | ✅ | ✅ | ✅ |
| users:write | ❌ | ❌ | ❌ | ✅ |
| admin:access | ❌ | ❌ | ❌ | ✅ |

### Permission Implementation

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token, process.env.JWT_PUBLIC_KEY!);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    }
    
    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        required: roles,
        current: userRole 
      });
    }
    
    next();
  };
};

// Usage in routes
router.post('/jobs', 
  requireAuth, 
  requirePermission('jobs:write'),
  jobController.createJob
);

router.delete('/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  userController.deleteUser
);
```

---

## Data Protection

### Encryption at Rest

| Data Store | Encryption Method | Key Management |
|------------|-------------------|----------------|
| PostgreSQL | AES-256 | AWS KMS |
| Redis | In-transit only (TLS) | - |
| S3 Buckets | AES-256 (SSE-S3) | AWS managed |
| Backups | AES-256 | AWS KMS |

### Encryption in Transit

| Communication | Protocol | Configuration |
|---------------|----------|---------------|
| Client to API | HTTPS | TLS 1.3 only |
| Service to Service | HTTPS/mTLS | TLS 1.3 |
| Database connections | SSL/TLS | Required |
| Redis connections | TLS | Required in prod |
| RabbitMQ | AMQPS | TLS 1.2+ |

### Password Security

```typescript
// utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password requirements validation
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Sensitive Data Handling

```typescript
// PII (Personally Identifiable Information) fields
const PII_FIELDS = [
  'email',
  'phoneNumber',
  'address',
  'dateOfBirth',
  'nationalId'
];

// Mask sensitive data in logs
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  
  for (const field of PII_FIELDS) {
    if (field in masked) {
      masked[field] = '***REDACTED***';
    }
  }
  
  // Mask email partially
  if (masked.email && masked.email !== '***REDACTED***') {
    const [local, domain] = masked.email.split('@');
    masked.email = `${local[0]}***@${domain}`;
  }
  
  return masked;
}

// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}
```

---

## API Security

### Rate Limiting

```typescript
// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again later'
  }
});

// Application-specific rate limiter
export const createServiceLimiter = (maxRequests: number) => rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: maxRequests,
  keyGenerator: (req) => req.user?.id || req.ip
});
```

### Input Validation

```typescript
// middleware/validation.middleware.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content too long')
    .transform(sanitizeInput),
  privacy: z.enum(['public', 'connections', 'private']).default('public'),
  media: z.array(z.string().url()).max(10).optional()
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// SQL Injection Prevention (using Prisma)
// Prisma ORM automatically parameterizes queries, preventing SQL injection

// NoSQL Injection Prevention
import { ObjectId } from 'mongodb';

export function sanitizeMongoQuery(query: any): any {
  // Remove operators that could be used for injection
  const dangerousKeys = ['$where', '$eval', '$function'];
  
  return JSON.parse(
    JSON.stringify(query, (key, value) => {
      if (dangerousKeys.includes(key)) {
        return undefined;
      }
      return value;
    })
  );
}
```

### CORS Configuration

```typescript
// middleware/cors.middleware.ts
import cors from 'cors';

const allowedOrigins = [
  'https://decp.eng.pdn.ac.lk',
  'https://www.decp.eng.pdn.ac.lk',
  'https://admin.decp.eng.pdn.ac.lk'
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400 // 24 hours
};
```

### CSRF Protection

```typescript
// middleware/csrf.middleware.ts
import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

// CSRF protection for state-changing operations
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// For APIs, use Double Submit Cookie pattern
export const doubleSubmitCookie = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const csrfToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies['csrf-token'];
  
  if (csrfToken !== cookieToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};
```

---

## Infrastructure Security

### AWS Security Configuration

#### VPC Security

```hcl
# Security Groups
resource "aws_security_group" "api_gateway" {
  name_prefix = "decp-api-gateway-"
  vpc_id      = aws_vpc.main.id

  # Allow HTTPS inbound
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP inbound (redirects to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "internal_services" {
  name_prefix = "decp-internal-"
  vpc_id      = aws_vpc.main.id

  # Allow traffic only from API Gateway
  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway.id]
  }
}

resource "aws_security_group" "database" {
  name_prefix = "decp-database-"
  vpc_id      = aws_vpc.main.id

  # Allow PostgreSQL only from internal services
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.internal_services.id]
  }

  # Allow Redis only from internal services
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.internal_services.id]
  }
}
```

#### WAF Configuration

```hcl
resource "aws_wafv2_web_acl" "main" {
  name        = "decp-waf"
  description = "WAF rules for DECP"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting
  rule {
    name     = "RateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking (optional)
  rule {
    name     = "GeoBlock"
    priority = 3

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP"] # Example blocked countries
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockMetric"
      sampled_requests_enabled   = true
    }
  }
}
```

### Container Security

```dockerfile
# Dockerfile security best practices
FROM node:20-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Use specific version, avoid 'latest'
FROM node:20.11.0-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Copy only necessary files
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=nodejs:nodejs dist ./dist

# Switch to non-root user
USER nodejs

# Expose only necessary port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Kubernetes Security

```yaml
# Pod Security Standards
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  
  containers:
    - name: app
      image: decp-platform/service:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      resources:
        limits:
          memory: "512Mi"
          cpu: "500m"
        requests:
          memory: "256Mi"
          cpu: "250m"
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  
  volumes:
    - name: tmp
      emptyDir: {}
```

---

## Compliance

### Data Privacy Compliance

| Regulation | Requirements | Implementation |
|------------|--------------|----------------|
| GDPR | Data subject rights, consent, breach notification | Privacy controls, data export, deletion |
| PDPA (Sri Lanka) | Consent, purpose limitation, security | Alignment with GDPR practices |
| University Policy | Academic data protection | Additional safeguards |

### Security Policies

#### Password Policy
- Minimum 8 characters
- Complexity requirements (upper, lower, number, special)
- No common passwords (checked against HaveIBeenPwned)
- 90-day rotation for admin accounts
- Account lockout after 5 failed attempts

#### Session Policy
- Access token: 15 minutes
- Refresh token: 7 days
- Concurrent session limit: 5
- Automatic logout on password change
- Device tracking and notifications

#### Data Retention
- User accounts: Until deletion request
- Post content: 7 years (university policy)
- Activity logs: 1 year
- Analytics data: Aggregated after 2 years

### Security Audit Checklist

```markdown
## Pre-Deployment Security Checklist

### Authentication & Authorization
- [ ] JWT secrets are strong and rotated
- [ ] OAuth providers properly configured
- [ ] RBAC roles and permissions tested
- [ ] Session management implemented

### Data Protection
- [ ] Encryption at rest enabled
- [ ] TLS 1.3 enforced
- [ ] Database credentials secured
- [ ] PII handling compliant

### API Security
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] CORS properly configured
- [ ] Error messages don't leak info

### Infrastructure
- [ ] Security groups restrictive
- [ ] WAF rules active
- [ ] Containers run as non-root
- [ ] Secrets managed properly

### Monitoring
- [ ] Security logging enabled
- [ ] Alerts configured
- [ ] Audit trail functional
- [ ] Incident response plan ready
```

---

## Security Incident Response

### Response Phases

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Security Incident Response                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DETECTION                                                           │
│     • Automated alerts trigger                                          │
│     • Manual report received                                            │
│     • Monitoring system flags anomaly                                   │
│     → Create incident ticket                                            │
│                                                                         │
│  2. ASSESSMENT                                                          │
│     • Determine severity (P1/P2/P3)                                     │
│     • Identify affected systems                                         │
│     • Assess data exposure risk                                         │
│     → Assign response team                                              │
│                                                                         │
│  3. CONTAINMENT                                                         │
│     • Isolate affected systems                                          │
│     • Revoke compromised credentials                                    │
│     • Block malicious IPs                                               │
│     → Prevent further damage                                            │
│                                                                         │
│  4. ERADICATION                                                         │
│     • Remove malicious code                                             │
│     • Patch vulnerabilities                                             │
│     • Reset affected accounts                                           │
│     → Eliminate threat                                                  │
│                                                                         │
│  5. RECOVERY                                                            │
│     • Restore from clean backups                                        │
│     • Verify system integrity                                           │
│     • Resume services                                                   │
│     → Return to normal operations                                       │
│                                                                         │
│  6. POST-INCIDENT                                                       │
│     • Document lessons learned                                          │
│     • Update security measures                                          │
│     • Notify affected parties                                           │
│     → Improve future response                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Contact Information

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| Security Team | security@decp.eng.pdn.ac.lk | Immediate |
| DevOps Lead | devops@decp.eng.pdn.ac.lk | 30 minutes |
| Project Manager | pm@decp.eng.pdn.ac.lk | 1 hour |
| University IT | it@eng.pdn.ac.lk | 4 hours |

---

*Last Updated: March 2026*
*Security Policy Version: 1.0.0*
