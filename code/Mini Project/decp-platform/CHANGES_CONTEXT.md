# DECP Platform — Changes Made (Session Context)

## Summary of All Changes Made

This document describes all changes made to the DECP platform in this session. Use this to continue work with a new Claude session.

---

## 🔴 Critical Bug Fixes

### 1. API Gateway — Missing Proxy Routes (FIXED)
**File:** `backend/api-gateway/src/routes/proxyRoutes.ts`

Added missing routes that were causing 404 errors:
- `GET /api/v1/posts/bookmarks/me` — fetch saved/bookmarked posts
- `POST /api/v1/posts/:postId/bookmark` — toggle bookmark on a post
- `POST /api/v1/posts/:postId/vote` — vote on a poll
- `GET /api/v1/posts/:postId/reactions` — get reaction counts

### 2. Image Upload URL Resolution (FIXED)
**File:** `frontend/src/components/feed/PostCard.tsx`

Fixed `getMediaUrl()` function — it was incorrectly building URLs for `/uploads/...` paths. Now correctly resolves to `http://localhost:3000/uploads/filename.jpg` (via API gateway proxy).

### 3. Upload Validator — Added WebP & WebM Support (FIXED)
**File:** `backend/feed-service/src/middleware/uploadValidator.ts`

- Added `image/webp` magic byte signature (`RIFF....WEBP`)
- Added `video/webm` magic byte signature (EBML header)
- Increased max file size from 10MB to 20MB
- Updated allowed MIME types list

### 4. Poll Creation — Backend Fix (FIXED)
**File:** `backend/feed-service/src/controllers/postController.ts`

Fixed `createPost` to parse `pollOptions` from FormData (sent as JSON string from frontend). Previously polls would fail silently because the JSON string wasn't being parsed.

### 5. User Profile Validation — Flexible Schema (FIXED)
**File:** `backend/user-service/src/utils/validation.ts`

Updated `updateProfileSchema` to accept both frontend field names and legacy names:
- Education: accepts `school` (frontend) OR `institution` (legacy), `field` OR `fieldOfStudy`
- Experience: `startDate` is now optional string (not strict ISO date)
- Added `id` field to education/experience/certification items

---

## 🟡 New Features Added

### 6. Poll Creation UI (NEW)
**File:** `frontend/src/components/feed/CreatePost.tsx`

Complete rewrite of CreatePost component:
- Added **Poll creation mode** — click the poll icon to switch to poll mode
- Up to 6 poll options, minimum 2 required
- Animated poll builder with add/remove options
- Video preview support (not just images)
- Improved UI with gradient submit button and better layout

### 7. Saved Posts Page (NEW)
**File:** `frontend/src/pages/SavedPostsPage.tsx` (new file)

New page at `/saved` showing all bookmarked posts:
- Hero banner with gradient background
- Stagger animation on post cards
- Empty state when no saved posts

### 8. Saved Posts Route (NEW)
**File:** `frontend/src/App.tsx`

- Added `/saved` route pointing to `SavedPostsPage`
- Improved `PageLoader` with branded DECP spinner (spinning arc + inner logo + bouncing dots)

### 9. Sidebar — Added Saved Posts & Search Links (NEW)
**File:** `frontend/src/components/layout/Sidebar.tsx`

- Added "Saved Posts" (Bookmark icon) to main navigation
- Added "Search" to secondary navigation

### 10. Profile Page — Experience/Education/Certifications Sections (NEW)
**File:** `frontend/src/pages/ProfilePage.tsx`

Completely rewrote the About tab to include LinkedIn-style sections:
- **Experience** — work history with company, title, dates, description; add/delete buttons for own profile
- **Education** — school, degree, field, years, grade; add/delete for own profile
- **Certifications** — name, issuer, date, credential URL; add/delete for own profile
- **Skills with Endorsements** — each skill shows endorsement count; other users can endorse/un-endorse
- **Open to Work toggle** — green switch on own profile; shows animated green badge

Added 3 new dialogs:
- Add Experience dialog
- Add Education dialog
- Add Certification dialog

Removed unused `firstName` variable.

### 11. Open-to-Work Badge (NEW)
**File:** `frontend/src/components/profile/ProfileHeader.tsx`

Added animated "🟢 Open to Work" chip that appears next to the user's name when `openToWork` is true. Uses the `notifPulse` CSS animation.

### 12. Notification Panel — Better Navigation Links (IMPROVED)
**File:** `frontend/src/pages/NotificationsPage.tsx`

Improved `getNavTarget()` function:
- Post notifications now link to `/?highlight=postId`
- Event notifications link to `/events`
- Research notifications link to `/research`
- Job notifications link to `/jobs`
- Message notifications link to `/messages/:conversationId`
- Connection notifications link to `/profile`

---

## 🟢 UI Polish & Animations

### 13. Custom CSS Animations (NEW)
**File:** `frontend/src/index.css`

Added new animation classes:
- `.decp-spinner` — branded DECP spinner with dual-ring animation
- `.card-hover` — smooth lift effect on hover
- `.btn-press` — scale-down on click
- `.img-fade-in` — fade in for images
- `.badge-pulse` — pulsing red badge for notifications
- `.lightbox-enter` — scale-in animation for lightbox
- `.reaction-bounce` — bounce animation for reaction picker
- `.typing-dot` — typing indicator dots
- `.progress-fill` — animated progress bar fill

### 14. Branded Page Loader (IMPROVED)
**File:** `frontend/src/App.tsx`

Replaced plain spinner with branded DECP loader:
- Outer ring + spinning arc in green gradient
- Inner circle with "D" logo
- Bouncing dots below

---

## 📋 What Was Already Working (No Changes Needed)

These features were already implemented by previous agents:
- ✅ Post reactions (5 types: Like, Love, Celebrate, Insightful, Curious)
- ✅ Bookmark toggle on posts
- ✅ Share menu (copy link + reshare to feed)
- ✅ Video auto-play with IntersectionObserver
- ✅ Photo lightbox (click image to expand)
- ✅ Skeleton loaders (PostCardSkeleton, EventCardSkeleton, etc.)
- ✅ Page animations (fadeInUp, stagger-children)
- ✅ Events delete button in EventsPage
- ✅ Events on profile page (own profile shows attending events, others show created events)
- ✅ Cover images for events (upload via `/posts/upload` endpoint)
- ✅ Cover images for research projects
- ✅ Profile avatar upload (click avatar to change)
- ✅ Connection requests dropdown in Header
- ✅ Notification system (triggers from feed, user, events services)

---

## 🔧 What Still Needs Testing/Verification

1. **Image upload end-to-end** — The `/uploads/` proxy route exists in the gateway, but verify images actually appear in the feed after posting
2. **Poll creation** — Test creating a poll post and voting
3. **Experience/Education save** — Test adding experience/education to profile (validation schema was updated)
4. **Bookmark save** — Test bookmarking a post and viewing it at `/saved`
5. **Open-to-Work badge** — Toggle in profile About tab and verify badge appears in header

---

## 🏗️ Architecture Notes

- **Image serving**: Feed service serves `/uploads/*` statically. API gateway proxies `GET /uploads/*` to feed service. Frontend resolves image URLs via `getMediaUrl()` which prepends the API gateway origin.
- **File upload flow**: `POST /api/v1/posts/upload` → API gateway → feed service → saves to `backend/feed-service/uploads/` → returns `/uploads/filename.ext`
- **Profile data**: Stored in user-service `profiles` table. Frontend sends updates via `PUT /api/v1/users/me`.
- **Polls**: Stored as JSONB `pollOptions` array in posts table. Each option has `{ text: string, votes: string[] }`.
