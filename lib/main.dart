import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:nikitos/screens/home_screen.dart';
import 'package:nikitos/screens/evc_prototype_viewer.dart';
import 'package:nikitos/models/applet.dart';
import 'package:nikitos/models/metadata.dart';
import 'package:tray_manager/tray_manager.dart';
import 'package:window_manager/window_manager.dart';
import 'package:screen_retriever/screen_retriever.dart';
import 'dart:io';

void main(List<String> args) async {
  await dotenv.load(fileName: ".env");

  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();

  // Check if this is a prototype window launch
  final isPrototypeWindow = args.contains('--evc-prototype');

  if (isPrototypeWindow) {
    // Extract arguments for prototype window
    final appletPath = _getArgValue(args, '--applet-path') ?? '';
    final appletTitle = _getArgValue(args, '--applet-title') ?? 'EVC Prototype';
    final windowWidth =
        double.tryParse(_getArgValue(args, '--window-width') ?? '800') ?? 800;
    final windowHeight =
        double.tryParse(_getArgValue(args, '--window-height') ?? '600') ?? 600;

    WindowOptions windowOptions = WindowOptions(
      size: Size(windowWidth, windowHeight),
      center: true,
      backgroundColor: Colors.transparent,
      skipTaskbar: false,
      titleBarStyle: TitleBarStyle.normal,
      title: appletTitle,
    );

    await windowManager.waitUntilReadyToShow(windowOptions);
    await windowManager.show();
    await windowManager.focus();

    // Create a minimal applet object for the prototype viewer
    final metadata = Metadata(
      type: 'prototype',
      platform: 'evc',
      alpha: '',
      stack: null,
      title: appletTitle,
      description: '',
    );
    final applet = Applet(
      id: 'prototype-window',
      path: appletPath,
      metadata: metadata,
    );

    runApp(PrototypeWindowApp(applet: applet));
  } else {
    // Normal app launch
    WindowOptions windowOptions = const WindowOptions(
      size: Size(450, 700), // Tall and narrow like JetBrains Toolbox
      center: false,
      backgroundColor: Colors.transparent,
      skipTaskbar: false, // Show in taskbar
      titleBarStyle: TitleBarStyle.hidden, // Hide title bar and controls
      title: 'NikitOS',
    );

    await windowManager.waitUntilReadyToShow(windowOptions);

    runApp(const MyApp());
  }
}

String? _getArgValue(List<String> args, String key) {
  for (int i = 0; i < args.length; i++) {
    if (args[i].startsWith('$key=')) {
      return args[i].substring(key.length + 1);
    }
  }
  return null;
}

// Minimal app for prototype windows
class PrototypeWindowApp extends StatelessWidget {
  final Applet applet;

