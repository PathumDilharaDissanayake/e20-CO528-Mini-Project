import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import ResearchProjects from '../screens/Research/ResearchProjects';
import ProjectDetail from '../screens/Research/ProjectDetail';
import CreateProject from '../screens/Research/CreateProject';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ResearchNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
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
    </Stack.Navigator>
  );
};

export default ResearchNavigator;
