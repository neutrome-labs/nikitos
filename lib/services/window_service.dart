import 'package:nikitos/models/applet.dart';
import 'dart:io';

class WindowService {
  static Future<void> openEvcPrototypeInNewWindow(Applet applet) async {
    // Get recommended dimensions from metadata or use defaults
    final width = applet.metadata.recommendedWidth?.toDouble() ?? 800.0;
    final height = applet.metadata.recommendedHeight?.toDouble() ?? 600.0;

    // For true multi-window support, we need to launch a new process
    // This is a limitation of Flutter - we'll use a workaround by launching
    // the same app with special arguments to open just the prototype viewer

    final executable = Platform.resolvedExecutable;
    final arguments = [
      '--evc-prototype',
      '--applet-path=${applet.path}',
      '--applet-title=${applet.metadata.title}',
      '--window-width=${width.toInt()}',
      '--window-height=${height.toInt()}',
    ];

    try {
      await Process.start(executable, arguments,
          mode: ProcessStartMode.detached);
    } catch (e) {
      print('Failed to open new window: $e');
      // Fallback to dialog if process spawning fails
      // You could show an error message or use the dialog approach as fallback
    }
  }
}
