import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class AvatarWidget extends StatelessWidget {
  final String? imageUrl;
  final String initials;
  final double radius;
  final VoidCallback? onTap;

  const AvatarWidget({
    super.key,
    this.imageUrl,
    required this.initials,
    this.radius = 24,
    this.onTap,
  });

  // 10 distinct background colors for initials avatars.
  static const List<Color> _bgColors = [
    Color(0xFF4F46E5), // indigo
    Color(0xFF0891B2), // cyan
    Color(0xFF059669), // emerald
    Color(0xFFD97706), // amber
    Color(0xFFDC2626), // red
    Color(0xFF7C3AED), // violet
    Color(0xFFDB2777), // pink
    Color(0xFF0284C7), // sky
    Color(0xFF16A34A), // green
    Color(0xFFEA580C), // orange
  ];

  Color _colorForInitials(String s) {
    if (s.isEmpty) return _bgColors[0];
    final code = s.codeUnits.fold<int>(0, (acc, c) => acc + c);
    return _bgColors[code % _bgColors.length];
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _colorForInitials(initials);
    final fontSize = radius * 0.55;

    Widget avatar;

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      avatar = CircleAvatar(
        radius: radius,
        backgroundColor: bgColor,
        child: ClipOval(
          child: CachedNetworkImage(
            imageUrl: imageUrl!,
            width: radius * 2,
            height: radius * 2,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => _initialsChild(bgColor, fontSize),
            placeholder: (_, __) => _initialsChild(bgColor, fontSize),
          ),
        ),
      );
    } else {
      avatar = CircleAvatar(
        radius: radius,
        backgroundColor: bgColor,
        child: _initialsChild(bgColor, fontSize),
      );
    }

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: avatar);
    }
    return avatar;
  }

  Widget _initialsChild(Color bg, double fontSize) {
    final displayText =
        initials.isNotEmpty ? initials.substring(0, initials.length > 2 ? 2 : initials.length).toUpperCase() : '?';
    return Text(
      displayText,
      style: TextStyle(
        color: Colors.white,
        fontSize: fontSize,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      ),
    );
  }
}
