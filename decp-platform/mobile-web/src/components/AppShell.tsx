import { Routes, Route, Navigate } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import FeedScreen from '../screens/FeedScreen'
import JobsScreen from '../screens/JobsScreen'
import EventsScreen from '../screens/EventsScreen'
import ResearchScreen from '../screens/ResearchScreen'
import MessagesScreen from '../screens/MessagesScreen'
import ChatScreen from '../screens/ChatScreen'
import ProfileScreen from '../screens/ProfileScreen'

export default function AppShell() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Main scrollable content */}
      <div
        className="phone-content scrollbar-hide"
        style={{ flex: 1, overflow: 'hidden auto', position: 'relative' }}
      >
        <Routes>
          <Route path="/feed" element={<FeedScreen />} />
          <Route path="/jobs" element={<JobsScreen />} />
          <Route path="/events" element={<EventsScreen />} />
          <Route path="/research" element={<ResearchScreen />} />
          <Route path="/messages" element={<MessagesScreen />} />
          <Route path="/messages/:id" element={<ChatScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </div>

      {/* Bottom navigation */}
      <BottomTabBar />
    </div>
  )
}
