import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './types';
import { useAppSelector } from '../store';
import { socketService } from '../services/socketService';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import CreatePost from '../screens/Feed/CreatePost';
import PostDetail from '../screens/Feed/PostDetail';
import ProfileView from '../screens/Profile/ProfileView';
import EditProfile from '../screens/Profile/EditProfile';
import ConnectionsList from '../screens/Profile/ConnectionsList';
import JobDetail from '../screens/Jobs/JobDetail';
import ApplyJob from '../screens/Jobs/ApplyJob';
import PostJob from '../screens/Jobs/PostJob';
import EventDetail from '../screens/Events/EventDetail';
import CreateEvent from '../screens/Events/CreateEvent';
import ProjectDetail from '../screens/Research/ProjectDetail';
import CreateProject from '../screens/Research/CreateProject';
import ResearchProjects from '../screens/Research/ResearchProjects';
import ChatScreen from '../screens/Messaging/ChatScreen';
import NewConversation from '../screens/Messaging/NewConversation';
import NotificationsList from '../screens/Notifications/NotificationsList';
import AnalyticsDashboard from '../screens/Analytics/AnalyticsDashboard';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const paperTheme = useTheme();
  const { mode } = useAppSelector((state) => state.theme);
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);

  const navigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: paperTheme.colors.surface,
          },
          headerTintColor: paperTheme.colors.onSurface,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreatePost" 
              component={CreatePost}
              options={{ title: 'Create Post' }}
            />
            <Stack.Screen 
              name="PostDetail" 
              component={PostDetail}
              options={{ title: 'Post' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileView}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfile}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="Connections" 
              component={ConnectionsList}
              options={{ title: 'Connections' }}
            />
            <Stack.Screen 
              name="JobDetail" 
              component={JobDetail}
              options={{ title: 'Job Details' }}
            />
            <Stack.Screen 
              name="ApplyJob" 
              component={ApplyJob}
              options={{ title: 'Apply' }}
            />
            <Stack.Screen 
              name="PostJob" 
              component={PostJob}
              options={{ title: 'Post Job' }}
            />
            <Stack.Screen 
              name="EventDetail" 
              component={EventDetail}
              options={{ title: 'Event Details' }}
            />
            <Stack.Screen 
              name="CreateEvent" 
              component={CreateEvent}
              options={{ title: 'Create Event' }}
            />
            <Stack.Screen 
              name="Research" 
              component={ResearchProjects}
              options={{ title: 'Research Projects' }}
            />
            <Stack.Screen 
              name="ProjectDetail" 
              component={ProjectDetail}
              options={{ title: 'Project Details' }}
            />
            <Stack.Screen 
              name="CreateProject" 
              component={CreateProject}
              options={{ title: 'Create Project' }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={({ route }) => ({ title: route.params?.participantName || 'Chat' })}
            />
            <Stack.Screen 
              name="NewConversation" 
              component={NewConversation}
              options={{ title: 'New Conversation' }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsList}
              options={{ title: 'Notifications' }}
            />
            {user?.role === 'admin' && (
              <Stack.Screen 
                name="Analytics" 
                component={AnalyticsDashboard}
                options={{ title: 'Analytics Dashboard' }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