  const PrototypeWindowApp({super.key, required this.applet});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: applet.metadata.title,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: EvcPrototypeViewer(applet: applet),
      debugShowCheckedModeBanner: false,
    );
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WindowListener, TrayListener {
  @override
  void initState() {
    super.initState();
    trayManager.addListener(this);
    windowManager.addListener(this);
    _init();
  }

  @override
  void dispose() {
    trayManager.removeListener(this);
    windowManager.removeListener(this);
    super.dispose();
  }

  Future<void> _init() async {
    try {
      await trayManager.setIcon('assets/tray.png');
      await trayManager.setContextMenu(Menu(
        items: [
          MenuItem(
            key: 'show_main_window',
            label: 'Show',
          ),
          MenuItem.separator(),
          MenuItem(
            key: 'exit_app',
            label: 'Exit',
          ),
        ],
      ));
    } catch (e) {
      print('Error initializing system tray: $e');
      // If tray fails, keep the window visible as fallback
    }

    // await _logDisplayInfo();
    await _positionWindowNearTray();
  }

  @override
  void onTrayMenuItemClick(MenuItem menuItem) {
    if (menuItem.key == 'show_main_window') {
      _showWindow();
    } else if (menuItem.key == 'exit_app') {
      exit(0);
    }
  }

  void _showWindow() async {
    if (await windowManager.isVisible()) {
      print('Window is visible, hiding it');
      await windowManager.hide();
    } else {
      print('Window is hidden, showing it');
      // Always reposition to the current cursor display when showing
      await _positionWindowNearTray();
      await windowManager.show();
      await windowManager.focus();
    }
  }

  Future<void> _positionWindowNearTray() async {
    try {
      // Get the cursor position to determine which display to use
      Offset cursorPosition = await screenRetriever.getCursorScreenPoint();

      // Find the display containing the cursor
      Display targetDisplay = await getDisplayForPoint(cursorPosition);

      // Position the window on that display
      await positionWindowOnDisplay(targetDisplay);
    } catch (e) {
      print('Error positioning window with screen detection: $e');
      // Fallback positioning
      try {
        await windowManager.setSize(const Size(450, 700));
        await windowManager.setPosition(const Offset(100, 100));
      } catch (fallbackError) {
        print('Error in fallback positioning: $fallbackError');
        // Final fallback to center
        await windowManager.center();
      }
    }
  }

  Future<void> _logDisplayInfo() async {
    try {
      List<Display> allDisplays = await screenRetriever.getAllDisplays();
      Display primaryDisplay = await screenRetriever.getPrimaryDisplay();
      Offset cursorPosition = await screenRetriever.getCursorScreenPoint();

      print('=== Display Information ===');
      print(
          'Primary Display: ${primaryDisplay.size!.width}x${primaryDisplay.size!.height} at (${primaryDisplay.visiblePosition!.dx}, ${primaryDisplay.visiblePosition!.dy})');
      print('Cursor Position: (${cursorPosition.dx}, ${cursorPosition.dy})');
      print('Total Displays: ${allDisplays.length}');

      for (int i = 0; i < allDisplays.length; i++) {
        Display display = allDisplays[i];
        print(
            'Display $i: ${display.size!.width}x${display.size!.height} at (${display.visiblePosition!.dx}, ${display.visiblePosition!.dy}) - Scale: ${display.scaleFactor}');
      }
      print('=========================');
    } catch (e) {
      print('Error getting display info: $e');
    }
  }

  /// Get the display that contains the given point, or primary display as fallback
  Future<Display> getDisplayForPoint(Offset point) async {
    try {
      List<Display> allDisplays = await screenRetriever.getAllDisplays();

      // Check each display to see if it contains the point
      for (Display display in allDisplays) {
        final displayBounds = Rect.fromLTWH(
          display.visiblePosition!.dx,
          display.visiblePosition!.dy,
          display.visibleSize!.width,
          display.visibleSize!.height,
        );

        if (displayBounds.contains(point)) {
          return display;
        }
      }

      // Fallback to primary display if point is not in any display
      return await screenRetriever.getPrimaryDisplay();
    } catch (e) {
      print('Error getting display for point: $e');
      return await screenRetriever.getPrimaryDisplay();
    }
  }

  /// Position window in bottom-right corner of the specified display
  Future<void> positionWindowOnDisplay(Display display) async {
    const windowWidth = 450.0;
    const windowHeight = 700.0;
    const margin = 20.0;

    // Calculate position in bottom-right corner of the display
    final x = display.visiblePosition!.dx +
        display.visibleSize!.width -
        windowWidth -
        margin;
    final y = display.visiblePosition!.dy +
        display.visibleSize!.height -
        windowHeight -
        margin -
        30; // Adjust for taskbar height

    await windowManager.setSize(const Size(windowWidth, windowHeight));
    await windowManager.setPosition(Offset(x, y));

    print(
        'Positioned window on display ${display.size!.width}x${display.size!.height} at (${x.round()}, ${y.round()})');
  }

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: HomeScreen(),
    );
  }

  @override
  void onWindowClose() {
    windowManager.hide();
  }
}
