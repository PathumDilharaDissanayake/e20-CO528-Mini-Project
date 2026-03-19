class Conversation {
  final String id;
  final String type;
  final String? title;
  final List<String> participants;
  final String createdBy;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ConversationParticipant>? participantProfiles;

  const Conversation({
    required this.id,
    required this.type,
    this.title,
    required this.participants,
    required this.createdBy,
    this.lastMessage,
    required this.unreadCount,
    required this.createdAt,
    required this.updatedAt,
    this.participantProfiles,
  });

  String displayName(String currentUserId) {
    if (type == 'group' && title != null && title!.isNotEmpty) {
      return title!;
    }
    if (participantProfiles != null) {
      final other = participantProfiles!.firstWhere(
        (p) => p.id != currentUserId,
        orElse: () => participantProfiles!.isNotEmpty
            ? participantProfiles!.first
            : const ConversationParticipant(
                id: '',
                firstName: 'Unknown',
                lastName: '',
              ),
      );
      return other.fullName;
    }
    return title ?? 'Conversation';
  }

  ConversationParticipant? otherParticipant(String currentUserId) {
    if (type == 'group' || participantProfiles == null) return null;
    try {
      return participantProfiles!.firstWhere((p) => p.id != currentUserId);
    } catch (_) {
      return participantProfiles!.isNotEmpty
          ? participantProfiles!.first
          : null;
    }
  }

  factory Conversation.fromJson(Map<String, dynamic> json) {
    List<String> resolveParticipantIds(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) {
        return raw.map((e) {
          if (e is String) return e;
          if (e is Map<String, dynamic>) {
            return e['_id'] as String? ?? e['id'] as String? ?? '';
          }
          return e.toString();
        }).toList();
      }
      return [];
    }

    List<ConversationParticipant>? resolveProfiles(dynamic raw) {
      if (raw == null) return null;
      if (raw is List) {
        return raw.whereType<Map<String, dynamic>>().map((e) {
          if (e.containsKey('firstName')) {
            return ConversationParticipant.fromJson(e);
          }
          return null;
        }).whereType<ConversationParticipant>().toList();
      }
      return null;
    }

    return Conversation(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'direct',
      title: json['title'] as String?,
      participants: resolveParticipantIds(json['participants']),
      createdBy: json['createdBy'] is Map<String, dynamic>
          ? ((json['createdBy'] as Map<String, dynamic>)['_id'] as String? ??
              (json['createdBy'] as Map<String, dynamic>)['id'] as String? ??
              '')
          : json['createdBy']?.toString() ?? '',
      lastMessage: json['lastMessage'] is Map<String, dynamic>
          ? Message.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      participantProfiles: resolveProfiles(json['participants']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      if (title != null) 'title': title,
      'participants': participants,
      'createdBy': createdBy,
      if (lastMessage != null) 'lastMessage': lastMessage!.toJson(),
      'unreadCount': unreadCount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Conversation copyWith({
    String? id,
    String? type,
    String? title,
    List<String>? participants,
    String? createdBy,
    Message? lastMessage,
    int? unreadCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<ConversationParticipant>? participantProfiles,
  }) {
    return Conversation(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      participants: participants ?? this.participants,
      createdBy: createdBy ?? this.createdBy,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      participantProfiles: participantProfiles ?? this.participantProfiles,
    );
  }
}

class ConversationParticipant {
  final String id;
  final String firstName;
  final String lastName;
  final String? avatar;

  const ConversationParticipant({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.avatar,
  });

  String get fullName => '$firstName $lastName';

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) {
    final data = json['user'] as Map<String, dynamic>? ?? json;
    return ConversationParticipant(
      id: data['_id'] as String? ?? data['id'] as String? ?? '',
      firstName: data['firstName'] as String? ?? '',
      lastName: data['lastName'] as String? ?? '',
      avatar: data['avatar'] as String? ?? data['profilePicture'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      if (avatar != null) 'avatar': avatar,
    };
  }
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final String type;
  final String? attachmentUrl;
  final bool isDeleted;
  final DateTime createdAt;
  final ConversationParticipant? sender;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.type,
    this.attachmentUrl,
    required this.isDeleted,
    required this.createdAt,
    this.sender,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    String resolveSenderId() {
      if (json['senderId'] != null) return json['senderId'].toString();
      if (json['sender'] is Map<String, dynamic>) {
        final s = json['sender'] as Map<String, dynamic>;
        return s['_id'] as String? ?? s['id'] as String? ?? '';
      }
      if (json['sender'] != null) return json['sender'].toString();
      return '';
    }

    ConversationParticipant? resolveSender() {
      if (json['sender'] is Map<String, dynamic>) {
        final s = json['sender'] as Map<String, dynamic>;
        if (s.containsKey('firstName')) {
          return ConversationParticipant.fromJson(s);
        }
      }
      return null;
    }

    return Message(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      conversationId: json['conversationId']?.toString() ??
          json['conversation']?.toString() ??
          '',
      senderId: resolveSenderId(),
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'text',
      attachmentUrl: json['attachmentUrl'] as String?,
      isDeleted: json['isDeleted'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      sender: resolveSender(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'content': content,
      'type': type,
      if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
      'isDeleted': isDeleted,
      'createdAt': createdAt.toIso8601String(),
      if (sender != null) 'sender': sender!.toJson(),
    };
  }

  Message copyWith({
    String? id,
    String? conversationId,
    String? senderId,
    String? content,
    String? type,
    String? attachmentUrl,
    bool? isDeleted,
    DateTime? createdAt,
    ConversationParticipant? sender,
  }) {
    return Message(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      type: type ?? this.type,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      isDeleted: isDeleted ?? this.isDeleted,
      createdAt: createdAt ?? this.createdAt,
      sender: sender ?? this.sender,
    );
  }
}
