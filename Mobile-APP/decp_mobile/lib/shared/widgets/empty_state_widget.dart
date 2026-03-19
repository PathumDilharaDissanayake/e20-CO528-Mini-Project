import 'package:flutter/material.dart';

class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  /// Named constructor for an empty feed state.
  factory EmptyStateWidget.feed({VoidCallback? onAction}) {
    return EmptyStateWidget(
      icon: Icons.dynamic_feed_outlined,
      title: 'Your feed is empty',
      subtitle: 'Follow people or create a post to get started.',
      actionLabel: 'Create a Post',
      onAction: onAction,
    );
  }

  /// Named constructor for an empty jobs state.
  factory EmptyStateWidget.jobs({VoidCallback? onAction}) {
    return EmptyStateWidget(
      icon: Icons.work_outline,
      title: 'No jobs found',
      subtitle: 'Try adjusting your filters or check back later.',
      actionLabel: 'Clear Filters',
      onAction: onAction,
    );
  }

  /// Named constructor for an empty messages state.
  factory EmptyStateWidget.messages({VoidCallback? onAction}) {
    return EmptyStateWidget(
      icon: Icons.chat_bubble_outline,
      title: 'No messages yet',
      subtitle: 'Start a conversation with a connection.',
      actionLabel: 'Find People',
      onAction: onAction,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withOpacity(0.4),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 48,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 10),
              Text(
                subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 28),
              FilledButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.add, size: 18),
                label: Text(actionLabel!),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
