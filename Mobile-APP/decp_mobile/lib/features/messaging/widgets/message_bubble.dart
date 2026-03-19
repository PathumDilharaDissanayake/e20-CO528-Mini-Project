import 'package:flutter/material.dart';

import '../../../core/models/message.dart';
import '../../../shared/utils/date_utils.dart';
import '../../../shared/widgets/avatar_widget.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;
  final ConversationParticipant? sender;

  /// Set to true in group conversations to show sender name/avatar for others.
  final bool showSenderInfo;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    this.sender,
    this.showSenderInfo = false,
  });

  String _initials(ConversationParticipant p) {
    final f = p.firstName.isNotEmpty ? p.firstName[0] : '';
    final l = p.lastName.isNotEmpty ? p.lastName[0] : '';
    return '$f$l'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (message.isDeleted) {
      return _DeletedBubble(isMe: isMe);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            if (showSenderInfo && sender != null)
              Padding(
                padding: const EdgeInsets.only(right: 6, bottom: 2),
                child: AvatarWidget(
                  imageUrl: sender!.avatar,
                  initials: _initials(sender!),
                  radius: 16,
                ),
              )
            else
              const SizedBox(width: 38),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe && showSenderInfo && sender != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 2),
                    child: Text(
                      sender!.fullName,
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.primary,
                      ),
                    ),
                  ),
                _buildContent(context, colorScheme, theme),
                Padding(
                  padding:
                      const EdgeInsets.only(top: 2, left: 4, right: 4),
                  child: Text(
                    AppDateUtils.timeAgo(message.createdAt),
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontSize: 10,
                      color: colorScheme.onSurface.withOpacity(0.45),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (isMe) const SizedBox(width: 4),
        ],
      ),
    );
  }

  Widget _buildContent(
      BuildContext context, ColorScheme colorScheme, ThemeData theme) {
    final bgColor =
        isMe ? colorScheme.primary : colorScheme.surfaceVariant;
    final textColor =
        isMe ? colorScheme.onPrimary : colorScheme.onSurfaceVariant;

    final radius = BorderRadius.only(
      topLeft: const Radius.circular(18),
      topRight: const Radius.circular(18),
      bottomLeft:
          isMe ? const Radius.circular(18) : const Radius.circular(4),
      bottomRight:
          isMe ? const Radius.circular(4) : const Radius.circular(18),
    );

    Widget inner;
    switch (message.type) {
      case 'image':
        inner = _ImagePlaceholder(textColor: textColor);
        break;
      case 'file':
        inner = _FilePlaceholder(
            content: message.content, textColor: textColor, theme: theme);
        break;
      default:
        inner = Text(
          message.content,
          style: theme.textTheme.bodyMedium?.copyWith(color: textColor),
        );
    }

    return Container(
      constraints: const BoxConstraints(maxWidth: 280),
      padding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: inner,
    );
  }
}

class _DeletedBubble extends StatelessWidget {
  final bool isMe;

  const _DeletedBubble({required this.isMe});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: colorScheme.surfaceVariant.withOpacity(0.5),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                  color: colorScheme.outline.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.block,
                    size: 14,
                    color: colorScheme.onSurface.withOpacity(0.4)),
                const SizedBox(width: 6),
                Text(
                  'Deleted message',
                  style: TextStyle(
                    fontStyle: FontStyle.italic,
                    color: colorScheme.onSurface.withOpacity(0.4),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  final Color textColor;

  const _ImagePlaceholder({required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.image_outlined,
            size: 40, color: textColor.withOpacity(0.7)),
        const SizedBox(height: 4),
        Text('Image',
            style: TextStyle(
                fontSize: 12, color: textColor.withOpacity(0.7))),
      ],
    );
  }
}

class _FilePlaceholder extends StatelessWidget {
  final String content;
  final Color textColor;
  final ThemeData theme;

  const _FilePlaceholder(
      {required this.content,
      required this.textColor,
      required this.theme});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.attach_file,
            size: 20, color: textColor.withOpacity(0.8)),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            content.isNotEmpty ? content : 'File attachment',
            style: theme.textTheme.bodySmall?.copyWith(
              color: textColor,
              decoration: TextDecoration.underline,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
