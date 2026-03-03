# DECP Platform - Database Schema

## Overview

The DECP Platform uses a **Database per Service** pattern where each microservice has its own PostgreSQL database for loose coupling and data isolation.

## Database Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Cluster                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  auth_db    │  │  user_db    │  │  feed_db    │             │
│  │  (Port:     │  │  (Port:     │  │  (Port:     │             │
│  │   5433)     │  │   5434)     │  │   5435)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  jobs_db    │  │  events_db  │  │  research_db│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  message_db │  │  notif_db   │  │  analytics_ │             │
│  │             │  │             │  │    db       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Auth Service Database (`auth_db`)

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'alumni', 'admin')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## 2. User Service Database (`user_db`)

### Profiles Table
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    department VARCHAR(100),
    batch VARCHAR(20),
    graduation_year INTEGER,
    location VARCHAR(200),
    phone VARCHAR(20),
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_department ON profiles(department);
```

### Connections Table
```sql
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_addressee ON connections(addressee_id);
CREATE INDEX idx_connections_status ON connections(status);
```

### Skills Table
```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    endorsements INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_profile ON skills(profile_id);
CREATE INDEX idx_skills_name ON skills(name);
```

### Experience Table
```sql
CREATE TABLE experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company VARCHAR(200) NOT NULL,
    title VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experience_profile ON experience(profile_id);
```

### Education Table
```sql
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(200) NOT NULL,
    field_of_study VARCHAR(200),
    start_year INTEGER NOT NULL,
    end_year INTEGER,
    is_current BOOLEAN DEFAULT FALSE,
    gpa DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_education_profile ON education(profile_id);
```

---

## 3. Feed Service Database (`feed_db`)

### Posts Table
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT[],
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
```

### Likes Table
```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);
```

### Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

### Shares Table
```sql
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_shares_post ON shares(post_id);
CREATE INDEX idx_shares_user ON shares(user_id);
```

---

## 4. Jobs Service Database (`jobs_db`)

### Jobs Table
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_by UUID NOT NULL,
    company VARCHAR(200) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[],
    responsibilities TEXT[],
    location VARCHAR(200),
    is_remote BOOLEAN DEFAULT FALSE,
    job_type VARCHAR(20) CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
    experience_level VARCHAR(20) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'LKR',
    application_url TEXT,
    deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_active ON jobs(is_active);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
```

### Applications Table
```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted')),
    notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, applicant_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
```

### Saved Jobs Table
```sql
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);

CREATE INDEX idx_saved_jobs_user ON saved_jobs(user_id);
```

---

## 5. Events Service Database (`events_db`)

### Events Table
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('workshop', 'seminar', 'networking', 'career_fair', 'other')),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    location VARCHAR(300),
    virtual_link TEXT,
    is_virtual BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_start ON events(start_datetime);
CREATE INDEX idx_events_type ON events(type);
```

### RSVPs Table
```sql
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
    attendees_count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);
```

---

## 6. Research Service Database (`research_db`)

### Research Projects Table
```sql
CREATE TABLE research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL,
    title VARCHAR(300) NOT NULL,
    abstract TEXT,
    description TEXT,
    field VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
    start_date DATE,
    end_date DATE,
    funding_source VARCHAR(200),
    funding_amount DECIMAL(12,2),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_created_by ON research_projects(created_by);
CREATE INDEX idx_research_status ON research_projects(status);
CREATE INDEX idx_research_field ON research_projects(field);
```

### Research Collaborators Table
```sql
CREATE TABLE research_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('lead', 'member', 'advisor')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_collaborators_project ON research_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON research_collaborators(user_id);
```

### Research Documents Table
```sql
CREATE TABLE research_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    version INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_project ON research_documents(project_id);
```

---

## 7. Messaging Service Database (`message_db`)

### Conversations Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    title VARCHAR(200),
    avatar_url TEXT,
    created_by UUID,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

### Conversation Participants Table
```sql
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    last_read_at TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
```

### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT,
    media_urls TEXT[],
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

## 8. Notification Service Database (`notif_db`)

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### Notification Preferences Table
```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    mentions_email BOOLEAN DEFAULT TRUE,
    mentions_push BOOLEAN DEFAULT TRUE,
    messages_email BOOLEAN DEFAULT TRUE,
    messages_push BOOLEAN DEFAULT TRUE,
    job_alerts_email BOOLEAN DEFAULT TRUE,
    job_alerts_push BOOLEAN DEFAULT FALSE,
    event_reminders_email BOOLEAN DEFAULT TRUE,
    event_reminders_push BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);
```

---

## 9. Analytics Service Database (`analytics_db`)

### User Activities Table
```sql
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_user ON user_activities(user_id);
CREATE INDEX idx_activities_action ON user_activities(action);
CREATE INDEX idx_activities_created ON user_activities(created_at);
```

### Daily Metrics Table
```sql
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    jobs_posted INTEGER DEFAULT 0,
    applications_submitted INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_date ON daily_metrics(date);
```

---

## Redis Schema

### Session Store
```
Key: session:{session_id}
Value: { user_id, role, permissions }
TTL: 24 hours
```

### Rate Limiting
```
Key: rate_limit:{user_id}:{endpoint}
Value: Counter
TTL: 1 minute
```

### Cache
```
Key: cache:{entity}:{id}
Value: JSON serialized data
TTL: 5-60 minutes (varies by entity)
```

### Real-time Presence
```
Key: presence:{user_id}
Value: { status: 'online'|'away', last_seen: timestamp }
TTL: 5 minutes
```

---

## Migration Strategy

### Initial Setup
```bash
# Create databases
npm run db:create:all

# Run migrations
npm run db:migrate:all

# Seed data (development)
npm run db:seed:all
```

### Rolling Updates
1. Create new migration file
2. Test migration locally
3. Deploy with zero-downtime strategy
4. Verify data integrity

### Backup Strategy
- Daily automated backups at 2 AM
- Point-in-time recovery enabled
- Cross-region backup replication
- Monthly backup testing
