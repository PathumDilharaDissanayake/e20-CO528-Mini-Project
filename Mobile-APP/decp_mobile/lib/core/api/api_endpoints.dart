class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Users
  static const String users = '/users';
  static const String myProfile = '/users/me';
  static const String suggestedUsers = '/users/suggested';
  static const String searchUsers = '/users/search';
  static String userById(String id) => '/users/$id';
  static String followUser(String id) => '/users/connections/$id/follow';
  static String unfollowUser(String id) => '/users/connections/$id/unfollow';
  static String connectionStatus(String id) => '/users/connections/$id/status';
  static const String connectionRequests = '/users/connections/requests';
  static String acceptConnection(String id) =>
      '/users/connections/$id/accept';

  // Feed
  static const String feed = '/posts/feed';
  static const String posts = '/posts';
  static String postById(String id) => '/posts/$id';
  static String likePost(String id) => '/posts/$id/like';
  static String commentOnPost(String id) => '/posts/$id/comments';
  static String postComments(String id) => '/posts/$id/comments';
  static String bookmarkPost(String id) => '/posts/$id/bookmark';
  static const String myBookmarks = '/posts/bookmarks/me';

  // Jobs
  static const String jobs = '/jobs';
  static String jobById(String id) => '/jobs/$id';
  static String applyToJob(String id) => '/jobs/$id/apply';
  static const String myApplications = '/jobs/applications';

  // Events
  static const String events = '/events';
  static String eventById(String id) => '/events/$id';
  static String rsvpEvent(String id) => '/events/$id/rsvp';
  static const String myRsvps = '/events/my-rsvps';

  // Research
  static const String research = '/research';
  static String researchById(String id) => '/research/$id';
  static String collaborateResearch(String id) => '/research/$id/collaborate';

  // Messaging
  static const String conversations = '/conversations';
  static String conversationById(String id) => '/conversations/$id';
  static String conversationMessages(String id) =>
      '/conversations/$id/messages';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationById(String id) => '/notifications/$id';
  static String readNotification(String id) => '/notifications/$id/read';
  static const String readAllNotifications = '/notifications/read-all';
}
