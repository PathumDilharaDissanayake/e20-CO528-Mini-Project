# DECP Platform — Database Optimization Plan
**Agent**: A-07 (Database Optimization Agent)
**Version**: 1.0.0 | **Date**: 2026-03-03

---

## Overview

This document defines the database index strategy, query optimization recommendations, migration plan, and connection pool tuning for all 9 DECP databases.

---

## Index Strategy by Service

### decp_feed (Critical — Highest Query Volume)

**Table: posts**
```sql
-- Primary feed query: public posts, newest first (FLAW-008 fix)
CREATE INDEX idx_posts_public_created ON posts (is_public, created_at DESC);

-- User profile posts
CREATE INDEX idx_posts_user_created ON posts (user_id, created_at DESC);

-- Cursor-based pagination (FLAW-006 fix)
CREATE INDEX idx_posts_cursor ON posts (created_at DESC, id DESC);

-- Media posts filter
CREATE INDEX idx_posts_type ON posts (type) WHERE type != 'text';
```

**Table: likes**
```sql
-- Already has unique index on (post_id, user_id) ✅
-- Add for aggregation queries
CREATE INDEX idx_likes_post_id ON likes (post_id);
CREATE INDEX idx_likes_user_id ON likes (user_id);
```

**Table: comments**
```sql
-- Fetch comments for a post, chronological
CREATE INDEX idx_comments_post_created ON comments (post_id, created_at ASC);

-- Threaded replies
CREATE INDEX idx_comments_parent_id ON comments (parent_id) WHERE parent_id IS NOT NULL;

-- User's comment history
CREATE INDEX idx_comments_user_id ON comments (user_id);
```

**Table: shares** (new)
```sql
-- Already has unique index + post_id index ✅
CREATE INDEX idx_shares_user_id ON shares (user_id);
```

---

### decp_auth (High — Auth on every request)

**Table: users**
```sql
-- Already has unique index on email ✅

-- Role-based queries (admin queries)
CREATE INDEX idx_users_role ON users (role) WHERE is_active = true;

-- Active users (exclude soft-deleted)
CREATE INDEX idx_users_active ON users (is_active, created_at DESC);

-- Password reset (time-bounded lookup)
CREATE INDEX idx_users_reset_token ON users (password_reset_token, password_reset_expires)
  WHERE password_reset_token IS NOT NULL;

-- Email verification
CREATE INDEX idx_users_verify_token ON users (email_verification_token)
  WHERE is_email_verified = false;
```

**Table: refresh_tokens**
```sql
-- Primary token lookup
CREATE INDEX idx_refresh_active ON refresh_tokens (token, user_id, is_revoked)
  WHERE is_revoked = false;

-- Cleanup of expired tokens (background job)
CREATE INDEX idx_refresh_expires ON refresh_tokens (expires_at)
  WHERE is_revoked = false;
```

---

### decp_users

**Table: profiles**
```sql
-- User lookup by ID (primary key covers this ✅)

-- Full-text search on name
CREATE INDEX idx_profiles_name_search ON profiles USING gin(
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
);

-- Department filter
CREATE INDEX idx_profiles_department ON profiles (department) WHERE department IS NOT NULL;

-- Role filter
CREATE INDEX idx_profiles_role ON profiles (role);
```

**Table: connections**
```sql
-- User's connections (both directions)
CREATE INDEX idx_connections_follower ON connections (follower_id, status);
CREATE INDEX idx_connections_following ON connections (following_id, status);

-- Mutual connection check
CREATE UNIQUE INDEX idx_connections_unique ON connections (follower_id, following_id);
```

---

### decp_jobs

**Table: jobs**
```sql
-- Active job listings, newest first
CREATE INDEX idx_jobs_active_created ON jobs (is_active, created_at DESC)
  WHERE is_active = true;

-- Job type filter
CREATE INDEX idx_jobs_type ON jobs (type, created_at DESC);

-- Location search
CREATE INDEX idx_jobs_location ON jobs (location) WHERE location IS NOT NULL;

-- Expiry cleanup
CREATE INDEX idx_jobs_expires ON jobs (expires_at) WHERE is_active = true;
```

**Table: applications**
```sql
-- Applications by job
CREATE INDEX idx_applications_job ON applications (job_id, status);

-- Applications by user
CREATE INDEX idx_applications_user ON applications (applicant_id, applied_at DESC);

-- Status tracking
CREATE UNIQUE INDEX idx_applications_unique ON applications (job_id, applicant_id);
```

---

### decp_events

**Table: events**
```sql
-- Upcoming events
CREATE INDEX idx_events_start_date ON events (start_date ASC) WHERE start_date > NOW();

-- Event type filter
CREATE INDEX idx_events_type_date ON events (type, start_date ASC);
```

**Table: rsvps**
```sql
CREATE UNIQUE INDEX idx_rsvps_unique ON rsvps (event_id, user_id);
CREATE INDEX idx_rsvps_event ON rsvps (event_id, status);
CREATE INDEX idx_rsvps_user ON rsvps (user_id, created_at DESC);
```

---

### decp_messaging

