import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/message.dart';
import '../../../core/services/socket_service.dart';
import '../../auth/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// ConversationsState
// ---------------------------------------------------------------------------

class ConversationsState {
  final List<Conversation> conversations;
  final bool isLoading;
  final String? error;
  final int totalUnread;

  const ConversationsState({
    this.conversations = const [],
    this.isLoading = false,
    this.error,
    this.totalUnread = 0,
  });

  ConversationsState copyWith({
    List<Conversation>? conversations,
    bool? isLoading,
    String? error,
    int? totalUnread,
    bool clearError = false,
  }) {
    return ConversationsState(
      conversations: conversations ?? this.conversations,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      totalUnread: totalUnread ?? this.totalUnread,
    );
  }
}

// ---------------------------------------------------------------------------
// ConversationsNotifier
// ---------------------------------------------------------------------------

class ConversationsNotifier extends StateNotifier<ConversationsState> {
  final Ref _ref;

  ConversationsNotifier(this._ref) : super(const ConversationsState());

  ApiClient get _api => _ref.read(apiClientProvider);

  Future<void> loadConversations() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response =
          await _api.get<Map<String, dynamic>>(ApiEndpoints.conversations);
      final data = response.data!;

      final raw = data['conversations'] as List<dynamic>? ??
          data['data'] as List<dynamic>? ??
          (data is List ? data as List<dynamic> : <dynamic>[]);

      final conversations = raw
          .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

      final totalUnread =
          conversations.fold<int>(0, (sum, c) => sum + c.unreadCount);

      state = state.copyWith(
        isLoading: false,
        conversations: conversations,
        totalUnread: totalUnread,
        clearError: true,
      );
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<Conversation?> createDirectConversation(
      String participantUserId) async {
    try {
      final response =
          await _api.post<Map<String, dynamic>>(ApiEndpoints.conversations,
              data: {
            'participantId': participantUserId,
            'type': 'direct',
          });
      final data = response.data!;
      final convData = data['conversation'] as Map<String, dynamic>? ?? data;
      final conversation = Conversation.fromJson(convData);

      final existing =
          state.conversations.indexWhere((c) => c.id == conversation.id);
      List<Conversation> updated;
      if (existing >= 0) {
        updated = [...state.conversations];
        updated[existing] = conversation;
      } else {
        updated = [conversation, ...state.conversations];
      }

      final totalUnread =
          updated.fold<int>(0, (sum, c) => sum + c.unreadCount);
      state = state.copyWith(conversations: updated, totalUnread: totalUnread);
      return conversation;
    } catch (_) {
      return null;
    }
  }

  void updateLastMessage(String conversationId, Message message) {
    final idx =
        state.conversations.indexWhere((c) => c.id == conversationId);
    if (idx < 0) return;

    final updated = [...state.conversations];
    updated[idx] = updated[idx].copyWith(lastMessage: message);
    updated.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    state = state.copyWith(conversations: updated);
  }

  String _extractError(DioException e) {
    final responseData = e.response?.data;
    if (responseData is Map) {
      final msg = responseData['message'];
      if (msg is String) return msg;
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
    }
    return e.message ?? 'An error occurred.';
  }
}

final conversationsProvider =
    StateNotifierProvider<ConversationsNotifier, ConversationsState>(
        (ref) => ConversationsNotifier(ref));

// ---------------------------------------------------------------------------
// ChatState
// ---------------------------------------------------------------------------

class ChatState {
  final List<Message> messages;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final bool hasMore;
  final Set<String> typingUserIds;
  final bool isSending;

  const ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.hasMore = true,
    this.typingUserIds = const {},
    this.isSending = false,
  });

  ChatState copyWith({
    List<Message>? messages,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool? hasMore,
    Set<String>? typingUserIds,
    bool? isSending,
    bool clearError = false,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      hasMore: hasMore ?? this.hasMore,
      typingUserIds: typingUserIds ?? this.typingUserIds,
      isSending: isSending ?? this.isSending,
    );
  }
}

// ---------------------------------------------------------------------------
// ChatNotifier
// ---------------------------------------------------------------------------

class ChatNotifier extends StateNotifier<ChatState> {
  final Ref _ref;
  final String _conversationId;

  StreamSubscription<Map<String, dynamic>>? _messageSubscription;
  StreamSubscription<Map<String, dynamic>>? _typingSubscription;
  Timer? _typingTimer;

  int _currentPage = 1;
  static const int _pageLimit = 20;

  ChatNotifier(this._ref, this._conversationId) : super(const ChatState()) {
    _initSocket();
  }

