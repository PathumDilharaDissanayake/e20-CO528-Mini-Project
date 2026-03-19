import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/models/job.dart';
import '../../../shared/utils/date_utils.dart';
import '../providers/jobs_provider.dart';

class JobCard extends ConsumerWidget {
  final Job job;

  const JobCard({super.key, required this.job});

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  Color _typeColor(String type, ColorScheme cs) {
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
        return cs.primary;
    }
  }

  String _typeLabel(String type) {
    switch (type.toLowerCase()) {
      case 'full-time':
        return 'Full-time';
      case 'part-time':
        return 'Part-time';
      case 'internship':
        return 'Internship';
      case 'remote':
        return 'Remote';
      case 'contract':
        return 'Contract';
      default:
        return type;
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final applied = ref.watch(
      jobsProvider.select((s) => s.appliedJobIds.contains(job.id)),
    );
    final typeColor = _typeColor(job.type, cs);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/jobs/${job.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Company row
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: cs.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.business_rounded,
                        size: 22, color: cs.primary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      job.company,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: cs.onSurface.withOpacity(0.7),
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Applied badge or type chip
                  if (applied)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2E7D32).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: const Color(0xFF2E7D32), width: 1),
                      ),
                      child: const Text(
                        'Applied',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF2E7D32),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),

              // Job title
              Text(
                job.title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                ),
              ),
              const SizedBox(height: 6),

              // Location
              Row(
                children: [
                  Icon(Icons.place_rounded,
                      size: 14,
                      color: cs.onSurface.withOpacity(0.55)),
                  const SizedBox(width: 4),
                  Text(
                    job.location,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurface.withOpacity(0.65),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Type chip + salary
              Row(
                children: [
                  _TypeChip(label: _typeLabel(job.type), color: typeColor),
                  if (job.salary != null) ...[
                    const SizedBox(width: 8),
                    Row(
                      children: [
                        Icon(Icons.attach_money_rounded,
                            size: 14,
                            color: cs.onSurface.withOpacity(0.55)),
                        Text(
                          job.salary!.displayRange,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: cs.onSurface.withOpacity(0.75),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),

              // Skills chips
              if (job.skills.isNotEmpty) ...[
                const SizedBox(height: 10),
                _SkillsRow(skills: job.skills),
              ],

              const SizedBox(height: 10),
              const Divider(height: 1),
              const SizedBox(height: 10),

              // Footer: posted time + apply button
              Row(
                children: [
                  Icon(Icons.schedule_rounded,
                      size: 13,
                      color: cs.onSurface.withOpacity(0.5)),
                  const SizedBox(width: 4),
                  Text(
                    AppDateUtils.timeAgo(job.createdAt),
                    style: theme.textTheme.bodySmall,
                  ),
                  const Spacer(),
                  if (!applied)
                    SizedBox(
                      height: 32,
                      child: FilledButton(
                        onPressed: () => context.push('/jobs/${job.id}'),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          textStyle: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                          minimumSize: Size.zero,
                        ),
                        child: const Text('Apply'),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// _TypeChip
// ---------------------------------------------------------------------------

class _TypeChip extends StatelessWidget {
  final String label;
  final Color color;

  const _TypeChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4), width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// _SkillsRow
// ---------------------------------------------------------------------------

class _SkillsRow extends StatelessWidget {
  final List<String> skills;

  const _SkillsRow({required this.skills});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final visible = skills.take(3).toList();
    final extra = skills.length - visible.length;

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: [
        ...visible.map(
          (s) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: cs.surfaceVariant,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              s,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
                color: cs.onSurface.withOpacity(0.8),
                fontSize: 11,
              ),
            ),
          ),
        ),
        if (extra > 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '+$extra more',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: cs.primary,
                fontSize: 11,
              ),
            ),
          ),
      ],
    );
  }
}
