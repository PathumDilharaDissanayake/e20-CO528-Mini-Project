# DECP Mobile App — Context & TODO Tracker

## Project Overview
Flutter mobile app for the DECP (Department Engagement & Career Platform).
Connects to the existing Node.js/Express microservices backend at port 3000 (API Gateway).

## Backend API Base
- **Development (Android emulator):** `http://10.0.2.2:3000/api/v1`
- **Development (iOS simulator):** `http://localhost:3000/api/v1`
- **Socket.io (messaging):** port 3007 directly
- **Auth:** JWT Bearer token in `Authorization` header

## Architecture Decisions
- **Framework:** Flutter (Dart) — cross-platform iOS + Android
- **State Management:** flutter_riverpod (StateNotifier + AsyncNotifier)
- **HTTP Client:** Dio with interceptors (auto token refresh on 401)
- **Secure Storage:** flutter_secure_storage (tokens)
- **Routing:** go_router with auth guard
- **Real-time:** socket_io_client (messaging service)
- **Images:** cached_network_image + image_picker
- **UI:** Material Design 3 with custom DECP theme (indigo/teal)

## Feature Completion Status

### ✅ COMPLETED
- [x] Project structure created
- [x] pubspec.yaml with all dependencies
- [x] Core models (User, Post, Job, Event, Research, Message, Notification)
- [x] AppConfig (base URLs, constants)
- [x] AppTheme (Material 3, light/dark)
- [x] StorageService (secure token storage)
- [x] ApiClient (Dio + interceptors + JWT refresh)
- [x] SocketService (Socket.io connection + events)
- [x] AuthProvider (login, register, logout, refresh)
- [x] Login Screen
- [x] Register Screen
- [x] Forgot Password Screen
- [x] GoRouter with auth guard
- [x] HomeScreen (bottom nav shell)
- [x] FeedProvider + FeedScreen + PostCard + CreatePostSheet
- [x] ProfileProvider + ProfileScreen
- [x] JobsProvider + JobsScreen + JobCard + JobDetailScreen
- [x] EventsProvider + EventsScreen + EventCard
- [x] ResearchProvider + ResearchScreen + ResearchCard
- [x] MessagingProvider + ConversationsScreen + ChatScreen + MessageBubble
- [x] NotificationsProvider + NotificationsScreen
- [x] Shared widgets (AvatarWidget, LoadingWidget, ErrorWidget, EmptyWidget)
- [x] Shared utils (date_utils, validators)
- [x] Android platform files (AndroidManifest, build.gradle, etc.)
- [x] README with setup instructions

### 🔲 TODO / FUTURE ENHANCEMENTS
- [ ] Image upload for posts (currently text only, API supports multipart)
- [ ] Google OAuth login (requires platform-specific setup)
- [ ] Push notifications via FCM
- [ ] Offline mode / local caching
- [ ] Dark mode toggle in settings
- [ ] Analytics dashboard screen
- [ ] Search screen (global search)
- [ ] Settings / Edit Profile screen
- [ ] Resume upload for job applications
- [ ] Research document upload
- [ ] Video posts
- [ ] Poll creation and voting
- [ ] Post sharing
- [ ] User endorsements
- [ ] Group chat creation
- [ ] Calendar view for events
- [ ] Deep linking
- [ ] Biometric auth

## API Endpoints Used

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- POST /auth/forgot-password
- POST /auth/reset-password

### Users
- GET /users/me
- PUT /users/me
- GET /users/:userId
- GET /users/search?q=
- GET /users/suggested
- POST /users/connections/:userId/follow
- DELETE /users/connections/:userId/unfollow
- GET /users/connections/requests
- PUT /users/connections/:userId/accept

### Feed
- GET /posts/feed
- POST /posts
- GET /posts/:postId
- POST /posts/:postId/like
- DELETE /posts/:postId/like
- POST /posts/:postId/comments
- GET /posts/:postId/comments
- POST /posts/:postId/bookmark
- GET /posts/bookmarks/me

### Jobs
- GET /jobs
- POST /jobs
- GET /jobs/:jobId
- POST /jobs/:jobId/apply
- GET /jobs/applications

### Events
- GET /events
- POST /events
- GET /events/:eventId
- POST /events/:eventId/rsvp
- GET /events/my-rsvps

### Research
- GET /research
- POST /research
- GET /research/:researchId
- POST /research/:researchId/collaborate

### Messaging
- GET /conversations
- POST /conversations
- GET /conversations/:id/messages
- POST /conversations/:id/messages
- Socket.io events: join_conversation, send_message, new_message, typing

### Notifications
- GET /notifications
- PUT /notifications/:id/read
- PUT /notifications/read-all
- DELETE /notifications/:id

## Known Issues / Notes
- Socket.io connects to port 3007 directly (not through API gateway)
- Android emulator uses 10.0.2.2 instead of localhost
- JWT access token expires in 15 min; Dio interceptor handles auto-refresh
- All authenticated requests need Bearer token header
- File uploads use multipart/form-data (not yet implemented in mobile)

## Last Updated
Created: Initial build
