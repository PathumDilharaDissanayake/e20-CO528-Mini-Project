# DECP - Department Engagement & Career Platform

A modern React web application for connecting students, alumni, and faculty within a university department.

## Features

- **Authentication**: Login, Register, Forgot Password, Email Verification
- **Feed**: Create posts with text/media, like, comment, share
- **Profile**: View and edit profile, upload avatar, manage connections
- **Jobs**: Browse and apply for jobs, post jobs (alumni/faculty)
- **Events**: Event calendar, RSVP, create events
- **Research**: Research project collaboration, document sharing
- **Messaging**: Real-time chat with Socket.io
- **Notifications**: Notification center with read/unread status
- **Analytics**: Admin dashboard with charts and metrics

## Tech Stack

- React 18 with TypeScript
- Vite as build tool
- Redux Toolkit + RTK Query for state management
- Material-UI (MUI) v5 + Tailwind CSS for styling
- React Router v6 for navigation
- Socket.io-client for real-time features
- React Hook Form + Zod for forms
- Recharts for analytics charts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

### Docker

```bash
docker build -t decp-frontend .
docker run -p 80:80 decp-frontend
```

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── feed/
│   │   ├── profile/
│   │   ├── jobs/
│   │   ├── events/
│   │   ├── research/
│   │   └── messaging/
│   ├── pages/
│   ├── features/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── store/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── Dockerfile
```

## License

MIT
