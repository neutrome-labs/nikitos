import 'package:flutter/material.dart';
import 'package:nikitos/models/applet.dart';
import 'package:nikitos/models/chat.dart';
import 'package:nikitos/services/chat_service.dart';
import 'package:nikitos/services/app_service.dart';
import 'package:nikitos/services/applet_execution_service.dart';

class AppChatScreen extends StatefulWidget {
  final Applet applet;
  final bool autoGenerateOnOpen;
  final String? initialUserInput;

  const AppChatScreen({
    super.key,
    required this.applet,
    this.autoGenerateOnOpen = false,
    this.initialUserInput,
  });

  @override
  State<AppChatScreen> createState() => _AppChatScreenState();
}

class _AppChatScreenState extends State<AppChatScreen> {
  final ChatService _chatService = ChatService();
  final AppService _appService = AppService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessage> _messages = [];
  bool _isLoading = false;
  bool _isRunning = false; // Loading state for running the app
  String _streamingMessage = '';
  bool _isStreaming = false;

  @override
  void initState() {
    super.initState();

    _loadChatHistory();

    // Auto-generate app if requested
    if (widget.autoGenerateOnOpen && widget.initialUserInput != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _autoGenerateApp();
      });
    }
  }

  Future<void> _loadChatHistory() async {
    try {
      final chatHistory = await _chatService.getChatHistory(widget.applet.id);

      if (mounted) {
        setState(() {
          _messages = chatHistory.messages;
        });

        // Scroll to bottom after loading chat history
        if (_messages.isNotEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Future.delayed(const Duration(milliseconds: 100), () {
              if (mounted && _scrollController.hasClients) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
          });
        }
      }
    } catch (e) {
      print('Error loading chat history: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading chat history: $e')),
        );
      }
    }
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isStreaming) return;

    // Check if the message is a request to edit the app
    final isEditRequest = message.toLowerCase().contains('edit') ||
        message.toLowerCase().contains('change') ||
        message.toLowerCase().contains('modify') ||
        message.toLowerCase().contains('update') ||
        message.toLowerCase().contains('make') ||
        message.toLowerCase().contains('add') ||
        message.toLowerCase().contains('remove') ||
        message.toLowerCase().contains('fix') ||
        message.toLowerCase().contains('implement');

    if (isEditRequest) {
      await _applyEdit();
    } else {
      await _sendChatMessage();
    }
  }

  Future<void> _sendChatMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isStreaming) return;

    setState(() {
      _isStreaming = true;
      _streamingMessage = '';
    });

    // Add user message to UI
    final userMessage = ChatMessage(
      role: 'user',
      content: message,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
    });

    _messageController.clear();
    _scrollToBottom();

    try {
      // Save user message to history
      await _appService.saveUserMessage(widget.applet.id, message);

      // Stream AI response
      final stream = _appService.streamChatResponse(widget.applet.id, message);

      await for (final chunk in stream) {
        setState(() {
          _streamingMessage += chunk;
        });
        _scrollToBottom();
      }

      // Add completed assistant message
      final assistantMessage = ChatMessage(
        role: 'assistant',
        content: _streamingMessage,
        timestamp: DateTime.now(),
      );

      setState(() {
        _messages.add(assistantMessage);
        _streamingMessage = '';
        _isStreaming = false;
      });

      // Save assistant message to history
      await _appService.saveAssistantMessage(
          widget.applet.id, assistantMessage.content);
    } catch (e) {
      setState(() {
        _isStreaming = false;
        _streamingMessage = '';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error sending message: $e')),
        );
      }
    }

    _scrollToBottom();
  }

  Future<void> _applyEdit() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _isStreaming) return;

    setState(() {
      _isLoading = true;
      _isStreaming = true;
      _streamingMessage = '';
    });

    // Add user message to UI
    final userMessage = ChatMessage(
      role: 'user',
      content: message,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
    });

    _messageController.clear();
    _scrollToBottom();

    try {
      // Save user message to history
      await _appService.saveUserMessage(widget.applet.id, message);

      // Stream edit app generation
      final stream = _appService.streamEditApp(widget.applet.id, message);

      await for (final chunk in stream) {
        setState(() {
          _streamingMessage += chunk;
        });
        _scrollToBottom();
      }

      // Add confirmation message
      final assistantMessage = ChatMessage(
        role: 'assistant',
        content:
            'I\'ve updated the ${widget.applet.metadata.platform} application with your requested changes. You can check the files in the application directory to see the updates.',
        timestamp: DateTime.now(),
      );

      setState(() {
        _messages.add(assistantMessage);
        _streamingMessage = '';
        _isStreaming = false;
      });

      // Save assistant message to history
      await _appService.saveAssistantMessage(
          widget.applet.id, assistantMessage.content);
    } catch (e) {
      setState(() {
        _isStreaming = false;
        _streamingMessage = '';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating app: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }

    _scrollToBottom();
  }

  Future<void> _openApp() async {
    setState(() {
      _isRunning = true;
    });

    try {
      await AppletExecutionService.openApplet(widget.applet, context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error running applet: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isRunning = false;
        });
      }
    }
  }

  Future<void> _autoGenerateApp() async {
    final userInput = widget.initialUserInput!;

    setState(() {
      _isStreaming = true;
      _streamingMessage = '';
    });

    // Add user message to UI
    final userMessage = ChatMessage(
      role: 'user',
      content: userInput,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
    });

    _scrollToBottom();

    try {
      // Save user message to history
      await _appService.saveUserMessage(widget.applet.id, userInput);

      // Stream app generation
      final stream =
          _appService.streamAppGeneration(widget.applet.id, userInput);

      await for (final chunk in stream) {
        setState(() {
          _streamingMessage += chunk;
        });
        _scrollToBottom();
      }

      // Add completed assistant message
      final assistantMessage = ChatMessage(
        role: 'assistant',
        content: _streamingMessage,
        // 'I\'ve created your ${widget.applet.metadata.platform} application. You can now chat with me to make modifications or ask questions about the implementation.',
        timestamp: DateTime.now(),
      );

      setState(() {
        _messages.add(assistantMessage);
        _streamingMessage = '';
        _isStreaming = false;
      });

      // Save assistant message to history
      await _appService.saveAssistantMessage(
          widget.applet.id, assistantMessage.content);
    } catch (e) {
      setState(() {
        _isStreaming = false;
        _streamingMessage = '';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating app: $e')),
        );
      }
    }

    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        title: Text(widget.applet.metadata.title),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadChatHistory,
          ),
          IconButton(
            icon: _isRunning
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Icon(Icons.play_arrow),
            onPressed: _isRunning ? null : _openApp,
            tooltip: _isRunning ? 'Starting...' : 'Run App',
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages area - simple and clean
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isStreaming ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isStreaming) {
                  // Streaming message
                  return _MessageBubble(
                    message: ChatMessage(
                      role: 'assistant',
                      content: _streamingMessage.isEmpty
                          ? 'Processing your request...'
                          : _streamingMessage,
                      timestamp: DateTime.now(),
                    ),
                    isStreaming: true,
                  );
                }

                final message = _messages[index];
                return _MessageBubble(message: message);
              },
            ),
          ),

          // Simple input area
          Container(
            padding: const EdgeInsets.all(16),
            child: Container(
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
                      controller: _messageController,
                      decoration: const InputDecoration(
                        hintText: 'Ask or edit...',
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
                      maxLines: null,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    child: IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _isStreaming || _isLoading
                              ? Colors.grey
                              : const Color(0xFF007AFF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(
                                Icons.send,
                                color: Colors.white,
                                size: 18,
                              ),
                      ),
                      onPressed:
                          _isStreaming || _isLoading ? null : _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isStreaming;

  const _MessageBubble({
    required this.message,
    this.isStreaming = false,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor:
                  const Color(0xFFFF9500), // Orange for app assistant
              child: const Icon(
                Icons.apps,
                color: Colors.white,
                size: 16,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color:
                    isUser ? const Color(0xFF007AFF) : const Color(0xFFF2F2F7),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isStreaming && message.content.contains('ERROR:')
                        ? 'Error output:\n\n${message.content}'
                        : isStreaming && message.content.length > 500
                            ? 'Generating application...\n\n${message.content.length > 200 ? '...' : ''}${message.content.substring(message.content.length > 200 ? message.content.length - 200 : 0)}'
                            : message.content,
                    style: TextStyle(
                      color: isUser ? Colors.white : Colors.black87,
                      fontSize: 16,
                      fontFamily: isStreaming &&
                              (message.content.contains('ERROR:') ||
                                  message.content.length > 500)
                          ? 'monospace'
                          : null,
                    ),
                  ),
                  if (isStreaming)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      child: const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: const Color(0xFF34C759),
              child: const Icon(
                Icons.person,
                color: Colors.white,
                size: 16,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
