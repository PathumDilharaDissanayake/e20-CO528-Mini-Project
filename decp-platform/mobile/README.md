# DECP Mobile Application

A comprehensive React Native mobile application for the Department Engagement & Career Platform (DECP).

## Features

- **Authentication**: Login, Register, Forgot Password
- **Social Feed**: Create posts, like, comment, share
- **Jobs**: Browse jobs, apply, post jobs
- **Events**: View and create events, RSVP
- **Research**: Research projects collaboration
- **Messaging**: Real-time chat with Socket.io
- **Notifications**: Push notifications for important updates
- **Profile**: User profiles, connections, skills
- **Analytics**: Dashboard for admins

## Tech Stack

- React Native with Expo
- TypeScript
- Redux Toolkit for state management
- React Navigation v6
- React Native Paper for UI components
- Socket.io-client for real-time messaging
- React Native Image Picker
- Expo Notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

### Environment Variables

Create a `.env` file in the root directory:

```
API_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── screens/         # Screen components
│   ├── Auth/       # Authentication screens
│   ├── Feed/       # Feed related screens
│   ├── Profile/    # Profile screens
│   ├── Jobs/       # Jobs screens
│   ├── Events/     # Events screens
│   ├── Research/   # Research screens
│   ├── Messaging/  # Messaging screens
│   ├── Notifications/ # Notifications screen
│   └── Analytics/  # Analytics dashboard
├── navigation/      # Navigation configuration
├── store/          # Redux store configuration
├── features/       # Redux slices
├── services/       # API services
├── hooks/          # Custom React hooks
├── utils/          # Utilities and constants
└── types/          # TypeScript type definitions
```

## Building for Production

### Web Build

```bash
npx expo export --platform web
```

### Android Build

```bash
eas build --platform android
```

### iOS Build

```bash
eas build --platform ios
```

## Docker

Build the Docker image:

```bash
docker build -t decp-mobile .
```

Run the container:

```bash
docker run -p 80:80 decp-mobile
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
