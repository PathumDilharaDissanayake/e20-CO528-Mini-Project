import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/forgot_password_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/events/screens/event_detail_screen.dart';
import '../features/events/screens/events_screen.dart';
import '../features/feed/screens/feed_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/jobs/screens/job_detail_screen.dart';
import '../features/jobs/screens/jobs_screen.dart';
import '../features/messaging/screens/chat_screen.dart';
import '../features/messaging/screens/conversations_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/research/screens/research_detail_screen.dart';
import '../features/research/screens/research_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  // Keep a notifier listenable that triggers GoRouter to re-evaluate redirects
  // whenever auth state changes.
  final authNotifier = _AuthStateNotifier(ref);

  return GoRouter(
    initialLocation: '/feed',
    refreshListenable: authNotifier,
    redirect: (BuildContext context, GoRouterState state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;

      // While checking auth, stay put
      if (isLoading) return null;

      final location = state.matchedLocation;
      final isAuthRoute = location.startsWith('/auth');

      if (!isAuthenticated && !isAuthRoute) {
        return '/auth/login';
      }
      if (isAuthenticated && isAuthRoute) {
        return '/feed';
      }
      return null;
    },
    routes: [
      // -----------------------------------------------------------------------
      // Auth routes
      // -----------------------------------------------------------------------
      GoRoute(
        path: '/auth/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),

      // -----------------------------------------------------------------------
      // Main shell with bottom navigation bar
      // -----------------------------------------------------------------------
      ShellRoute(
        builder: (context, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/feed',
            builder: (_, __) => const FeedScreen(),
          ),
          GoRoute(
            path: '/jobs',
            builder: (_, __) => const JobsScreen(),
          ),
          GoRoute(
            path: '/events',
            builder: (_, __) => const EventsScreen(),
          ),
          GoRoute(
            path: '/messages',
            builder: (_, __) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
        ],
      ),

      // -----------------------------------------------------------------------
      // Detail routes (outside shell — no bottom nav)
      // -----------------------------------------------------------------------
      GoRoute(
        path: '/profile/:userId',
        builder: (_, state) => ProfileScreen(
          userId: state.pathParameters['userId']!,
        ),
      ),
      GoRoute(
        path: '/profile',
        builder: (_, __) => const ProfileScreen(userId: 'me'),
      ),
      GoRoute(
        path: '/jobs/:jobId',
        builder: (_, state) => JobDetailScreen(
          jobId: state.pathParameters['jobId']!,
        ),
      ),
      GoRoute(
        path: '/events/:eventId',
        builder: (_, state) => EventDetailScreen(
          eventId: state.pathParameters['eventId']!,
        ),
      ),
      GoRoute(
        path: '/research',
        builder: (_, __) => const ResearchScreen(),
      ),
      GoRoute(
        path: '/research/:researchId',
        builder: (_, state) => ResearchDetailScreen(
          researchId: state.pathParameters['researchId']!,
        ),
      ),
      GoRoute(
        path: '/messages/:conversationId',
        builder: (_, state) => ChatScreen(
          conversationId: state.pathParameters['conversationId']!,
        ),
      ),
    ],
  );
});

// ---------------------------------------------------------------------------
// Helper: ChangeNotifier that listens to the Riverpod authProvider so that
// GoRouter's refreshListenable triggers a redirect evaluation on every auth
// state change.
// ---------------------------------------------------------------------------
class _AuthStateNotifier extends ChangeNotifier {
  _AuthStateNotifier(Ref ref) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (previous?.isAuthenticated != next.isAuthenticated ||
          previous?.isLoading != next.isLoading) {
        notifyListeners();
      }
    });
  }
}
