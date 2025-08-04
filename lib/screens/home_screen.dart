import 'package:flutter/material.dart';
import 'package:nikitos/models/applet.dart';
import 'package:nikitos/services/applets_service.dart';
import 'package:nikitos/services/metadata_service.dart';
import 'package:nikitos/services/applet_execution_service.dart';
import 'package:nikitos/screens/prototype_chat_screen.dart';
import 'package:nikitos/screens/app_chat_screen.dart';
import 'package:nikitos/components/applets_grid.dart';
import 'package:nikitos/components/applet_creation_form.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final AppletsService _appletsService = AppletsService();
  final MetadataService _metadataService = MetadataService();
  final TextEditingController _textEditingController = TextEditingController();

  List<Applet> _applets = [];
  bool _isLoading = false;
  Set<String> _runningApplets = {}; // Track which applets are currently being opened
  String _selectedType = 'auto';
  String _selectedPlatform = 'auto';

  @override
  void initState() {
    super.initState();
    _loadApplets();
  }

  Future<void> _loadApplets() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });
    final applets = await _appletsService.getApplets();
    if (!mounted) return;
    setState(() {
      _applets = applets;
      _isLoading = false;
    });
  }

  Future<void> _createApplet() async {
    final userInput = _textEditingController.text;
    if (userInput.isEmpty) {
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoading = true;
    });

    try {
      final applet = await _metadataService.createApplet(
        userInput,
        type: _selectedType != 'auto' ? _selectedType : null,
        platform: _selectedPlatform != 'auto' ? _selectedPlatform : null,
      );
      if (applet.metadata.type == 'prototype') {
        // Navigate to chat screen immediately to show streaming
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          _textEditingController.clear();
          Navigator.of(context)
              .push(
            MaterialPageRoute(
              builder: (context) => PrototypeChatScreen(
                applet: applet,
                autoGenerateOnOpen: true,
                initialUserInput: userInput,
              ),
            ),
          )
              .then((_) {
            // Refresh applets list when coming back from chat screen
            _loadApplets();
          });
          return;
        }
      } else if (applet.metadata.type == 'app') {
        // Navigate to app chat screen immediately to show streaming
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          _textEditingController.clear();
          Navigator.of(context)
              .push(
            MaterialPageRoute(
              builder: (context) => AppChatScreen(
                applet: applet,
                autoGenerateOnOpen: true,
                initialUserInput: userInput,
              ),
            ),
          )
              .then((_) {
            // Refresh applets list when coming back from chat screen
            _loadApplets();
          });
          return;
        }
      }
      if (!mounted) return;
      _textEditingController.clear();
      await _loadApplets();
    } catch (e) {
      print('Error creating applet: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _openApplet(Applet applet) async {
    setState(() {
      _runningApplets.add(applet.id);
    });

    try {
      await AppletExecutionService.openApplet(applet, context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error opening applet: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _runningApplets.remove(applet.id);
        });
      }
    }
  }

  Future<void> _openAppletFolder(Applet applet) async {
    await AppletExecutionService.openAppletFolder(applet, context);
  }

  Future<void> _deleteApplet(Applet applet) async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Applet'),
        content:
            Text('Are you sure you want to delete "${applet.metadata.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        _isLoading = true;
      });

      try {
        await _appletsService.deleteApplet(applet.id);
        await _loadApplets();
      } catch (e) {
        print('Error deleting applet: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete applet: $e')),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  Future<void> _editApplet(Applet applet) async {
    if (applet.metadata.type == 'prototype') {
      if (mounted) {
        Navigator.of(context)
            .push(
          MaterialPageRoute(
            builder: (context) => PrototypeChatScreen(applet: applet),
          ),
        )
            .then((_) {
          // Refresh applets list when coming back from chat screen
          _loadApplets();
        });
      }
    } else if (applet.metadata.type == 'app') {
      if (mounted) {
        Navigator.of(context)
            .push(
          MaterialPageRoute(
            builder: (context) => AppChatScreen(applet: applet),
          ),
        )
            .then((_) {
          // Refresh applets list when coming back from chat screen
          _loadApplets();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7), // iOS-like background
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: AppletsGrid(
                    applets: _applets,
                    runningApplets: _runningApplets,
                    onOpenApplet: _openApplet,
                    onDeleteApplet: _deleteApplet,
                    onEditApplet: _editApplet,
                    onOpenFolder: _openAppletFolder,
                  ),
                ),
                AppletCreationForm(
                  textEditingController: _textEditingController,
                  selectedType: _selectedType,
                  selectedPlatform: _selectedPlatform,
                  isLoading: _isLoading,
                  onTypeChanged: (value) =>
                      setState(() => _selectedType = value),
                  onPlatformChanged: (value) =>
                      setState(() => _selectedPlatform = value),
                  onCreateApplet: _createApplet,
                ),
              ],
            ),
    );
  }
}
