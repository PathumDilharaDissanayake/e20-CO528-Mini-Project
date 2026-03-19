import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList, RootStackParamList } from './types';

import ProfileView from '../screens/Profile/ProfileView';
import EditProfile from '../screens/Profile/EditProfile';
import ConnectionsList from '../screens/Profile/ConnectionsList';
import UserPosts from '../screens/Profile/UserPosts';

const Stack = createNativeStackNavigator<ProfileStackParamList & RootStackParamList>();

const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MyProfile" 
        component={ProfileView}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfile}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="Connections" 
        component={ConnectionsList}
        options={({ route }) => ({ 
          title: route.params?.type === 'requests' ? 'Connection Requests' : 'Connections',
        })}
      />
      <Stack.Screen 
        name="UserPosts" 
        component={UserPosts}
        options={{ title: 'Posts' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
