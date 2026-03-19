import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/post.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class FeedState {
  final List<Post> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final bool hasMore;
  final int currentPage;

  const FeedState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
  });

  FeedState copyWith({
    List<Post>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool? hasMore,
    int? currentPage,
    bool clearError = false,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class FeedNotifier extends StateNotifier<FeedState> {
  final Ref _ref;

  static const int _pageSize = 10;

  FeedNotifier(this._ref) : super(const FeedState());

  ApiClient get _api => _ref.read(apiClientProvider);

  // -------------------------------------------------------------------------
  // loadFeed
  // -------------------------------------------------------------------------
  Future<void> loadFeed({bool refresh = false}) async {
    if (state.isLoading) return;

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      currentPage: refresh ? 1 : state.currentPage,
    );

    try {
      final response = await _api.get<Map<String, dynamic>>(
        ApiEndpoints.feed,
        queryParameters: {'page': 1, 'limit': _pageSize},
      );

      final data = response.data;
      final rawList = _extractList(data);
      final posts = rawList
          .map((item) => Post.fromJson(item as Map<String, dynamic>))
          .toList();

      final meta = data?['meta'] as Map<String, dynamic>?;
      final total = meta?['total'] as int?;
      final hasMore =
          total != null ? posts.length < total : posts.length >= _pageSize;

      state = state.copyWith(
        posts: posts,
        isLoading: false,
        hasMore: hasMore,
        currentPage: 1,
        clearError: true,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractErrorMessage(e),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  // -------------------------------------------------------------------------
  // loadMore
  // -------------------------------------------------------------------------
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.isLoading) return;

    final nextPage = state.currentPage + 1;
    state = state.copyWith(isLoadingMore: true);

    try {
      final response = await _api.get<Map<String, dynamic>>(
        ApiEndpoints.feed,
        queryParameters: {'page': nextPage, 'limit': _pageSize},
      );

      final data = response.data;
      final rawList = _extractList(data);
      final newPosts = rawList
          .map((item) => Post.fromJson(item as Map<String, dynamic>))
          .toList();

      final meta = data?['meta'] as Map<String, dynamic>?;
      final total = meta?['total'] as int?;
      final combinedCount = state.posts.length + newPosts.length;
      final hasMore =
          total != null ? combinedCount < total : newPosts.length >= _pageSize;

      state = state.copyWith(
        posts: [...state.posts, ...newPosts],
        isLoadingMore: false,
        hasMore: hasMore,
        currentPage: nextPage,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: _extractErrorMessage(e),
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMore: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  // -------------------------------------------------------------------------
  // likePost — optimistic update
  // -------------------------------------------------------------------------
  Future<void> likePost(String postId) async {
    state = state.copyWith(
      posts: state.posts.map((p) {
        if (p.id == postId && !p.isLiked) {
          return p.copyWith(isLiked: true, likes: p.likes + 1);
        }
        return p;
      }).toList(),
    );

    try {
      await _api.post<void>(ApiEndpoints.likePost(postId));
    } on DioException catch (_) {
      // Revert optimistic update
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId && p.isLiked) {
            return p.copyWith(
                isLiked: false, likes: p.likes > 0 ? p.likes - 1 : 0);
          }
          return p;
        }).toList(),
      );
    }
  }

  // -------------------------------------------------------------------------
  // unlikePost — optimistic update
  // -------------------------------------------------------------------------
  Future<void> unlikePost(String postId) async {
    state = state.copyWith(
      posts: state.posts.map((p) {
        if (p.id == postId && p.isLiked) {
          return p.copyWith(
              isLiked: false, likes: p.likes > 0 ? p.likes - 1 : 0);
        }
        return p;
      }).toList(),
    );

    try {
      await _api.delete<void>(ApiEndpoints.likePost(postId));
    } on DioException catch (_) {
      // Revert optimistic update
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId && !p.isLiked) {
            return p.copyWith(isLiked: true, likes: p.likes + 1);
          }
          return p;
        }).toList(),
      );
    }
  }

  // -------------------------------------------------------------------------
  // addComment
  // -------------------------------------------------------------------------
  Future<void> addComment(String postId, String content) async {
    try {
      await _api.post<Map<String, dynamic>>(
        ApiEndpoints.postComments(postId),
        data: {'content': content},
      );

      // Increment comment count optimistically
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId) {
            return p.copyWith(comments: p.comments + 1);
          }
          return p;
        }).toList(),
      );
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }

  // -------------------------------------------------------------------------
  // createPost
  // -------------------------------------------------------------------------
  Future<void> createPost(String content, {String type = 'text'}) async {
    try {
      final response = await _api.post<Map<String, dynamic>>(
        ApiEndpoints.posts,
        data: {'content': content, 'type': type},
      );

      final raw = response.data;
      final rawPost =
          (raw?['data'] is Map<String, dynamic> ? raw!['data'] : raw)
              as Map<String, dynamic>?;

      if (rawPost != null) {
        final post = Post.fromJson(rawPost);
        state = state.copyWith(posts: [post, ...state.posts]);
      }
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }

  // -------------------------------------------------------------------------
  // bookmarkPost — optimistic toggle
  // -------------------------------------------------------------------------
  Future<void> bookmarkPost(String postId) async {
    state = state.copyWith(
      posts: state.posts.map((p) {
        if (p.id == postId) return p.copyWith(isBookmarked: !p.isBookmarked);
        return p;
      }).toList(),
    );

    try {
      await _api.post<void>(ApiEndpoints.bookmarkPost(postId));
    } on DioException catch (_) {
      // Revert
      state = state.copyWith(
        posts: state.posts.map((p) {
          if (p.id == postId) return p.copyWith(isBookmarked: !p.isBookmarked);
          return p;
        }).toList(),
      );
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  List<dynamic> _extractList(Map<String, dynamic>? data) {
    if (data == null) return [];
    if (data['data'] is List) return data['data'] as List<dynamic>;
    if (data['posts'] is List) return data['posts'] as List<dynamic>;
    return [];
  }

  String _extractErrorMessage(DioException e) {
    final responseData = e.response?.data;
    if (responseData is Map) {
      final msg = responseData['message'];
      if (msg is String) return msg;
      if (msg is List && msg.isNotEmpty) return msg.first.toString();
    }
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Connection timed out. Please check your network.';
      case DioExceptionType.connectionError:
        return 'Cannot connect to server. Please check your network.';
      default:
        return e.message ?? 'An unexpected error occurred.';
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final feedProvider = StateNotifierProvider<FeedNotifier, FeedState>(
  (ref) => FeedNotifier(ref),
);
