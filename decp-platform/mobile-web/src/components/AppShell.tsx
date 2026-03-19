import { Routes, Route, Navigate } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import FeedScreen from '../screens/FeedScreen'
import JobsScreen from '../screens/JobsScreen'
import EventsScreen from '../screens/EventsScreen'
import ResearchScreen from '../screens/ResearchScreen'
import MessagesScreen from '../screens/MessagesScreen'
import ChatScreen from '../screens/ChatScreen'
import ProfileScreen from '../screens/ProfileScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SearchScreen from '../screens/SearchScreen'
import SettingsScreen from '../screens/SettingsScreen'

export default function AppShell() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#060C09', position: 'relative' }}>
      {/* Subtle dot grid background */}
      <div
        className="dot-grid"
        style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}
      />

      {/* Main content */}
      <div
        className="phone-content scrollbar-hide"
        style={{ flex: 1, overflow: 'hidden auto', position: 'relative', zIndex: 1 }}
      >
        <Routes>
          <Route path="/feed" element={<FeedScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/jobs" element={<JobsScreen />} />
          <Route path="/events" element={<EventsScreen />} />
          <Route path="/research" element={<ResearchScreen />} />
          <Route path="/messages" element={<MessagesScreen />} />
          <Route path="/messages/:id" element={<ChatScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'relative', zIndex: 30 }}>
        <BottomTabBar />
      </div>
    </div>
  )
}
