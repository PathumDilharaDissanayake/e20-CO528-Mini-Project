// App configuration - base URLs and constants
// Android emulator: 10.0.2.2 maps to host machine localhost
// iOS simulator: localhost works directly

class AppConfig {
  // Change this to your machine's IP when testing on physical device
  // e.g., 'http://192.168.1.100:3000/api/v1'
  static const bool isAndroidEmulator = true;

  static String get _host => isAndroidEmulator ? '10.0.2.2' : 'localhost';

  static String get apiBaseUrl => 'http://$_host:3000/api/v1';
  static String get socketUrl => 'http://$_host:3007';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
  static const int defaultPageSize = 10;
  static const String appName = 'DECP Platform';
}
