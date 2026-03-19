class Post {
  final String id;
  final String userId;
  final PostAuthor author;
  final String content;
  final List<String> mediaUrls;
  final String type;
  final int likes;
  final int comments;
  final int shares;
  final bool isPublic;
  final List<PollOption>? pollOptions;
  final DateTime? pollEndsAt;
  final String? originalPostId;
  final bool isLiked;
  final bool isBookmarked;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Post({
    required this.id,
    required this.userId,
    required this.author,
    required this.content,
    required this.mediaUrls,
    required this.type,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.isPublic,
    this.pollOptions,
    this.pollEndsAt,
    this.originalPostId,
    required this.isLiked,
    required this.isBookmarked,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    int resolveCount(dynamic value) {
      if (value is int) return value;
      if (value is List) return value.length;
      return 0;
    }

    return Post(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      userId: json['userId'] as String? ??
          (json['author'] is Map<String, dynamic>
              ? ((json['author'] as Map<String, dynamic>)['_id'] as String? ??
                  (json['author'] as Map<String, dynamic>)['id'] as String? ??
                  '')
              : ''),
      author: PostAuthor.fromJson(
          json['author'] as Map<String, dynamic>? ?? {}),
      content: json['content'] as String? ?? '',
      mediaUrls: (json['mediaUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      type: json['type'] as String? ?? 'text',
      likes: resolveCount(json['likes']),
      comments: resolveCount(json['comments']),
      shares: resolveCount(json['shares']),
      isPublic: json['isPublic'] as bool? ?? true,
      pollOptions: (json['pollOptions'] as List<dynamic>?)
          ?.map((e) => PollOption.fromJson(e as Map<String, dynamic>))
          .toList(),
      pollEndsAt: json['pollEndsAt'] != null
          ? DateTime.tryParse(json['pollEndsAt'].toString())
          : null,
      originalPostId: json['originalPostId'] as String?,
      isLiked: json['isLiked'] as bool? ?? false,
      isBookmarked: json['isBookmarked'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'author': author.toJson(),
      'content': content,
      'mediaUrls': mediaUrls,
      'type': type,
      'likes': likes,
      'comments': comments,
      'shares': shares,
      'isPublic': isPublic,
      if (pollOptions != null)
        'pollOptions': pollOptions!.map((e) => e.toJson()).toList(),
      if (pollEndsAt != null) 'pollEndsAt': pollEndsAt!.toIso8601String(),
      if (originalPostId != null) 'originalPostId': originalPostId,
      'isLiked': isLiked,
      'isBookmarked': isBookmarked,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Post copyWith({
    String? id,
    String? userId,
    PostAuthor? author,
    String? content,
    List<String>? mediaUrls,
    String? type,
    int? likes,
    int? comments,
    int? shares,
    bool? isPublic,
    List<PollOption>? pollOptions,
    DateTime? pollEndsAt,
    String? originalPostId,
    bool? isLiked,
    bool? isBookmarked,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Post(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      author: author ?? this.author,
      content: content ?? this.content,
      mediaUrls: mediaUrls ?? this.mediaUrls,
      type: type ?? this.type,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      shares: shares ?? this.shares,
      isPublic: isPublic ?? this.isPublic,
      pollOptions: pollOptions ?? this.pollOptions,
      pollEndsAt: pollEndsAt ?? this.pollEndsAt,
      originalPostId: originalPostId ?? this.originalPostId,
      isLiked: isLiked ?? this.isLiked,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class PostAuthor {
  final String id;
  final String firstName;
  final String lastName;
  final String role;
  final String? avatar;

  const PostAuthor({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.avatar,
  });

  String get fullName => '$firstName $lastName';

  factory PostAuthor.fromJson(Map<String, dynamic> json) {
    return PostAuthor(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      avatar: json['avatar'] as String? ??
          json['profilePicture'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
      if (avatar != null) 'avatar': avatar,
    };
  }
}

class PollOption {
  final String text;
  final List<String> votes;

  const PollOption({
    required this.text,
    required this.votes,
  });

  int get voteCount => votes.length;

  factory PollOption.fromJson(Map<String, dynamic> json) {
    return PollOption(
      text: json['text'] as String? ?? '',
      votes: (json['votes'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'votes': votes,
    };
  }
}

class Comment {
  final String id;
  final String postId;
  final String userId;
  final PostAuthor author;
  final String content;
  final DateTime createdAt;

  const Comment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.author,
    required this.content,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      postId: json['postId'] as String? ?? '',
      userId: json['userId'] as String? ??
          (json['author'] is Map<String, dynamic>
              ? ((json['author'] as Map<String, dynamic>)['_id'] as String? ??
                  (json['author'] as Map<String, dynamic>)['id'] as String? ??
                  '')
              : ''),
      author: PostAuthor.fromJson(
          json['author'] as Map<String, dynamic>? ?? {}),
      content: json['content'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'postId': postId,
      'userId': userId,
      'author': author.toJson(),
      'content': content,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