**Table: conversations**
```sql
-- User's conversations, most recent first
CREATE INDEX idx_conversations_last_message ON conversations (last_message_at DESC);

-- Participant lookup (JSONB array index)
CREATE INDEX idx_conversations_participants ON conversations USING gin (participants);
```

**Table: messages**
```sql
-- Chat history query (most common)
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at ASC);

-- Unread message count
CREATE INDEX idx_messages_unread ON messages (conversation_id, user_id, is_read)
  WHERE is_read = false;
```

---

### decp_notifications

**Table: notifications**
```sql
-- Unread notification count (header badge)
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- All notifications for user
CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
```

---

### decp_analytics

**Table: activities**
```sql
-- Dashboard: recent activity by user
CREATE INDEX idx_activities_user_time ON activities (user_id, created_at DESC);

-- Event type analytics
CREATE INDEX idx_activities_type_time ON activities (event_type, created_at DESC);
```

---

## Query Optimization: N+1 Prevention

### Feed: Author Data

**Current problem**: `getFeed()` returns posts without author info. Frontend makes separate `GET /users/{userId}` for each post — N+1 calls to user-service.

**Recommended**: Denormalize author fields into the posts table:

```typescript
// In Post model, add denormalized fields:
authorFirstName: DataTypes.STRING(100),
authorLastName: DataTypes.STRING(100),
authorAvatar: DataTypes.STRING(500),
authorRole: DataTypes.STRING(50),

// Set on create from x-user-* headers:
const post = await Post.create({
  userId,
  content,
  authorFirstName: req.headers['x-user-firstname'],
  authorLastName: req.headers['x-user-lastname'],
  authorRole: req.headers['x-user-role'],
  ...
});
```

**Trade-off**: Author name/avatar changes won't propagate to old posts. Acceptable for a social platform (common pattern: Twitter, LinkedIn store display name at time of post).

---

### Messaging: Conversation List

**Current problem**: `GET /conversations` returns conversations with `lastMessage` but frontend may need to fetch full message data.

**Fix**: Include lastMessageContent as a field on the conversations table (already appears to be `lastMessage` field).

---

## Connection Pool Configuration

Optimal settings per service (PostgreSQL):

```typescript
// In each service's config/database.ts:
pool: {
  max: 10,        // Per instance. With K8s scaling, total = max * replicas
  min: 2,         // Keep 2 connections alive (faster cold start for requests)
  acquire: 30000, // 30s timeout to acquire connection before error
  idle: 10000,    // Release connection after 10s idle
  evict: 30000    // Run eviction check every 30s
}
```

For messaging-service (higher concurrency due to Socket.IO):
```typescript
pool: { max: 20, min: 5, acquire: 30000, idle: 10000 }
```

---

## Migration Strategy

**Current state**: Services use `sequelize.sync({ alter: true })`. This is dangerous in production — it can drop columns or alter types in ways that lose data.

**Target state**: Sequelize Umzug migrations for all schema changes.

**Migration file naming**: `YYYYMMDDHHMMSS-{service}-{description}.ts`

**Migration template**:
```typescript
// migrations/20260303120000-feed-add-post-indexes.ts
import { QueryInterface } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addIndex('posts', ['is_public', 'created_at'], {
      name: 'idx_posts_public_created'
    });
    // ... other indexes
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex('posts', 'idx_posts_public_created');
    // ... remove other indexes
  }
};
```

**Production deployment process**:
```bash
# Before deploying new service version:
npx sequelize-cli db:migrate --env production

# Rollback on failure:
npx sequelize-cli db:migrate:undo --env production
```

---

## Backup Strategy

### Automated Daily Backups

```bash
#!/bin/bash
# infrastructure/scripts/backup-databases.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

DATABASES=(decp_auth decp_users decp_feed decp_jobs decp_events decp_research decp_messaging decp_notifications decp_analytics)

for DB in "${DATABASES[@]}"; do
  pg_dump \
    --host=localhost \
    --port=5432 \
    --username=postgres \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_DIR}/${DB}.pgdump" \
    "${DB}"
  echo "Backed up ${DB}"
done

# Retain 30 days of backups
find /backups -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +
```

**Schedule**: Daily at 02:00 UTC via cron or Kubernetes CronJob.

### Point-in-Time Recovery

Enable WAL archiving in `postgresql.conf`:
```
wal_level = replica
archive_mode = on
archive_command = 'cp %p /wal-archive/%f'
```

### Restore Procedure

```bash
# Full restore
pg_restore --host=localhost --port=5432 --username=postgres \
  --dbname=decp_feed --clean --if-exists \
  /backups/20260303_020000/decp_feed.pgdump

# Specific table restore
pg_restore --host=localhost --port=5432 --username=postgres \
  --dbname=decp_feed --table=posts \
  /backups/20260303_020000/decp_feed.pgdump
```

---

## Monitoring Queries

Run these weekly to identify slow queries:

```sql
-- Slow queries (> 100ms)
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Missing indexes (high seq scan count)
SELECT schemaname, tablename, seq_scan, idx_scan,
  (seq_scan - idx_scan) AS diff
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY diff DESC;

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

---

*Maintained by A-07 (Database Optimization Agent)*
