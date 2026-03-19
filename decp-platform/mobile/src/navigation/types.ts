import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  CreatePost: undefined;
  Profile: { userId: string };
  EditProfile: undefined;
  Connections: { userId: string; type: 'connections' | 'requests' };
  JobDetail: { jobId: string };
  ApplyJob: { jobId: string };
  PostJob: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
  Chat: { conversationId: string; participantName?: string };
  NewConversation: undefined;
  Notifications: undefined;
  Settings: undefined;
  Analytics: undefined;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  JobsTab: undefined;
  EventsTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Feed: undefined;
};

// Jobs Stack
export type JobsStackParamList = {
  JobsList: undefined;
};

// Events Stack
export type EventsStackParamList = {
  EventsList: undefined;
};

// Messages Stack
export type MessagesStackParamList = {
  Conversations: undefined;
};

// Profile Stack
export type ProfileStackParamList = {
  MyProfile: undefined;
};

// Screen Props Types
export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = NativeStackScreenProps<
  HomeStackParamList,
  T
>;

export type JobsScreenProps<T extends keyof JobsStackParamList> = NativeStackScreenProps<
  JobsStackParamList,
  T
>;

export type EventsScreenProps<T extends keyof EventsStackParamList> = NativeStackScreenProps<
  EventsStackParamList,
  T
>;

export type MessagesScreenProps<T extends keyof MessagesStackParamList> = NativeStackScreenProps<
  MessagesStackParamList,
  T
>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> = NativeStackScreenProps<
  ProfileStackParamList,
  T
>;
