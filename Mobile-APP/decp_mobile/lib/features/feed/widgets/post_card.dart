import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/models/post.dart';
import '../../../shared/utils/date_utils.dart';
import '../../../shared/widgets/avatar_widget.dart';
import '../providers/feed_provider.dart';

// ---------------------------------------------------------------------------
// Role badge helpers
// ---------------------------------------------------------------------------

Color _roleBadgeColor(String role) {
  switch (role.toLowerCase()) {
    case 'alumni':
      return const Color(0xFF0D9488); // teal
    case 'faculty':
      return const Color(0xFFEA580C); // orange
    case 'admin':
      return const Color(0xFF7C3AED); // violet
    case 'student':
    default:
      return const Color(0xFF4F46E5); // indigo
  }
}

String _roleLabel(String role) {
  switch (role.toLowerCase()) {
    case 'alumni':
      return 'Alumni';
    case 'faculty':
      return 'Faculty';
    case 'admin':
      return 'Admin';
    case 'student':
    default:
      return 'Student';
  }
}

// ---------------------------------------------------------------------------
// PostCard
// ---------------------------------------------------------------------------

class PostCard extends ConsumerStatefulWidget {
  final Post post;

  const PostCard({super.key, required this.post});

  @override
  ConsumerState<PostCard> createState() => _PostCardState();
}

class _PostCardState extends ConsumerState<PostCard> {
  bool _expanded = false;
  static const int _maxLines = 3;

  void _toggleLike() {
    final post = widget.post;
    if (post.isLiked) {
      ref.read(feedProvider.notifier).unlikePost(post.id);
    } else {
      ref.read(feedProvider.notifier).likePost(post.id);
    }
  }

  void _toggleBookmark() {
    ref.read(feedProvider.notifier).bookmarkPost(widget.post.id);
  }

  void _onShare() {
    Share.share(
      'Check out this post on DECP: "${widget.post.content}"',
      subject: 'Post by ${widget.post.author.fullName}',
    );
  }

