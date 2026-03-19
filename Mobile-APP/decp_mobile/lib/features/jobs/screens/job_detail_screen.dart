import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/models/job.dart';
import '../../../shared/utils/date_utils.dart';
import '../providers/jobs_provider.dart';

// ---------------------------------------------------------------------------
// Provider: load a single job by ID
// ---------------------------------------------------------------------------

final _jobDetailProvider =
    FutureProvider.family<Job, String>((ref, jobId) async {
  final api = ref.read(apiClientProvider);
  final response = await api.get(ApiEndpoints.jobById(jobId));
  final body = response.data as Map<String, dynamic>;
  final jobJson = body['job'] as Map<String, dynamic>? ?? body;
  return Job.fromJson(jobJson);
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class JobDetailScreen extends ConsumerStatefulWidget {
  final String jobId;

  const JobDetailScreen({super.key, required this.jobId});

  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
  bool _isApplying = false;

  Color _typeColor(String type) {
    switch (type.toLowerCase()) {
      case 'full-time':
        return const Color(0xFF2E7D32);
      case 'part-time':
        return const Color(0xFF1565C0);
      case 'internship':
        return const Color(0xFFE65100);
      case 'remote':
        return const Color(0xFF6A1B9A);
      case 'contract':
        return const Color(0xFF00695C);
      default:
        return Colors.blueGrey;
    }
  }

  String _typeLabel(String type) {
    const map = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'internship': 'Internship',
      'remote': 'Remote',
      'contract': 'Contract',
    };
    return map[type.toLowerCase()] ?? type;
  }

  Future<void> _showApplyDialog(Job job) async {
    final coverLetterCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Apply to ${job.title}'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${job.company} · ${job.location}',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: coverLetterCtrl,
                maxLines: 5,
                decoration: const InputDecoration(
                  labelText: 'Cover Letter (optional)',
                  hintText:
                      'Tell the employer why you\'re a great fit…',
                  alignLabelWithHint: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Submit Application'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isApplying = true);
    try {
      await ref.read(jobsProvider.notifier).applyToJob(
            widget.jobId,
            coverLetter: coverLetterCtrl.text.trim().isNotEmpty
                ? coverLetterCtrl.text.trim()
                : null,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Application submitted successfully!')),
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
      if (mounted) setState(() => _isApplying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final asyncJob = ref.watch(_jobDetailProvider(widget.jobId));
    final isApplied = ref.watch(
      jobsProvider.select((s) => s.appliedJobIds.contains(widget.jobId)),
    );

    return Scaffold(
      body: asyncJob.when(
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
        error: (e, _) => Scaffold(
          appBar: AppBar(title: const Text('Job Details')),
          body: Center(
            child: Text('Failed to load job: $e',
                style: TextStyle(color: cs.error)),
          ),
        ),
        data: (job) {
          final typeColor = _typeColor(job.type);

          return Scaffold(
            appBar: AppBar(
              title: const Text('Job Details'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.share_rounded),
                  tooltip: 'Share',
                  onPressed: () {
                    Share.share(
                      '${job.title} at ${job.company}\n\nCheck out this job on DECP Platform!',
                      subject: job.title,
                    );
                  },
                ),
              ],
            ),
            body: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Company icon + name
                        Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: cs.primaryContainer,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(Icons.business_rounded,
                                  size: 28, color: cs.primary),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(job.company,
                                      style: theme.textTheme.titleMedium
                                          ?.copyWith(
                                              fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Icon(Icons.place_rounded,
                                          size: 14,
                                          color: cs.onSurface.withOpacity(0.6)),
                                      const SizedBox(width: 3),
                                      Text(job.location,
                                          style: theme.textTheme.bodySmall),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Title
                        Text(
                          job.title,
                          style: theme.textTheme.headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 12),

                        // Type chip + salary
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _TypeChip(
                                label: _typeLabel(job.type), color: typeColor),
                            if (job.salary != null)
                              _InfoChip(
                                icon: Icons.attach_money_rounded,
                                label: job.salary!.displayRange,
                              ),
                            if (job.expiresAt != null)
                              _InfoChip(
                                icon: Icons.event_rounded,
                                label:
                                    'Deadline: ${AppDateUtils.formatDate(job.expiresAt!)}',
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Posted ${AppDateUtils.timeAgo(job.createdAt)}',
                          style: theme.textTheme.bodySmall,
                        ),

                        const SizedBox(height: 24),
                        const Divider(),
                        const SizedBox(height: 16),

                        // Description
                        Text('About this role',
                            style: theme.textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Text(
                          job.description,
                          style: theme.textTheme.bodyMedium?.copyWith(
                              height: 1.6,
                              color: cs.onSurface.withOpacity(0.85)),
                        ),

                        // Requirements
                        if (job.requirements.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          Text('Requirements',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          ...job.requirements.map(
                            (r) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 3),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(Icons.check_circle_outline_rounded,
                                      size: 18, color: cs.primary),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(r,
                                        style: theme.textTheme.bodyMedium),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],

                        // Skills
                        if (job.skills.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          Text('Skills',
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: job.skills
                                .map(
                                  (s) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: cs.surfaceVariant,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(s,
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(
                                                fontWeight: FontWeight.w500)),
                                  ),
                                )
                                .toList(),
                          ),
                        ],

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            bottomNavigationBar: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 12),
                child: isApplied
                    ? Container(
                        height: 52,
                        decoration: BoxDecoration(
                          color: const Color(0xFF2E7D32).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: const Color(0xFF2E7D32), width: 1.5),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_rounded,
                                color: Color(0xFF2E7D32), size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Application Submitted',
                              style: TextStyle(
                                color: Color(0xFF2E7D32),
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                          ],
                        ),
                      )
                    : FilledButton(
                        onPressed: _isApplying
                            ? null
                            : () => _showApplyDialog(job),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(double.infinity, 52),
                        ),
                        child: _isApplying
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Apply Now',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600)),
                      ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Small helper widgets
// ---------------------------------------------------------------------------

class _TypeChip extends StatelessWidget {
  final String label;
  final Color color;

  const _TypeChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: cs.surfaceVariant,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: cs.onSurface.withOpacity(0.7)),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: cs.onSurface.withOpacity(0.85))),
        ],
      ),
    );
  }
}
