import 'package:intl/intl.dart';

class AppDateUtils {
  AppDateUtils._();

  /// Returns a human-readable "time ago" string, e.g. "2 hours ago".
  static String timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inSeconds < 60) {
      return diff.inSeconds <= 1 ? 'just now' : '${diff.inSeconds} seconds ago';
    } else if (diff.inMinutes < 60) {
      return diff.inMinutes == 1
          ? '1 minute ago'
          : '${diff.inMinutes} minutes ago';
    } else if (diff.inHours < 24) {
      return diff.inHours == 1 ? '1 hour ago' : '${diff.inHours} hours ago';
    } else if (diff.inDays < 7) {
      return diff.inDays == 1 ? 'yesterday' : '${diff.inDays} days ago';
    } else if (diff.inDays < 30) {
      final weeks = (diff.inDays / 7).floor();
      return weeks == 1 ? '1 week ago' : '$weeks weeks ago';
    } else if (diff.inDays < 365) {
      final months = (diff.inDays / 30).floor();
      return months == 1 ? '1 month ago' : '$months months ago';
    } else {
      final years = (diff.inDays / 365).floor();
      return years == 1 ? '1 year ago' : '$years years ago';
    }
  }

  /// Returns a formatted date string, e.g. "Mar 10, 2026".
  static String formatDate(DateTime dateTime) {
    return DateFormat('MMM d, y').format(dateTime);
  }

  /// Returns a formatted date range, e.g. "Mar 10 – Mar 15, 2026".
  /// If both dates fall in the same month and year the month is omitted on the
  /// end date: "Mar 10 – 15, 2026".
  static String formatDateRange(DateTime start, DateTime end) {
    final sameYear = start.year == end.year;
    final sameMonth = sameYear && start.month == end.month;

    if (sameMonth) {
      return '${DateFormat('MMM d').format(start)} – ${DateFormat('d, y').format(end)}';
    } else if (sameYear) {
      return '${DateFormat('MMM d').format(start)} – ${DateFormat('MMM d, y').format(end)}';
    } else {
      return '${DateFormat('MMM d, y').format(start)} – ${DateFormat('MMM d, y').format(end)}';
    }
  }

  /// Returns a human-friendly event date string, e.g. "Mon, Mar 10 · 2:00 PM".
  static String formatEventDate(DateTime start, DateTime end) {
    final datePart = DateFormat('EEE, MMM d').format(start);
    final timePart = DateFormat('h:mm a').format(start);
    final endTimePart = DateFormat('h:mm a').format(end);
    return '$datePart · $timePart – $endTimePart';
  }

  /// Returns true if [dateTime] is today (local time).
  static bool isToday(DateTime dateTime) {
    final now = DateTime.now();
    return dateTime.year == now.year &&
        dateTime.month == now.month &&
        dateTime.day == now.day;
  }

  /// Returns true if [dateTime] is tomorrow (local time).
  static bool isTomorrow(DateTime dateTime) {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return dateTime.year == tomorrow.year &&
        dateTime.month == tomorrow.month &&
        dateTime.day == tomorrow.day;
  }
}
