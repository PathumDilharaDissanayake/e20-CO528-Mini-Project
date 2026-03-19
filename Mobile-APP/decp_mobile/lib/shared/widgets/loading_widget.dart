import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

// ---------------------------------------------------------------------------
// LoadingWidget
// ---------------------------------------------------------------------------

class LoadingWidget extends StatelessWidget {
  final String? message;

  const LoadingWidget({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// PostSkeletonCard
// ---------------------------------------------------------------------------

class PostSkeletonCard extends StatelessWidget {
  const PostSkeletonCard({super.key});

  @override
  Widget build(BuildContext context) {
    final baseColor = Theme.of(context).brightness == Brightness.dark
        ? const Color(0xFF2D2D2D)
        : const Color(0xFFE0E0E0);
    final highlightColor = Theme.of(context).brightness == Brightness.dark
        ? const Color(0xFF3D3D3D)
        : const Color(0xFFF5F5F5);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Shimmer.fromColors(
          baseColor: baseColor,
          highlightColor: highlightColor,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row: avatar + name/role
              Row(
                children: [
                  const _ShimmerBox(width: 44, height: 44, isCircle: true),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        _ShimmerBox(width: 140, height: 13),
                        SizedBox(height: 6),
                        _ShimmerBox(width: 90, height: 11),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // Content lines
              const _ShimmerBox(width: double.infinity, height: 13),
              const SizedBox(height: 6),
              const _ShimmerBox(width: double.infinity, height: 13),
              const SizedBox(height: 6),
              const _ShimmerBox(width: 200, height: 13),
              const SizedBox(height: 16),
              // Action row
              Row(
                children: const [
                  _ShimmerBox(width: 56, height: 28),
                  SizedBox(width: 12),
                  _ShimmerBox(width: 56, height: 28),
                  SizedBox(width: 12),
                  _ShimmerBox(width: 56, height: 28),
                  Spacer(),
                  _ShimmerBox(width: 28, height: 28),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final bool isCircle;

  const _ShimmerBox({
    required this.width,
    required this.height,
    this.isCircle = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: isCircle
            ? BorderRadius.circular(height / 2)
            : BorderRadius.circular(6),
        shape: BoxShape.rectangle,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SkeletonList
// ---------------------------------------------------------------------------

class SkeletonList extends StatelessWidget {
  final int count;

  const SkeletonList({super.key, this.count = 4});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      itemBuilder: (_, __) => const PostSkeletonCard(),
    );
  }
}
