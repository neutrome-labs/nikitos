class ChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;

  ChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: json['role'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class ChatHistory {
  final List<ChatMessage> messages;

  ChatHistory({required this.messages});

  factory ChatHistory.fromJson(Map<String, dynamic> json) {
    return ChatHistory(
      messages: (json['messages'] as List)
          .map((msg) => ChatMessage.fromJson(msg))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'messages': messages.map((msg) => msg.toJson()).toList(),
    };
  }

  ChatHistory copyWith({List<ChatMessage>? messages}) {
    return ChatHistory(
      messages: messages ?? this.messages,
    );
  }
}
