import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventsStackParamList, RootStackParamList } from './types';

import EventsList from '../screens/Events/EventsList';
import EventDetail from '../screens/Events/EventDetail';
import CreateEvent from '../screens/Events/CreateEvent';

const Stack = createNativeStackNavigator<EventsStackParamList & RootStackParamList>();

const EventsNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="EventsList" 
        component={EventsList}
        options={{ title: 'Events' }}
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
    </Stack.Navigator>
  );
};

export default EventsNavigator;
