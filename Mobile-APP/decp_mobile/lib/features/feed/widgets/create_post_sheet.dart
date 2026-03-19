import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/avatar_widget.dart';
import '../providers/feed_provider.dart';

class CreatePostSheet extends ConsumerStatefulWidget {
  const CreatePostSheet({super.key});

  @override
  ConsumerState<CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends ConsumerState<CreatePostSheet> {
  final _contentController = TextEditingController();
  final _focusNode = FocusNode();
  String _selectedType = 'text';
  bool _isPosting = false;
  List<XFile> _selectedImages = [];

  static const int _maxChars = 500;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _contentController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  bool get _canPost =>
      _contentController.text.trim().isNotEmpty && !_isPosting;

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage(limit: 4);
    if (images.isNotEmpty) {
      setState(() {
        _selectedImages = images;
        _selectedType = 'image';
      });
    }
  }

  Future<void> _submitPost() async {
    final content = _contentController.text.trim();
    if (content.isEmpty) return;

    setState(() => _isPosting = true);

    try {
      await ref
          .read(feedProvider.notifier)
          .createPost(content, type: _selectedType);

      if (mounted) {
        Navigator.of(context).pop(true); // signal success
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
      if (mounted) setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final authState = ref.watch(authProvider);
    final user = authState.user;

    final initials = user != null
        ? '${user.firstName.isNotEmpty ? user.firstName[0] : ''}${user.lastName.isNotEmpty ? user.lastName[0] : ''}'
            .toUpperCase()
        : '?';

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
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
              // Drag handle
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // AppBar row
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    TextButton(
                      onPressed:
                          _isPosting ? null : () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    const Spacer(),
                    Text(
                      'Create Post',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const Spacer(),
                    FilledButton(
                      onPressed: _canPost ? _submitPost : null,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 8),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20)),
                      ),
                      child: _isPosting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Post'),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // User header
                      Row(
                        children: [
                          AvatarWidget(
                            imageUrl: user?.profilePicture,
                            initials: initials,
                            radius: 22,
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user?.fullName ?? 'You',
                                style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 2),
                              _VisibilityChip(),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Content field
                      ValueListenableBuilder(
                        valueListenable: _contentController,
                        builder: (context, value, _) {
                          return TextField(
                            controller: _contentController,
                            focusNode: _focusNode,
                            maxLines: null,
                            maxLength: _maxChars,
                            textCapitalization:
                                TextCapitalization.sentences,
                            style: theme.textTheme.bodyLarge
                                ?.copyWith(height: 1.6),
                            decoration: InputDecoration(
                              hintText:
                                  "What's on your mind? Share an update, article, or resource...",
                              hintStyle: TextStyle(
                                color: cs.onSurfaceVariant.withOpacity(0.6),
                              ),
                              border: InputBorder.none,
                              counterStyle: TextStyle(
                                color: value.text.length >= _maxChars
                                    ? cs.error
                                    : cs.onSurfaceVariant,
                                fontSize: 12,
                              ),
                            ),
                          );
                        },
                      ),

                      // Selected images preview
                      if (_selectedImages.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _ImagePreviewRow(
                          images: _selectedImages,
                          onRemove: (index) {
                            setState(() {
                              _selectedImages.removeAt(index);
                              if (_selectedImages.isEmpty) {
                                _selectedType = 'text';
                              }
                            });
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Bottom toolbar
              const Divider(height: 1),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  child: Row(
                    children: [
                      // Post type chips
                      _TypeChip(
                        label: 'Text',
                        icon: Icons.text_fields_rounded,
                        selected: _selectedType == 'text',
                        onTap: () =>
                            setState(() => _selectedType = 'text'),
                      ),
                      const SizedBox(width: 8),
                      _TypeChip(
                        label: 'Image',
                        icon: Icons.image_outlined,
                        selected: _selectedType == 'image',
                        onTap: _pickImages,
                      ),
                      const SizedBox(width: 8),
                      _TypeChip(
                        label: 'Poll',
                        icon: Icons.poll_outlined,
                        selected: _selectedType == 'poll',
                        onTap: () =>
                            setState(() => _selectedType = 'poll'),
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

// ---------------------------------------------------------------------------
// Visibility chip
// ---------------------------------------------------------------------------

class _VisibilityChip extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          border: Border.all(
              color: Theme.of(context).colorScheme.outline, width: 0.8),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.public_rounded,
                size: 12,
                color: Theme.of(context).colorScheme.onSurfaceVariant),
            const SizedBox(width: 4),
            Text(
              'Everyone',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color:
                        Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(width: 2),
            Icon(Icons.arrow_drop_down,
                size: 14,
                color: Theme.of(context).colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Type chip
// ---------------------------------------------------------------------------

class _TypeChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _TypeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected
              ? cs.primaryContainer
              : cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 16,
                color: selected ? cs.onPrimaryContainer : cs.onSurfaceVariant),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.w400,
                color: selected
                    ? cs.onPrimaryContainer
                    : cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Image preview row
// ---------------------------------------------------------------------------

class _ImagePreviewRow extends StatelessWidget {
  final List<XFile> images;
  final void Function(int index) onRemove;

  const _ImagePreviewRow({required this.images, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 90,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        itemBuilder: (context, i) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    images[i].path,
                    width: 90,
                    height: 90,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 90,
                      height: 90,
                      color: Colors.grey[200],
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
                  ),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: GestureDetector(
                    onTap: () => onRemove(i),
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black54,
                        shape: BoxShape.circle,
                      ),
                      padding: const EdgeInsets.all(3),
                      child: const Icon(Icons.close,
                          size: 14, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
