import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/job.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../providers/jobs_provider.dart';
import '../widgets/job_card.dart';

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({super.key});

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  static const _filterOptions = [
    (label: 'All', value: null as String?),
    (label: 'Full-time', value: 'full-time' as String?),
    (label: 'Part-time', value: 'part-time' as String?),
    (label: 'Internship', value: 'internship' as String?),
    (label: 'Remote', value: 'remote' as String?),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    _scrollController.addListener(_onScroll);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(jobsProvider.notifier).loadJobs(refresh: true);
      ref.read(jobsProvider.notifier).loadMyApplications();
    });
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) return;
    if (_tabController.index == 1) {
      ref.read(jobsProvider.notifier).loadMyApplications();
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(jobsProvider.notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _showCreateJobSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const _CreateJobSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final authState = ref.watch(authProvider);
    final jobsState = ref.watch(jobsProvider);
    final canPost = authState.user?.role == 'alumni' ||
        authState.user?.role == 'faculty' ||
        authState.user?.role == 'admin';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs & Internships'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Browse Jobs'),
            Tab(text: 'My Applications'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search jobs, companies…',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
                isDense: true,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),

          // Filter chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: _filterOptions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                final opt = _filterOptions[i];
                final selected = jobsState.filterType == opt.value;
                return FilterChip(
                  label: Text(opt.label),
                  selected: selected,
                  onSelected: (_) {
                    ref
                        .read(jobsProvider.notifier)
                        .setFilter(type: opt.value);
                  },
                  selectedColor: cs.primaryContainer,
                  checkmarkColor: cs.primary,
                );
              },
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _BrowseJobsTab(
                  jobsState: jobsState,
                  searchQuery: _searchController.text.trim(),
                  scrollController: _scrollController,
                ),
                _MyApplicationsTab(jobsState: jobsState),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: canPost
          ? FloatingActionButton.extended(
              onPressed: _showCreateJobSheet,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Post Job'),
            )
          : null,
    );
  }
}

// ---------------------------------------------------------------------------
// Browse Jobs Tab
// ---------------------------------------------------------------------------

class _BrowseJobsTab extends ConsumerWidget {
  final JobsState jobsState;
  final String searchQuery;
  final ScrollController scrollController;

