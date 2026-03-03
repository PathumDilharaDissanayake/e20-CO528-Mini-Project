import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesStackParamList, RootStackParamList } from './types';

import ConversationsList from '../screens/Messaging/ConversationsList';
import ChatScreen from '../screens/Messaging/ChatScreen';
import NewConversation from '../screens/Messaging/NewConversation';

const Stack = createNativeStackNavigator<MessagesStackParamList & RootStackParamList>();

const MessagesNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Conversations" 
        component={ConversationsList}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={({ route }) => ({ 
          title: route.params?.participantName || 'Chat',
        })}
      />
      <Stack.Screen 
        name="NewConversation" 
        component={NewConversation}
        options={{ title: 'New Message' }}
      />
    </Stack.Navigator>
  );
};

export default MessagesNavigator;
