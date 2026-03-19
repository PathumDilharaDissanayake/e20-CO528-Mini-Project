import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/user.dart';
import '../../../core/services/storage_service.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class AuthState {
  final AuthUser? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    AuthUser? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref _ref;

  AuthNotifier(this._ref) : super(const AuthState());

  ApiClient get _api => _ref.read(apiClientProvider);
  StorageService get _storage => _ref.read(storageServiceProvider);

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _api.post(
        ApiEndpoints.login,
        data: {'email': email, 'password': password},
      ) as Map<String, dynamic>;

      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;
      final userData = data['user'] as Map<String, dynamic>?;

      if (accessToken == null || refreshToken == null || userData == null) {
        throw const ApiException(message: 'Invalid response from server');
      }

      final user = AuthUser.fromJson(userData);
      await _storage.saveTokens(accessToken, refreshToken);
      await _storage.saveUser(userData);

      state = state.copyWith(
        isLoading: false,
        user: user,
        isAuthenticated: true,
        clearError: true,
      );
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _stringify(e),
      );
    }
  }

  // -------------------------------------------------------------------------
  // register
  // -------------------------------------------------------------------------
  Future<void> register(
    String email,
    String password,
    String firstName,
    String lastName,
    String role, {
    String? department,
    int? graduationYear,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final body = <String, dynamic>{
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
        if (department != null && department.isNotEmpty)
          'department': department,
        if (graduationYear != null) 'graduationYear': graduationYear,
      };

      final data = await _api.post(
        ApiEndpoints.register,
        data: body,
      ) as Map<String, dynamic>;

      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;
      final userData = data['user'] as Map<String, dynamic>?;

      if (accessToken == null || refreshToken == null || userData == null) {
        throw const ApiException(message: 'Invalid response from server');
      }

      final user = AuthUser.fromJson(userData);
      await _storage.saveTokens(accessToken, refreshToken);
      await _storage.saveUser(userData);

      state = state.copyWith(
        isLoading: false,
        user: user,
        isAuthenticated: true,
        clearError: true,
      );
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _stringify(e));
    }
  }

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------
  Future<void> logout() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _api.post(
          ApiEndpoints.logout,
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (_) {
      // Best-effort: proceed with local logout regardless
    } finally {
      await _storage.clearAll();
      state = const AuthState();
    }
  }

  // -------------------------------------------------------------------------
  // checkAuth — called on app start to restore session
  // -------------------------------------------------------------------------
  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final accessToken = await _storage.getAccessToken();
      if (accessToken == null || accessToken.isEmpty) {
        state = const AuthState();
        return;
      }

      final raw = await _api.get(ApiEndpoints.me);
      final data = raw as Map<String, dynamic>;

      // Backend may return user directly or nested under 'user' key
      final userData = data['user'] as Map<String, dynamic>? ?? data;
      final user = AuthUser.fromJson(userData);

      // Update stored user with fresh data
      await _storage.saveUser(userData);

      state = state.copyWith(
        isLoading: false,
        user: user,
        isAuthenticated: true,
        clearError: true,
      );
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await _storage.clearAll();
        state = const AuthState();
      } else {
        // Network/server error — try restoring from cache
        await _restoreFromCache();
      }
    } catch (_) {
      await _restoreFromCache();
    }
  }

  Future<void> _restoreFromCache() async {
    final cachedJson = await _storage.getUser();
    if (cachedJson != null) {
      final cachedUser = AuthUser.fromJson(cachedJson);
      state = state.copyWith(
        isLoading: false,
        user: cachedUser,
        isAuthenticated: true,
      );
    } else {
      await _storage.clearAll();
      state = const AuthState();
    }
  }

  // -------------------------------------------------------------------------
  // forgotPassword
  // -------------------------------------------------------------------------
  Future<void> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _api.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email},
      );
      state = state.copyWith(isLoading: false, clearError: true);
    } on ApiException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _stringify(e));
    }
  }

  // -------------------------------------------------------------------------
  // clearError
  // -------------------------------------------------------------------------
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  String _stringify(Object e) {
    final s = e.toString();
    return s.startsWith('Exception: ') ? s.substring(11) : s;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref),
);