  void _onCommentTap(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CommentSheet(post: widget.post),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Mirror the current state from the provider so optimistic updates reflect.
    final feedState = ref.watch(feedProvider);
    final post = feedState.posts.firstWhere(
      (p) => p.id == widget.post.id,
      orElse: () => widget.post,
    );

    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    final authorInitials = () {
      final f =
          post.author.firstName.isNotEmpty ? post.author.firstName[0] : '';
      final l = post.author.lastName.isNotEmpty ? post.author.lastName[0] : '';
      return '${f.toUpperCase()}${l.toUpperCase()}';
    }();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      elevation: 1.5,
      shadowColor: cs.shadow.withOpacity(0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ----------------------------------------------------------------
            // Header: avatar + name + role badge + time
            // ----------------------------------------------------------------
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AvatarWidget(
                  imageUrl: post.author.avatar,
                  initials: authorInitials,
                  radius: 22,
                  onTap: () => context.push('/profile/${post.author.id}'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: () =>
                            context.push('/profile/${post.author.id}'),
                        child: Text(
                          post.author.fullName,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          _RoleBadge(role: post.author.role),
                          const SizedBox(width: 8),
                          Text(
                            AppDateUtils.timeAgo(post.createdAt),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _showPostMenu(context),
                  icon: const Icon(Icons.more_horiz),
                  iconSize: 20,
                  splashRadius: 18,
                  color: cs.onSurfaceVariant,
                ),
              ],
            ),

            const SizedBox(height: 12),

            // ----------------------------------------------------------------
            // Content text
            // ----------------------------------------------------------------
            if (post.content.isNotEmpty)
              _ExpandableText(
                text: post.content,
                maxLines: _maxLines,
                expanded: _expanded,
                onToggle: () => setState(() => _expanded = !_expanded),
              ),

            // ----------------------------------------------------------------
            // Media images
            // ----------------------------------------------------------------
            if (post.mediaUrls.isNotEmpty) ...[
              const SizedBox(height: 10),
              _MediaGrid(mediaUrls: post.mediaUrls),
            ],

            // ----------------------------------------------------------------
            // Poll options
            // ----------------------------------------------------------------
            if (post.pollOptions != null &&
                post.pollOptions!.isNotEmpty) ...[
              const SizedBox(height: 10),
              _PollView(options: post.pollOptions!),
            ],

            const SizedBox(height: 12),
            const Divider(height: 1, thickness: 0.5),
            const SizedBox(height: 8),

            // ----------------------------------------------------------------
            // Action bar
            // ----------------------------------------------------------------
            Row(
              children: [
                // Like button
                _ActionButton(
                  icon: post.isLiked
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                  iconColor: post.isLiked
                      ? const Color(0xFFEF4444)
                      : cs.onSurfaceVariant,
                  label: post.likes > 0 ? _formatCount(post.likes) : '',
                  onTap: _toggleLike,
                ),
                const SizedBox(width: 4),

                // Comment button
                _ActionButton(
                  icon: Icons.chat_bubble_outline_rounded,
                  iconColor: cs.onSurfaceVariant,
                  label:
                      post.comments > 0 ? _formatCount(post.comments) : '',
                  onTap: () => _onCommentTap(context),
                ),
                const SizedBox(width: 4),

                // Share button
                _ActionButton(
                  icon: Icons.share_outlined,
                  iconColor: cs.onSurfaceVariant,
                  label: post.shares > 0 ? _formatCount(post.shares) : '',
                  onTap: _onShare,
                ),

                const Spacer(),

                // Bookmark button
                IconButton(
                  onPressed: _toggleBookmark,
                  icon: Icon(
                    post.isBookmarked
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_border_rounded,
                    size: 22,
                    color: post.isBookmarked
                        ? cs.primary
                        : cs.onSurfaceVariant,
                  ),
                  splashRadius: 18,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  void _showPostMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share_outlined),
              title: const Text('Share'),
              onTap: () {
                Navigator.pop(context);
                _onShare();
              },
            ),
            ListTile(
              leading: const Icon(Icons.flag_outlined),
              title: const Text('Report post'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.block_outlined),
              title: const Text('Hide post'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Role Badge
// ---------------------------------------------------------------------------

class _RoleBadge extends StatelessWidget {
  final String role;

  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    final color = _roleBadgeColor(role);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3), width: 0.8),
      ),
      child: Text(
        _roleLabel(role),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Expandable text
// ---------------------------------------------------------------------------

class _ExpandableText extends StatelessWidget {
  final String text;
  final int maxLines;
  final bool expanded;
  final VoidCallback onToggle;

  const _ExpandableText({
    required this.text,
    required this.maxLines,
    required this.expanded,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textStyle = theme.textTheme.bodyMedium?.copyWith(
      height: 1.55,
      color: theme.colorScheme.onSurface,
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final textPainter = TextPainter(
          text: TextSpan(text: text, style: textStyle),
          maxLines: maxLines,
          textDirection: TextDirection.ltr,
        )..layout(maxWidth: constraints.maxWidth);

        final isOverflowing = textPainter.didExceedMaxLines;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              text,
              style: textStyle,
              maxLines: expanded ? null : maxLines,
              overflow: expanded ? null : TextOverflow.ellipsis,
            ),
            if (isOverflowing)
              GestureDetector(
                onTap: onToggle,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    expanded ? 'Show less' : 'Show more',
                    style: TextStyle(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Media grid
// ---------------------------------------------------------------------------

class _MediaGrid extends StatelessWidget {
  final List<String> mediaUrls;

  const _MediaGrid({required this.mediaUrls});

  @override
  Widget build(BuildContext context) {
    final count = mediaUrls.length.clamp(1, 4);

    if (count == 1) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: CachedNetworkImage(
          imageUrl: mediaUrls[0],
          height: 220,
          width: double.infinity,
          fit: BoxFit.cover,
          errorWidget: (_, __, ___) => _errorPlaceholder(),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: count == 2 ? 2 : 2,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
        childAspectRatio: count == 2 ? 1.2 : 1,
      ),
      itemBuilder: (_, i) {
        final isLast = i == count - 1 && mediaUrls.length > 4;
        return Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: mediaUrls[i],
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => _errorPlaceholder(),
              ),
            ),
            if (isLast)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  color: Colors.black54,
                  child: Center(
                    child: Text(
                      '+${mediaUrls.length - 4}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _errorPlaceholder() {
    return Container(
      color: const Color(0xFFE5E7EB),
      child: const Icon(Icons.image_not_supported_outlined,
          color: Color(0xFF9CA3AF)),
    );
  }
}

// ---------------------------------------------------------------------------
// Poll view
// ---------------------------------------------------------------------------

class _PollView extends StatelessWidget {
  final List<PollOption> options;

  const _PollView({required this.options});

  @override
  Widget build(BuildContext context) {
    final totalVotes =
        options.fold<int>(0, (sum, o) => sum + o.voteCount);
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: options.map((option) {
        final pct = totalVotes > 0 ? option.voteCount / totalVotes : 0.0;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(option.text,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(fontWeight: FontWeight.w500)),
                  Text('${(pct * 100).toStringAsFixed(0)}%',
                      style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant)),
                ],
              ),
              const SizedBox(height: 4),
              LinearProgressIndicator(
                value: pct,
                minHeight: 6,
                borderRadius: BorderRadius.circular(4),
                backgroundColor:
                    theme.colorScheme.primaryContainer.withOpacity(0.3),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String label;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    this.iconColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: iconColor),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 4),
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: iconColor ?? theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Comment bottom sheet
// ---------------------------------------------------------------------------

class _CommentSheet extends ConsumerStatefulWidget {
  final Post post;

  const _CommentSheet({required this.post});

  @override
  ConsumerState<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends ConsumerState<_CommentSheet> {
  final _controller = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _sendComment() async {
    final content = _controller.text.trim();
    if (content.isEmpty) return;

    setState(() => _isSending = true);

    try {
      await ref
          .read(feedProvider.notifier)
          .addComment(widget.post.id, content);
      _controller.clear();
    } catch (_) {
      // Error handled silently; user can retry
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final feedState = ref.watch(feedProvider);
    final post = feedState.posts.firstWhere(
      (p) => p.id == widget.post.id,
      orElse: () => widget.post,
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.scaffoldBackgroundColor,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Text(
                      'Comments (${post.comments})',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      iconSize: 20,
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: post.comments == 0
                    ? Center(
                        child: Text(
                          'Be the first to comment!',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      )
                    : ListView(
                        controller: scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        children: const [],
                      ),
              ),
              // Comment input
              SafeArea(
                child: Padding(
                  padding: EdgeInsets.only(
                    left: 12,
                    right: 12,
                    top: 8,
                    bottom: MediaQuery.of(context).viewInsets.bottom + 8,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          maxLines: null,
                          textCapitalization:
                              TextCapitalization.sentences,
                          decoration: InputDecoration(
                            hintText: 'Write a comment...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: cs.surfaceContainerHighest,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 10),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _isSending
                          ? const SizedBox(
                              width: 36,
                              height: 36,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2),
                            )
                          : IconButton.filled(
                              onPressed: _sendComment,
                              icon: const Icon(Icons.send_rounded, size: 18),
                              style: IconButton.styleFrom(
                                backgroundColor: cs.primary,
                                foregroundColor: cs.onPrimary,
                              ),
                            ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
