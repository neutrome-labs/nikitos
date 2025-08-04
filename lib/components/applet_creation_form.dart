import 'package:flutter/material.dart';

class AppletCreationForm extends StatefulWidget {
  final TextEditingController textEditingController;
  final String selectedType;
  final String selectedPlatform;
  final bool isLoading;
  final Function(String) onTypeChanged;
  final Function(String) onPlatformChanged;
  final VoidCallback onCreateApplet;

  const AppletCreationForm({
    super.key,
    required this.textEditingController,
    required this.selectedType,
    required this.selectedPlatform,
    required this.isLoading,
    required this.onTypeChanged,
    required this.onPlatformChanged,
    required this.onCreateApplet,
  });

  @override
  State<AppletCreationForm> createState() => _AppletCreationFormState();
}

class _AppletCreationFormState extends State<AppletCreationForm> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Dropdowns row
          Row(
            children: [
              // Type dropdown
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: widget.selectedType,
                      isExpanded: true,
                      hint: const Text('Type'),
                      items: const [
                        DropdownMenuItem(
                          value: 'auto',
                          child: Text('Auto'),
                        ),
                        DropdownMenuItem(
                          value: 'prototype',
                          child: Text('Prototype'),
                        ),
                        DropdownMenuItem(
                          value: 'app',
                          child: Text('App'),
                        ),
                      ],
                      onChanged: (String? value) {
                        if (value != null) {
                          widget.onTypeChanged(value);
                        }
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Platform dropdown
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: widget.selectedPlatform,
                      isExpanded: true,
                      hint: const Text('Platform'),
                      items: const [
                        DropdownMenuItem(
                          value: 'auto',
                          child: Text('Auto'),
                        ),
                        DropdownMenuItem(
                          value: 'evc',
                          child: Text('EVC'),
                        ),
                        DropdownMenuItem(
                          value: 'web',
                          child: Text('Web'),
                        ),
                        DropdownMenuItem(
                          value: 'claudecode',
                          child: Text('Claude Code'),
                        ),
                      ],
                      onChanged: (String? value) {
                        if (value != null) {
                          widget.onPlatformChanged(value);
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Input field with send button
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: widget.textEditingController,
                    decoration: const InputDecoration(
                      hintText: 'Start creating a new applet...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      hintStyle: TextStyle(
                        color: Color(0xFF8E8E93),
                        fontSize: 16,
                      ),
                    ),
                    style: const TextStyle(fontSize: 16),
                    enabled: !widget.isLoading,
                  ),
                ),
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: widget.isLoading
                            ? const Color(0xFF8E8E93)
                            : const Color(0xFF007AFF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: widget.isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Icon(
                              Icons.send,
                              color: Colors.white,
                              size: 18,
                            ),
                    ),
                    onPressed: widget.isLoading ? null : widget.onCreateApplet,
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
