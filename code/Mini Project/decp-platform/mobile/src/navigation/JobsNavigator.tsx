import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JobsStackParamList, RootStackParamList } from './types';

import JobsList from '../screens/Jobs/JobsList';
import JobDetail from '../screens/Jobs/JobDetail';
import ApplyJob from '../screens/Jobs/ApplyJob';
import PostJob from '../screens/Jobs/PostJob';

const Stack = createNativeStackNavigator<JobsStackParamList & RootStackParamList>();

const JobsNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="JobsList" 
        component={JobsList}
        options={{ title: 'Jobs' }}
      />
      <Stack.Screen 
        name="JobDetail" 
        component={JobDetail}
        options={{ title: 'Job Details' }}
      />
      <Stack.Screen 
        name="ApplyJob" 
        component={ApplyJob}
        options={{ title: 'Apply for Job' }}
      />
      <Stack.Screen 
        name="PostJob" 
        component={PostJob}
        options={{ title: 'Post a Job' }}
      />
    </Stack.Navigator>
  );
};

export default JobsNavigator;
