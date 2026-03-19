import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'config/app_theme.dart';
import 'config/routes.dart';
import 'features/auth/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Theme provider — false = light mode (follows system), true = force dark mode
// ---------------------------------------------------------------------------
final themeProvider = StateProvider<bool>((ref) => false);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: DECPApp()));
}

// ---------------------------------------------------------------------------
// Root widget
// ---------------------------------------------------------------------------
class DECPApp extends ConsumerStatefulWidget {
  const DECPApp({super.key});

  @override
  ConsumerState<DECPApp> createState() => _DECPAppState();
}

class _DECPAppState extends ConsumerState<DECPApp> {
  @override
  void initState() {
    super.initState();
    // Restore session from secure storage on app start.
    // Uses addPostFrameCallback so all providers are mounted before the call.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authProvider.notifier).checkAuth();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final isDarkMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'DECP Platform',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.system,
      routerConfig: router,
    );
  }
}
