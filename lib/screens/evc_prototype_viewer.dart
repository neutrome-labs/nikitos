import 'package:flutter/material.dart';
import 'package:flutter_eval/flutter_eval.dart';
import 'package:nikitos/models/applet.dart';
import 'dart:io';

class EvcPrototypeViewer extends StatefulWidget {
  final Applet applet;

  const EvcPrototypeViewer({
    super.key,
    required this.applet,
  });

  @override
  State<EvcPrototypeViewer> createState() => _EvcPrototypeViewerState();
}

class _EvcPrototypeViewerState extends State<EvcPrototypeViewer> {
  String? _dartCode;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDartCode();
  }

  Future<void> _loadDartCode() async {
    try {
      final dartFile = File('${widget.applet.path}/index.dart');

      if (!dartFile.existsSync()) {
        setState(() {
          _error = 'Dart file not found: ${widget.applet.path}/index.dart';
          _isLoading = false;
        });
        return;
      }

      final code = await dartFile.readAsString();
      setState(() {
        _dartCode = code;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error loading Dart file: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Error',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _isLoading = true;
                            _error = null;
                          });
                          _loadDartCode();
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _dartCode != null
                  ? EvalWidget(
                      packages: {
                        'example': {
                          'main.dart': _dartCode!,
                        }
                      },
                      assetPath: '${widget.applet.path}/index.evc',
                      library: 'package:example/main.dart',
                      function: 'MyWidget.',
                      args: const [],
                    )
                  : const Center(
                      child: Text('No content available'),
                    ),
    );
  }
}
