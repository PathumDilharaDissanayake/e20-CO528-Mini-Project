import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PhoneFrame from './components/PhoneFrame'
import AppShell from './components/AppShell'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <PhoneFrame>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <LoadingSpinner />
        </div>
      </PhoneFrame>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <PhoneFrame>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <LoadingSpinner />
        </div>
      </PhoneFrame>
    )
  }
  if (isAuthenticated) return <Navigate to="/feed" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <PhoneFrame>
              <LoginScreen />
            </PhoneFrame>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <PhoneFrame>
              <RegisterScreen />
            </PhoneFrame>
          </PublicRoute>
        }
      />

      {/* Protected: all app routes inside PhoneFrame > AppShell */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <PhoneFrame>
              <AppShell />
            </PhoneFrame>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