  ApiClient get _api => _ref.read(apiClientProvider);
  SocketService get _socket => _ref.read(socketServiceProvider);
  String? get _currentUserId => _ref.read(authProvider).user?.id;

  void _initSocket() {
    _messageSubscription =
        _socket.onNewMessage.listen((data) => handleNewMessage(data));
    _typingSubscription =
        _socket.onTyping.listen((data) => handleTyping(data));
  }

  Future<void> loadMessages() async {
    state = state.copyWith(isLoading: true, clearError: true);
    _currentPage = 1;
    try {
      final response = await _api.get<Map<String, dynamic>>(
        ApiEndpoints.conversationMessages(_conversationId),
        queryParameters: {'page': 1, 'limit': _pageLimit},
      );
      final data = response.data!;
      final raw = data['messages'] as List<dynamic>? ??
          data['data'] as List<dynamic>? ??
          <dynamic>[];

      final messages = raw
          .map((e) => Message.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

      state = state.copyWith(
        isLoading: false,
        messages: messages,
        hasMore: messages.length >= _pageLimit,
        clearError: true,
      );

      _socket.markMessagesRead(_conversationId);
    } on DioException catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.isLoading) return;
    state = state.copyWith(isLoadingMore: true, clearError: true);
    _currentPage++;
    try {
      final response = await _api.get<Map<String, dynamic>>(
        ApiEndpoints.conversationMessages(_conversationId),
        queryParameters: {'page': _currentPage, 'limit': _pageLimit},
      );
      final data = response.data!;
      final raw = data['messages'] as List<dynamic>? ??
          data['data'] as List<dynamic>? ??
          <dynamic>[];

      final newMessages = raw
          .map((e) => Message.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

      state = state.copyWith(
        isLoadingMore: false,
        messages: [...state.messages, ...newMessages],
        hasMore: newMessages.length >= _pageLimit,
        clearError: true,
      );
    } on DioException catch (e) {
      _currentPage--;
      state = state.copyWith(isLoadingMore: false, error: _extractError(e));
    } catch (e) {
      _currentPage--;
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> sendMessage(String content, {String type = 'text'}) async {
    if (content.trim().isEmpty) return;
    state = state.copyWith(isSending: true, clearError: true);
    try {
      final response = await _api.post<Map<String, dynamic>>(
        ApiEndpoints.conversationMessages(_conversationId),
        data: {'content': content.trim(), 'type': type},
      );
      final data = response.data!;
      final msgData = data['message'] as Map<String, dynamic>? ?? data;
      final message = Message.fromJson(msgData);

      state = state.copyWith(
        isSending: false,
        messages: [message, ...state.messages],
        clearError: true,
      );

      _ref
          .read(conversationsProvider.notifier)
          .updateLastMessage(_conversationId, message);

      stopTyping();
    } on DioException catch (e) {
      state = state.copyWith(isSending: false, error: _extractError(e));
    } catch (e) {
      state = state.copyWith(
        isSending: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  void handleNewMessage(Map<String, dynamic> messageData) {
    final conversationId = messageData['conversationId']?.toString() ??
        messageData['conversation']?.toString() ??
        '';
    if (conversationId != _conversationId) return;

    final message = Message.fromJson(messageData);
    if (state.messages.any((m) => m.id == message.id)) return;

    state = state.copyWith(messages: [message, ...state.messages]);

    _ref
        .read(conversationsProvider.notifier)
        .updateLastMessage(_conversationId, message);

    _socket.markMessagesRead(_conversationId);
  }

  void handleTyping(Map<String, dynamic> data) {
    final conversationId = data['conversationId']?.toString() ?? '';
    if (conversationId != _conversationId) return;

    final userId = data['userId']?.toString() ?? '';
    if (userId == _currentUserId) return;

    final stopped = data['stopped'] as bool? ?? false;
    final current = Set<String>.from(state.typingUserIds);

    if (stopped) {
      current.remove(userId);
    } else {
      current.add(userId);
    }
    state = state.copyWith(typingUserIds: current);
  }

  void startTyping() {
    _socket.startTyping(_conversationId);
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 3), stopTyping);
  }

  void stopTyping() {
    _typingTimer?.cancel();
    _socket.stopTyping(_conversationId);
  }

  String _extractError(DioException e) {
    final responseData = e.response?.data;
    if (responseData is Map) {
      final msg = responseData['message'];
      if (msg is String) return msg;
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
    }
    return e.message ?? 'An error occurred.';
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _typingSubscription?.cancel();
    _typingTimer?.cancel();
    super.dispose();
  }
}

final chatProvider =
    StateNotifierProvider.family<ChatNotifier, ChatState, String>(
  (ref, conversationId) => ChatNotifier(ref, conversationId),
);
