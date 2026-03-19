import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class _Keys {
  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
  static const String userId = 'user_id';
  static const String userJson = 'user_json';
}

class StorageService {
  final FlutterSecureStorage _storage;

  StorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  Future<void> saveTokens(String access, String refresh) async {
    await Future.wait([
      _storage.write(key: _Keys.accessToken, value: access),
      _storage.write(key: _Keys.refreshToken, value: refresh),
    ]);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: _Keys.accessToken);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: _Keys.refreshToken);
  }

  Future<void> saveUser(Map<String, dynamic> userJson) async {
    final userId = userJson['id'] as String? ??
        userJson['_id'] as String? ??
        '';
    await Future.wait([
      _storage.write(key: _Keys.userJson, value: jsonEncode(userJson)),
      if (userId.isNotEmpty)
        _storage.write(key: _Keys.userId, value: userId),
    ]);
  }

  Future<Map<String, dynamic>?> getUser() async {
    final raw = await _storage.read(key: _Keys.userJson);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<String?> getUserId() async {
    return _storage.read(key: _Keys.userId);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});