  const _BrowseJobsTab({
    required this.jobsState,
    required this.searchQuery,
    required this.scrollController,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    if (jobsState.isLoading && jobsState.jobs.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (jobsState.error != null && jobsState.jobs.isEmpty) {
      return _ErrorView(
        message: jobsState.error!,
        onRetry: () =>
            ref.read(jobsProvider.notifier).loadJobs(refresh: true),
      );
    }

    final filtered = searchQuery.isEmpty
        ? jobsState.jobs
        : jobsState.jobs.where((j) {
            final q = searchQuery.toLowerCase();
            return j.title.toLowerCase().contains(q) ||
                j.company.toLowerCase().contains(q) ||
                j.location.toLowerCase().contains(q);
          }).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.work_off_rounded,
                size: 64, color: theme.colorScheme.outline),
            const SizedBox(height: 12),
            Text('No jobs found', style: theme.textTheme.titleMedium),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(jobsProvider.notifier).loadJobs(refresh: true),
      child: ListView.builder(
        controller: scrollController,
        padding: const EdgeInsets.only(bottom: 100),
        itemCount: filtered.length + (jobsState.isLoadingMore ? 1 : 0),
        itemBuilder: (ctx, i) {
          if (i == filtered.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return JobCard(job: filtered[i]);
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// My Applications Tab
// ---------------------------------------------------------------------------

class _MyApplicationsTab extends StatelessWidget {
  final JobsState jobsState;

  const _MyApplicationsTab({required this.jobsState});

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
        return const Color(0xFF2E7D32);
      case 'shortlisted':
        return const Color(0xFF1565C0);
      case 'reviewed':
        return const Color(0xFF6A1B9A);
      case 'rejected':
        return const Color(0xFFC62828);
      default:
        return const Color(0xFF795548);
    }
  }

  String _statusLabel(String status) {
    final map = {
      'accepted': 'Accepted',
      'shortlisted': 'Shortlisted',
      'reviewed': 'Reviewed',
      'rejected': 'Rejected',
      'pending': 'Pending',
    };
    return map[status.toLowerCase()] ?? status;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    if (jobsState.isLoadingApplications && jobsState.myApplications.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (jobsState.myApplications.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.inbox_rounded, size: 64, color: cs.outline),
            const SizedBox(height: 12),
            Text('No applications yet', style: theme.textTheme.titleMedium),
            const SizedBox(height: 6),
            Text('Start applying to jobs!', style: theme.textTheme.bodySmall),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(top: 8, bottom: 100),
      itemCount: jobsState.myApplications.length,
      itemBuilder: (ctx, i) {
        final app = jobsState.myApplications[i];
        final statusColor = _statusColor(app.status);
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: cs.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.work_rounded, color: cs.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        app.job?.title ?? 'Job Application',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (app.job?.company != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          app.job!.company,
                          style: theme.textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _StatusBadge(
                  label: _statusLabel(app.status),
                  color: statusColor,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Shared widgets
// ---------------------------------------------------------------------------

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded,
                size: 56, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Create Job Bottom Sheet
// ---------------------------------------------------------------------------

class _CreateJobSheet extends ConsumerStatefulWidget {
  const _CreateJobSheet();

  @override
  ConsumerState<_CreateJobSheet> createState() => _CreateJobSheetState();
}

class _CreateJobSheetState extends ConsumerState<_CreateJobSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _skillsCtrl = TextEditingController();
  final _requirementsCtrl = TextEditingController();
  final _salaryMinCtrl = TextEditingController();
  final _salaryMaxCtrl = TextEditingController();

  String _selectedType = 'full-time';
  bool _isSubmitting = false;

  static const _types = [
    'full-time',
    'part-time',
    'internship',
    'remote',
    'contract',
  ];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _companyCtrl.dispose();
    _locationCtrl.dispose();
    _descCtrl.dispose();
    _skillsCtrl.dispose();
    _requirementsCtrl.dispose();
    _salaryMinCtrl.dispose();
    _salaryMaxCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      final skills = _skillsCtrl.text
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
      final requirements = _requirementsCtrl.text
          .split('\n')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();

      final data = <String, dynamic>{
        'title': _titleCtrl.text.trim(),
        'company': _companyCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
        'type': _selectedType,
        'description': _descCtrl.text.trim(),
        'skills': skills,
        'requirements': requirements,
        if (_salaryMinCtrl.text.isNotEmpty || _salaryMaxCtrl.text.isNotEmpty)
          'salary': {
            if (_salaryMinCtrl.text.isNotEmpty)
              'min': double.tryParse(_salaryMinCtrl.text),
            if (_salaryMaxCtrl.text.isNotEmpty)
              'max': double.tryParse(_salaryMaxCtrl.text),
            'currency': 'USD',
            'period': 'yearly',
          },
      };

      await ref.read(jobsProvider.notifier).createJob(data);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Job posted successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  Widget _field(
    String label,
    TextEditingController ctrl, {
    int maxLines = 1,
    String? hint,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        alignLabelWithHint: maxLines > 1,
      ),
      validator: validator,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollCtrl) {
          return Column(
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Post a Job', style: theme.textTheme.titleLarge),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(),
              Expanded(
                child: Form(
                  key: _formKey,
                  child: ListView(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    children: [
                      _field('Job Title *', _titleCtrl,
                          validator: (v) =>
                              v!.trim().isEmpty ? 'Required' : null),
                      const SizedBox(height: 14),
                      _field('Company *', _companyCtrl,
                          validator: (v) =>
                              v!.trim().isEmpty ? 'Required' : null),
                      const SizedBox(height: 14),
                      _field('Location *', _locationCtrl,
                          validator: (v) =>
                              v!.trim().isEmpty ? 'Required' : null),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _selectedType,
                        decoration: const InputDecoration(labelText: 'Job Type *'),
                        items: _types
                            .map((t) => DropdownMenuItem(
                                  value: t,
                                  child: Text(_capitalize(t)),
                                ))
                            .toList(),
                        onChanged: (v) =>
                            setState(() => _selectedType = v ?? _selectedType),
                      ),
                      const SizedBox(height: 14),
                      _field('Description *', _descCtrl,
                          maxLines: 4,
                          validator: (v) =>
                              v!.trim().isEmpty ? 'Required' : null),
                      const SizedBox(height: 14),
                      _field('Skills (comma-separated)', _skillsCtrl,
                          hint: 'Flutter, Dart, Firebase'),
                      const SizedBox(height: 14),
                      _field('Requirements (one per line)', _requirementsCtrl,
                          maxLines: 3,
                          hint: '3+ years of experience'),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _field('Min Salary (USD)', _salaryMinCtrl,
                                keyboardType: TextInputType.number),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _field('Max Salary (USD)', _salaryMaxCtrl,
                                keyboardType: TextInputType.number),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: _isSubmitting ? null : _submit,
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Post Job'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
