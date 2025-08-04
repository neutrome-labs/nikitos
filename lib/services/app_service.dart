import 'dart:io';
import 'dart:convert';

import 'package:async/async.dart';
import 'package:cli_script/cli_script.dart';
import 'package:nikitos/models/chat.dart';
import 'package:nikitos/services/applets_service.dart';
import 'package:nikitos/services/chat_service.dart';

class AppService {
  final AppletsService _appletsService = AppletsService();
  final ChatService _chatService = ChatService();

  Stream<String> _streamClaudeCommand(String appletPath, String prompt) async* {
    // Determine the correct claude executable based on platform
    final claudeExecutable = Platform.isWindows ? 'claude.cmd' : 'claude';

    final arguments = [
      '--dangerously-skip-permissions',
      '--output-format',
      'stream-json',
      '--verbose',
      '-p',
      prompt,
    ];

    try {
      print(
          'Running claude command: $claudeExecutable ${arguments.join(' ')} in $appletPath');

      final process = await Process.start(
        claudeExecutable,
        arguments,
        workingDirectory: appletPath,
        runInShell: true,
        mode: ProcessStartMode.detachedWithStdio,
      );

      process.stdin.close();

      // Listen to both stdout and stderr concurrently
      await for (final data in StreamGroup.merge([
        process.stdout.transform(utf8.decoder),
        process.stderr.transform(utf8.decoder).map((err) => 'ERROR: $err')
      ])) {
        if (data.isEmpty) continue;

        var text = "";
        if (data.startsWith("ERROR")) {
          text = data;
        }

        if (data.startsWith("{")) {
          final json = jsonDecode(data);
          if (json['message'] != null) {
            text = json['message']['content'][0]['text'] ?? '';
          } else if (json['error'] != null) {
            text = 'Error: ${json['error']['message']}';
          }
        }

        yield text;
      }
    } catch (e) {
      yield 'Error running claude: $e';
    }
  }

  Future _prepareFlutterApplet(String appletId) async {
    final appletPath = await _appletsService.getAppletPath(appletId);

    // Ensure the applet directory exists
    if (!Directory(appletPath).existsSync()) {
      Directory(appletPath).createSync(recursive: true);
    }

    final flutterExecutable = Platform.isWindows ? 'flutter.bat' : 'flutter';

    await run('$flutterExecutable create app', workingDirectory: appletPath);

    final startSh = File('$appletPath/start.sh');
    if (!await startSh.exists()) {
      await startSh.create();
    }
    await startSh.writeAsString('#!/bin/bash\ncd app\nflutter run -d linux');

    final startBat = File('$appletPath/start.bat');
    if (!await startBat.exists()) {
      await startBat.create();
    }
    await startBat.writeAsString('@echo off\ncd app\nflutter run -d windows');
  }

  // Stream app generation for UI
  Stream<String> streamAppGeneration(String appletId, String userInput) async* {
    final metadata = await _appletsService.getMetadata(appletId);
    final appletPath = await _appletsService.getAppletPath(appletId);

    final prompt =
        'update flutter app in app directory: ${metadata.title}. ${metadata.alpha}';

    switch (metadata.stack) {
      case 'flutter':
        await _prepareFlutterApplet(appletId);
        break;
    }

    yield* _streamClaudeCommand(appletPath, prompt);
  }

  // Stream app editing for UI
  Stream<String> streamEditApp(String appletId, String editRequest) async* {
    final appletPath = await _appletsService.getAppletPath(appletId);
    yield* _streamClaudeCommand(
        appletPath, 'update flutter app in app directory: $editRequest');
  }

  // Stream chat response for UI (doesn't modify files)
  Stream<String> streamChatResponse(
      String appletId, String userMessage) async* {
    final metadata = await _appletsService.getMetadata(appletId);
    final chatHistory = await _chatService.getChatHistory(appletId);
    final appletPath = await _appletsService.getAppletPath(appletId);

    // Build context from chat history
    var context = 'Previous conversation:\n';
    for (final message in chatHistory.messages.take(5)) {
      // Last 5 messages for context
      context += '${message.role}: ${message.content}\n';
    }

    final prompt =
        '''You are helping with a ${metadata.platform} application: ${metadata.title}

Description: ${metadata.description}

$context

User question: $userMessage

Please provide a helpful response about the application. Do not modify any files unless explicitly requested.''';

    yield* _streamClaudeCommand(appletPath, prompt);
  }

  // Save user message to chat history
  Future<void> saveUserMessage(String appletId, String message) async {
    final userMessage = ChatMessage(
      role: 'user',
      content: message,
      timestamp: DateTime.now(),
    );
    await _chatService.addMessage(appletId, userMessage);
  }

  // Save assistant message to chat history
  Future<void> saveAssistantMessage(String appletId, String message) async {
    final assistantMessage = ChatMessage(
      role: 'assistant',
      content: message,
      timestamp: DateTime.now(),
    );
    await _chatService.addMessage(appletId, assistantMessage);
  }
}
