import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList, RootStackParamList } from './types';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import FeedList from '../screens/Feed/FeedList';
import CreatePost from '../screens/Feed/CreatePost';
import PostDetail from '../screens/Feed/PostDetail';

const Stack = createNativeStackNavigator<HomeStackParamList & RootStackParamList>();

const HomeNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Feed" 
        component={FeedList}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default HomeNavigator;
