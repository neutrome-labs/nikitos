import 'dart:io';
import 'package:cli_script/cli_script.dart';
import 'package:flutter/material.dart';
import 'package:nikitos/models/applet.dart';
import 'package:nikitos/services/window_service.dart';
import 'package:url_launcher/url_launcher.dart';

class AppletExecutionService {
  static Future<void> openApplet(Applet applet, BuildContext context) async {
    if (applet.metadata.type == 'prototype') {
      await _openPrototype(applet, context);
    } else if (applet.metadata.type == 'app') {
      await _runApp(applet, context);
    }
  }

  static Future<void> _openPrototype(
      Applet applet, BuildContext context) async {
    if (applet.metadata.platform == 'evc') {
      // Open EVC prototype in a new window with recommended dimensions
      await WindowService.openEvcPrototypeInNewWindow(applet);
    } else {
      // Open web prototype in browser
      final htmlFile = File('${applet.path}/index.html');

      if (!htmlFile.existsSync()) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('HTML file not found: ${applet.path}/index.html')),
        );
        return;
      }

      final uri = Uri.file(htmlFile.absolute.path);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open file in browser')),
          );
        }
      }
    }
  }

  static Future<void> _runApp(Applet applet, BuildContext context) async {
    final appDirectory = Directory(applet.path);

    if (!appDirectory.existsSync()) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('App directory not found: ${applet.path}')),
        );
      }
      return;
    }

    try {
      if (Platform.isWindows) {
        if (!await check('cmd /c start.bat',
            workingDirectory: applet.path, runInShell: true)) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('start.bat not found in app directory')),
            );
          }
        }
      } else {
        if (!await check('bash ./start.sh',
            workingDirectory: applet.path, runInShell: true)) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('start.sh not found in app directory')),
            );
          }
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not run app: $e')),
        );
      }
    }
  }

  static Future<void> openAppletFolder(
      Applet applet, BuildContext context) async {
    final appDirectory = Directory(applet.path);

    if (!appDirectory.existsSync()) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('App directory not found: ${applet.path}')),
        );
      }
      return;
    }

    try {
      if (Platform.isWindows) {
        await Process.start(
          'explorer',
          [applet.path],
          runInShell: true,
          mode: ProcessStartMode.detached,
        );
      } else if (Platform.isMacOS) {
        await Process.start(
          'open',
          [applet.path],
          runInShell: true,
          mode: ProcessStartMode.detached,
        );
      } else if (Platform.isLinux) {
        await Process.start(
          'xdg-open',
          [applet.path],
          runInShell: true,
          mode: ProcessStartMode.detached,
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open folder: $e')),
        );
      }
    }
  }
}
