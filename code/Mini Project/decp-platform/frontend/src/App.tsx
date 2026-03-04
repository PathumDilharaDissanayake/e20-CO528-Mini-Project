import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@hooks';

// Layouts
import { MainLayout } from '@components/layout';
import { AuthLayout } from '@components/auth';

// Pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  FeedPage,
  ProfilePage,
  JobsPage,
  EventsPage,
  ResearchPage,
  MessagesPage,
  NotificationsPage,
  AnalyticsPage,
  SearchPage,
} from '@pages';
import { SavedPostsPage } from '@pages/SavedPostsPage';

// Loading Component — branded DECP spinner
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-slate-800">
    <div className="relative w-20 h-20">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-green-100 dark:border-green-900/40"></div>
      {/* Spinning arc */}
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 border-r-green-500 animate-spin"></div>
      {/* Inner logo */}
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
        <span className="text-white font-black text-lg leading-none">D</span>
      </div>
    </div>
    <p className="mt-5 text-gray-600 dark:text-gray-400 font-semibold tracking-wide">
      Loading <span className="text-green-600 font-black">DECP</span>…
    </p>
    <div className="mt-2 flex gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to home if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes - Auth Pages */}
        <Route
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected Routes - Main Application */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Routes */}
          <Route path="/" element={<FeedPage />} />
          <Route path="/feed" element={<Navigate to="/" replace />} />

          {/* Profile Routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/users/:userId" element={<ProfilePage />} />

          {/* Feature Routes */}
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventsPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/research/:projectId" element={<ResearchPage />} />

          {/* Communication Routes */}
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:chatId" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Search */}
          <Route path="/search" element={<SearchPage />} />

          {/* Saved Posts */}
          <Route path="/saved" element={<SavedPostsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute requireAdmin>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AnalyticsPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/dashboard" element={<AnalyticsPage />} />
        </Route>

        {/* Catch all - 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Page Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
                <a
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default App;
