import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/app_config.dart';
import '../services/storage_service.dart';
import 'api_endpoints.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException({required this.message, this.statusCode});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  late final Dio _dio;
  final Ref _ref;

  ApiClient(this._ref) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
      ),
    );
  }

  StorageService get _storage => _ref.read(storageServiceProvider);

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  Future<void> _onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        try {
          final refreshDio = Dio(
            BaseOptions(baseUrl: AppConfig.apiBaseUrl),
          );
          final response = await refreshDio.post(
            ApiEndpoints.refresh,
            data: {'refreshToken': refreshToken},
          );
          final newAccess =
              response.data['accessToken'] as String?;
          final newRefresh =
              response.data['refreshToken'] as String?;

          if (newAccess != null) {
            await _storage.saveTokens(
              newAccess,
              newRefresh ?? refreshToken,
            );
          }

          final cloned = err.requestOptions;
          cloned.headers['Authorization'] =
              'Bearer ${newAccess ?? ''}';
          final retryResponse = await _dio.fetch(cloned);
          return handler.resolve(retryResponse);
        } catch (_) {
          await _storage.clearAll();
        }
      }
    }

    final statusCode = err.response?.statusCode;
    final message = _extractErrorMessage(err);
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        error: ApiException(message: message, statusCode: statusCode),
        type: err.type,
      ),
    );
  }

  String _extractErrorMessage(DioException err) {
    try {
      final data = err.response?.data;
      if (data is Map<String, dynamic>) {
        return data['message'] as String? ??
            data['error'] as String? ??
            err.message ??
            'An error occurred';
      }
    } catch (_) {}
    return err.message ?? 'An error occurred';
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParams,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        path,
        queryParameters: queryParams,
      );
      return response.data;
    } on DioException catch (e) {
      throw _wrapDioException(e);
    }
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    bool isFormData = false,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        path,
        data: isFormData && data is! FormData
            ? FormData.fromMap(data as Map<String, dynamic>)
            : data,
      );
      return response.data;
    } on DioException catch (e) {
      throw _wrapDioException(e);
    }
  }

  Future<dynamic> put(String path, {dynamic data}) async {
    try {
      final response = await _dio.put<dynamic>(path, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _wrapDioException(e);
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final response = await _dio.delete<dynamic>(path);
      return response.data;
    } on DioException catch (e) {
      throw _wrapDioException(e);
    }
  }

  Future<dynamic> postFormData(String path, FormData formData) async {
    try {
      final response = await _dio.post<dynamic>(
        path,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return response.data;
    } on DioException catch (e) {
      throw _wrapDioException(e);
    }
  }

  ApiException _wrapDioException(DioException e) {
    if (e.error is ApiException) return e.error as ApiException;
    final statusCode = e.response?.statusCode;
    final message = _extractErrorMessage(e);
    return ApiException(message: message, statusCode: statusCode);
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref);
});
