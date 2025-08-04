import 'dart:io';
import 'dart:convert';
import 'package:nikitos/models/chat.dart';
import 'package:nikitos/services/applets_service.dart';

class ChatService {
  final AppletsService _appletsService = AppletsService();

  Future<String> _getChatFilePath(String appletId) async {
    final appletPath = await _appletsService.getAppletPath(appletId);
    return '$appletPath/chat.json';
  }

  Future<ChatHistory> getChatHistory(String appletId) async {
    final chatFilePath = await _getChatFilePath(appletId);
    final chatFile = File(chatFilePath);
    if (!chatFile.existsSync()) {
      return ChatHistory(messages: []);
    }

    try {
      final content = await chatFile.readAsString();
      final json = jsonDecode(content);
      return ChatHistory.fromJson(json);
    } catch (e) {
      print('Error reading chat history: $e');
      return ChatHistory(messages: []);
    }
  }

  Future<void> saveChatHistory(String appletId, ChatHistory chatHistory) async {
    final chatFilePath = await _getChatFilePath(appletId);
    final chatFile = File(chatFilePath);

    // Ensure the directory exists
    await chatFile.parent.create(recursive: true);

    try {
      final json = jsonEncode(chatHistory.toJson());
      await chatFile.writeAsString(json);
    } catch (e) {
      print('Error saving chat history: $e');
      throw e;
    }
  }

  Future<void> addMessage(String appletId, ChatMessage message) async {
    final chatHistory = await getChatHistory(appletId);
    final updatedHistory = chatHistory.copyWith(
      messages: [...chatHistory.messages, message],
    );
    await saveChatHistory(appletId, updatedHistory);
  }

  Future<void> clearChatHistory(String appletId) async {
    final chatFilePath = await _getChatFilePath(appletId);
    final chatFile = File(chatFilePath);

    if (chatFile.existsSync()) {
      await chatFile.delete();
    }
  }
}
