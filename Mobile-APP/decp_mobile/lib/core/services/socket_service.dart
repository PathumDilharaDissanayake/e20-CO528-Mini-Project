import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../config/app_config.dart';

class SocketService {
  io.Socket? _socket;

  final StreamController<Map<String, dynamic>> _newMessageController =
      StreamController<Map<String, dynamic>>.broadcast();

  final StreamController<Map<String, dynamic>> _typingController =
      StreamController<Map<String, dynamic>>.broadcast();

  final StreamController<List<String>> _onlineUsersController =
      StreamController<List<String>>.broadcast();

  bool get isConnected => _socket?.connected ?? false;

  Stream<Map<String, dynamic>> get onNewMessage =>
      _newMessageController.stream;

  Stream<Map<String, dynamic>> get onTyping => _typingController.stream;

  Stream<List<String>> get onlineUsers => _onlineUsersController.stream;

  void connect(String token) {
    if (_socket != null && _socket!.connected) return;

    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(2000)
          .setAuth({'token': token})
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .build(),
    );

    _socket!.onConnect((_) {});

    _socket!.onDisconnect((_) {});

    _socket!.onError((_) {});

    _socket!.on('new_message', (data) {
      final map = _toStringDynamicMap(data);
      if (map != null) _newMessageController.add(map);
    });

    _socket!.on('typing', (data) {
      final map = _toStringDynamicMap(data);
      if (map != null) _typingController.add(map);
    });

    _socket!.on('online_users', (data) {
      if (data is List) {
        _onlineUsersController.add(data.map((e) => e.toString()).toList());
      }
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void joinConversation(String conversationId) {
    _socket?.emit('join_conversation', {'conversationId': conversationId});
  }

  void leaveConversation(String conversationId) {
    _socket?.emit('leave_conversation', {'conversationId': conversationId});
  }

  void sendMessage(
    String conversationId,
    String content,
    String type,
  ) {
    _socket?.emit('send_message', {
      'conversationId': conversationId,
      'content': content,
      'type': type,
    });
  }

  void sendTyping(String conversationId, bool isTyping) {
    _socket?.emit('typing', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  void onNewNotification(Function(Map<String, dynamic>) callback) {
    _socket?.on('new_notification', (data) {
      final map = _toStringDynamicMap(data);
      if (map != null) callback(map);
    });
  }

  Map<String, dynamic>? _toStringDynamicMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return data.cast<String, dynamic>();
    return null;
  }

  void dispose() {
    disconnect();
    _newMessageController.close();
    _typingController.close();
    _onlineUsersController.close();
  }
}

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService();
  ref.onDispose(service.dispose);
  return service;
});
