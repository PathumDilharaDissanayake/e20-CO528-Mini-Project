import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { SettingsPage } from '@pages/SettingsPage';

// 404 Not Found Page
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-green-950 to-slate-900">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 text-center px-6 animate-slide-up">
        {/* Giant 404 */}
        <div className="relative mb-6 select-none">
          <p
            className="text-[10rem] sm:text-[14rem] font-black leading-none"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(20,184,166,0.15) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.05em',
            }}
          >
            404
          </p>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            <p className="text-[10rem] sm:text-[14rem] font-black leading-none" style={{ letterSpacing: '-0.05em', opacity: 0.15 }}>
              404
            </p>
          </div>
          {/* DECP badge in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)', boxShadow: '0 16px 40px rgba(34,197,94,0.4)' }}
            >
              <span className="text-emerald-950 font-black text-3xl">D</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.5px' }}>
          Page Not Found
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Looks like this page wandered off campus. Let's get you back to the platform.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-press px-8 py-3.5 rounded-2xl text-white font-semibold text-base transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
              boxShadow: '0 8px 24px rgba(22,101,52,0.45)',
            }}
          >
            Go to Feed
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-press px-8 py-3.5 rounded-2xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(8px)',
            }}
          >
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { label: 'Jobs', path: '/jobs' },
            { label: 'Events', path: '/events' },
            { label: 'Research', path: '/research' },
            { label: 'Messages', path: '/messages' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-sm text-green-400 hover:text-green-300 font-medium transition-colors hover:underline"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
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
          element={<NotFoundPage />}
        />
      </Routes>
    </Suspense>
  );
};

export default App;
