import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/job.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class JobsState {
  final List<Job> jobs;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final bool hasMore;
  final int currentPage;
  final String? filterType;
  final String? filterLocation;
  final List<JobApplication> myApplications;
  final bool isLoadingApplications;

  const JobsState({
    this.jobs = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.hasMore = true,
    this.currentPage = 1,
    this.filterType,
    this.filterLocation,
    this.myApplications = const [],
    this.isLoadingApplications = false,
  });

  JobsState copyWith({
    List<Job>? jobs,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool? hasMore,
    int? currentPage,
    String? filterType,
    String? filterLocation,
    List<JobApplication>? myApplications,
    bool? isLoadingApplications,
    bool clearError = false,
    bool clearFilterType = false,
    bool clearFilterLocation = false,
  }) {
    return JobsState(
      jobs: jobs ?? this.jobs,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      filterType: clearFilterType ? null : (filterType ?? this.filterType),
      filterLocation:
          clearFilterLocation ? null : (filterLocation ?? this.filterLocation),
      myApplications: myApplications ?? this.myApplications,
      isLoadingApplications:
          isLoadingApplications ?? this.isLoadingApplications,
    );
  }

  /// Returns the set of job IDs for which the current user has applied.
  Set<String> get appliedJobIds =>
      myApplications.map((a) => a.jobId).toSet();
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class JobsNotifier extends StateNotifier<JobsState> {
  final Ref _ref;
  static const int _pageSize = 10;

  JobsNotifier(this._ref) : super(const JobsState());

  ApiClient get _api => _ref.read(apiClientProvider);

  // -------------------------------------------------------------------------
  // loadJobs
  // -------------------------------------------------------------------------
  Future<void> loadJobs({bool refresh = false}) async {
    if (state.isLoading) return;

    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        currentPage: 1,
        hasMore: true,
        clearError: true,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    try {
      final params = <String, dynamic>{
        'page': 1,
        'limit': _pageSize,
        if (state.filterType != null) 'type': state.filterType,
        if (state.filterLocation != null) 'location': state.filterLocation,
      };

      final response = await _api.get(ApiEndpoints.jobs, queryParameters: params);
      final body = response.data as Map<String, dynamic>;
      final rawList = (body['jobs'] ?? body['data'] ?? body) as List<dynamic>;
      final jobs = rawList
          .whereType<Map<String, dynamic>>()
          .map(Job.fromJson)
          .toList();

      final total = body['total'] as int? ?? body['count'] as int? ?? jobs.length;
      final hasMore = jobs.length >= _pageSize && jobs.length < total;

      state = state.copyWith(
        jobs: jobs,
        isLoading: false,
        currentPage: 1,
        hasMore: hasMore,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: _extractMessage(e),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
      final params = <String, dynamic>{
        'page': nextPage,
        'limit': _pageSize,
        if (state.filterType != null) 'type': state.filterType,
        if (state.filterLocation != null) 'location': state.filterLocation,
      };

      final response = await _api.get(ApiEndpoints.jobs, queryParameters: params);
      final body = response.data as Map<String, dynamic>;
      final rawList = (body['jobs'] ?? body['data'] ?? body) as List<dynamic>;
      final newJobs = rawList
          .whereType<Map<String, dynamic>>()
          .map(Job.fromJson)
          .toList();

      final total =
          body['total'] as int? ?? body['count'] as int? ?? (state.jobs.length + newJobs.length);
      final combined = [...state.jobs, ...newJobs];

      state = state.copyWith(
        jobs: combined,
        isLoadingMore: false,
        currentPage: nextPage,
        hasMore: combined.length < total && newJobs.length >= _pageSize,
      );
    } on DioException catch (e) {
      state = state.copyWith(isLoadingMore: false, error: _extractMessage(e));
    } catch (e) {
      state = state.copyWith(isLoadingMore: false, error: e.toString());
    }
  }

  // -------------------------------------------------------------------------
  // loadMyApplications
  // -------------------------------------------------------------------------
  Future<void> loadMyApplications() async {
    if (state.isLoadingApplications) return;
    state = state.copyWith(isLoadingApplications: true);

    try {
      final response = await _api.get(ApiEndpoints.jobApplications);
      final body = response.data as Map<String, dynamic>;
      final rawList =
          (body['applications'] ?? body['data'] ?? body) as List<dynamic>;
      final applications = rawList
          .whereType<Map<String, dynamic>>()
          .map(JobApplication.fromJson)
          .toList();

      state = state.copyWith(
        myApplications: applications,
        isLoadingApplications: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoadingApplications: false,
        error: _extractMessage(e),
      );
    } catch (e) {
      state = state.copyWith(isLoadingApplications: false, error: e.toString());
    }
  }

  // -------------------------------------------------------------------------
  // applyToJob
  // -------------------------------------------------------------------------
  Future<void> applyToJob(String jobId, {String? coverLetter}) async {
    try {
      final response = await _api.post(
        ApiEndpoints.applyJob(jobId),
        data: {
          if (coverLetter != null && coverLetter.isNotEmpty)
            'coverLetter': coverLetter,
        },
      );
      final body = response.data as Map<String, dynamic>?;
      final applicationJson =
          body?['application'] as Map<String, dynamic>? ?? body;
      if (applicationJson != null) {
        final application = JobApplication.fromJson(applicationJson);
        state = state.copyWith(
          myApplications: [...state.myApplications, application],
        );
      }
    } on DioException catch (e) {
      throw Exception(_extractMessage(e));
    }
  }

  // -------------------------------------------------------------------------
  // createJob
  // -------------------------------------------------------------------------
  Future<void> createJob(Map<String, dynamic> jobData) async {
    try {
      final response = await _api.post(ApiEndpoints.jobs, data: jobData);
      final body = response.data as Map<String, dynamic>?;
      final jobJson = body?['job'] as Map<String, dynamic>? ?? body;
      if (jobJson != null) {
        final newJob = Job.fromJson(jobJson);
        state = state.copyWith(jobs: [newJob, ...state.jobs]);
      }
    } on DioException catch (e) {
      throw Exception(_extractMessage(e));
    }
  }

  // -------------------------------------------------------------------------
  // setFilter
  // -------------------------------------------------------------------------
  void setFilter({String? type, String? location}) {
    state = state.copyWith(
      filterType: type,
      filterLocation: location,
      clearFilterType: type == null,
      clearFilterLocation: location == null,
    );
    loadJobs(refresh: true);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  String _extractMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      final msg = data['message'];
      if (msg is String) return msg;
    }
    return e.message ?? 'An error occurred';
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final jobsProvider = StateNotifierProvider<JobsNotifier, JobsState>(
  (ref) => JobsNotifier(ref),
);
