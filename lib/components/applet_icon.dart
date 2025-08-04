import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:nikitos/models/applet.dart';

class AppletIcon extends StatefulWidget {
  final Applet applet;
  final bool isRunning;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  final VoidCallback onOpenFolder;

  const AppletIcon({
    super.key,
    required this.applet,
    this.isRunning = false,
    required this.onTap,
    required this.onDelete,
    required this.onEdit,
    required this.onOpenFolder,
  });

  @override
  State<AppletIcon> createState() => _AppletIconState();
}

class _AppletIconState extends State<AppletIcon> {
  bool _isHovered = false;

  String _truncateTitle(String title, int maxLength) {
    if (title.length <= maxLength) return title;
    return '${title.substring(0, maxLength)}...';
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHovered = !widget.isRunning),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: (TapDownDetails details) {
          // Don't handle taps when the applet is running
          if (widget.isRunning) return;
          
          // Check if shift key is pressed
          final isShiftPressed = RawKeyboard.instance.keysPressed
                  .contains(LogicalKeyboardKey.shiftLeft) ||
              RawKeyboard.instance.keysPressed
                  .contains(LogicalKeyboardKey.shiftRight);

          if (isShiftPressed) {
            widget.onOpenFolder();
          } else {
            widget.onTap();
          }
        },
        child: Stack(
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // App icon container
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: widget.isRunning
                          ? [
                              Colors.grey.withValues(alpha: 0.7),
                              Colors.grey.withValues(alpha: 0.5),
                            ]
                          : [
                              _getAppletColor(widget.applet.metadata.platform),
                              _getAppletColor(widget.applet.metadata.platform)
                                  .withValues(alpha: 0.7),
                            ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: widget.isRunning
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Icon(
                            _getAppletIcon(widget.applet.metadata.platform),
                            color: Colors.white,
                            size: 28,
                          ),
                  ),
                ),
                const SizedBox(height: 8),
                // App title
                SizedBox(
                  width: 80,
                  child: Text(
                    widget.isRunning 
                        ? 'Starting...'
                        : _truncateTitle(widget.applet.metadata.title, 20),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: widget.isRunning 
                          ? Colors.grey 
                          : Colors.black87,
                      height: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            // Edit and Delete buttons (visible on hover)
            if (_isHovered) ...[
              // Edit button
              Positioned(
                top: 0,
                right: 35,
                child: GestureDetector(
                  onTap: widget.onEdit,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white, width: 1),
                    ),
                    child: const Icon(
                      Icons.edit,
                      color: Colors.white,
                      size: 14,
                    ),
                  ),
                ),
              ),
              // Delete button
              Positioned(
                top: 0,
                right: 10,
                child: GestureDetector(
                  onTap: widget.onDelete,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white, width: 1),
                    ),
                    child: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 14,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getAppletColor(String platform) {
    switch (platform.toLowerCase()) {
      case 'web':
        return const Color(0xFF007AFF); // iOS blue
      case 'evc':
        return const Color(0xFF34C759); // iOS green
      case 'binary':
        return const Color(0xFFFF9500); // iOS orange
      case 'claudecode':
        return const Color(0xFFAF52DE); // iOS purple
      default:
        return const Color(0xFF8E8E93); // iOS gray
    }
  }

  IconData _getAppletIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'web':
        return Icons.web;
      case 'evc':
        return Icons.memory;
      case 'binary':
        return Icons.apps;
      case 'claudecode':
        return Icons.code;
      default:
        return Icons.help_outline;
    }
  }
}
