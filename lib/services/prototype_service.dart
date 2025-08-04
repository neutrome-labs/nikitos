import 'dart:io';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:nikitos/models/metadata.dart';
import 'package:nikitos/models/chat.dart';
import 'package:nikitos/services/ai_service.dart';
import 'package:nikitos/services/applets_service.dart';
import 'package:nikitos/services/chat_service.dart';

class PrototypeService {
  final String _prototypeModel = dotenv.env['AI_MODEL_PROTOTYPE']!;
  final AiService _aiService = AiService();
  final AppletsService _appletsService = AppletsService();
  final ChatService _chatService = ChatService();

  Stream<String> _streamPrototypeEvc(Metadata metadata, String userMessage,
      {bool isEdit = false}) async* {
    final systemPrompt = isEdit
        ? """You are a helpful assistant that creates Flutter widgets for flutter_eval. The user will provide a request, and you should generate a COMPLETE, FULL Dart file that fulfills the request, incorporating any edits or modifications requested.

**IMPORTANT: You must output the ENTIRE Dart file, not just changes or snippets.**

**Instructions:**

1.  **Dart Structure:** Create a complete, valid Dart file.
2.  **Import:** Always start with `import 'package:flutter/material.dart';`
3.  **Widget Class:** Create a StatelessWidget or StatefulWidget class named `MyWidget`.
4.  **Constructor:** The widget should have a simple constructor: `MyWidget();`
5.  **Build Method:** Implement the build method returning the widget tree.
6.  **Flutter Compatible:** The code must be compatible with flutter_eval and standard Flutter widgets.
7.  **Self-Contained:** No external dependencies beyond Flutter material.

**Example Request:** "create a red container with text"

**Example Response:**

import 'package:flutter/material.dart';

class MyWidget extends StatelessWidget {
  MyWidget();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(5.0),
      child: Column(
        children: [
          Container(
            color: Colors.red,
            child: Text('Hello World')
          )
        ],
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
      )
    );
  }
}

Now, I will await your request to generate a Flutter widget starting with import 'package:flutter/material.dart';"""
        : """You are a helpful assistant that creates Flutter widgets for flutter_eval. The user will provide a request, and you should generate a single Dart file that fulfills the request.

**Instructions:**

1.  **Dart Structure:** Create a complete, valid Dart file.
2.  **Import:** Always start with `import 'package:flutter/material.dart';`
3.  **Widget Class:** Create a StatelessWidget or StatefulWidget class named `MyWidget`.
4.  **Constructor:** The widget should have a simple constructor: `MyWidget();`
5.  **Build Method:** Implement the build method returning the widget tree.
6.  **Flutter Compatible:** The code must be compatible with flutter_eval and standard Flutter widgets.
7.  **Self-Contained:** No external dependencies beyond Flutter material.

**Example Request:** "create a calculator"

**Example Response:**

import 'package:flutter/material.dart';

class MyWidget extends StatefulWidget {
  MyWidget();

  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  String display = '';

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(16.0),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              display.isEmpty ? '0' : display,
              style: TextStyle(fontSize: 24),
            ),
          ),
          SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            children: [
              _buildButton('C', () => setState(() => display = '')),
              _buildButton('7', () => _addToDisplay('7')),
              _buildButton('8', () => _addToDisplay('8')),
              _buildButton('9', () => _addToDisplay('9')),
              // Add more buttons as needed
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildButton(String text, VoidCallback onPressed) {
    return Padding(
      padding: EdgeInsets.all(4),
      child: ElevatedButton(
        onPressed: onPressed,
        child: Text(text),
      ),
    );
  }

  void _addToDisplay(String value) {
    setState(() {
      display += value;
    });
  }
}

Now, I will await your request to generate a Flutter widget starting with import 'package:flutter/material.dart';""";

    final request = _aiService.getCompletionRequest(
        _prototypeModel,
        [
          {
            'role': 'system',
            'content': systemPrompt,
          },
          {
            'role': 'user',
            'content':
                'Create a Flutter widget ${metadata.title}: ${metadata.alpha}',
          },
          {
            'role': 'user',
            'content': userMessage,
          },
        ],
        true);

    yield* _aiService.streamCompletionResponse(request);
  }

  Stream<String> _streamPrototypeHtml(Metadata metadata, String userMessage,
      {bool isEdit = false}) async* {
    final systemPrompt = isEdit
        ? """You are a helpful assistant that creates self-contained HTML documents for a desktop panel. The user will provide a request, and you should generate a COMPLETE, FULL HTML file that fulfills the request, incorporating any edits or modifications requested.

**IMPORTANT: You must output the ENTIRE HTML file, not just changes or snippets.**

**Instructions:**

1.  **HTML Structure:** Create a complete, valid HTML5 document.
2.  **Styling:** Use the Tailwind CSS CDN for all styling. Do not use any other CSS or style tags.
    -   Include the Tailwind CSS script in the `<head>`: `<script src="https://cdn.tailwindcss.com"></script>`
3.  **Interactivity:** Use Alpine.js for any required interactivity. Do not use any other JavaScript libraries or inline `<script>` tags for custom logic, except for Alpine.js.
    -   Include the Alpine.js script in the `<head>`: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
4.  **Content:** The body of the HTML should contain the UI elements needed to fulfill the user's request.
5.  **Self-Contained:** The final output must be a single HTML file with no external dependencies other than the Tailwind and Alpine.js CDNs.
6. **Responsive and Desktop oriented:** The output HTML must be responsive and oriented for desktop usage (use wide divs if scenario prefers).

Output the complete HTML file starting with <!DOCTYPE html>"""
        : """You are a helpful assistant that creates self-contained HTML documents for a desktop panel. The user will provide a request, and you should generate a single HTML file that fulfills the request.

**Instructions:**

1.  **HTML Structure:** Create a complete, valid HTML5 document.
2.  **Styling:** Use the Tailwind CSS CDN for all styling. Do not use any other CSS or style tags.
    -   Include the Tailwind CSS script in the `<head>`: `<script src="https://cdn.tailwindcss.com"></script>`
3.  **Interactivity:** Use Alpine.js for any required interactivity. Do not use any other JavaScript libraries or inline `<script>` tags for custom logic, except for Alpine.js.
    -   Include the Alpine.js script in the `<head>`: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
4.  **Content:** The body of the HTML should contain the UI elements needed to fulfill the user's request.
5.  **Self-Contained:** The final output must be a single HTML file with no external dependencies other than the Tailwind and Alpine.js CDNs.
6. **Responsive and Desktop oriented:** The output HTML must be responsive and oriented for desktop usage (use wide divs if scenario prefers).

**Example Request:** "create a calculator"

**Example Response:**

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div x-data="{ display: '' }" class="bg-white p-4">
        <div class="bg-gray-200 p-2 rounded text-right text-2xl mb-4" x-text="display || '0'"></div>
        <div class="grid grid-cols-4 gap-2">
            <button @click="display = ''" class="bg-red-500 text-white p-4 rounded">C</button>
            <!-- ... other buttons ... -->
            <button @click="display += '1'" class="bg-gray-300 p-4 rounded">1</button>
            <button @click="display += '2'" class="bg-gray-300 p-4 rounded">2</button>
            <button @click="display += '3'" class="bg-gray-300 p-4 rounded">3</button>
            <button @click="display += '+'" class="bg-orange-500 text-white p-4 rounded">+</button>
            <!-- ... etc. ... -->
            <button @click="display = eval(display)" class="col-span-2 bg-blue-500 text-white p-4 rounded">=</button>
        </div>
    </div>
</body>
</html>

Now, I will await your request to generate a panel starting with <!DOCTYPE html>""";

    final request = _aiService.getCompletionRequest(
        _prototypeModel,
        [
          {
            'role': 'system',
            'content': systemPrompt,
          },
          {
            'role': 'user',
            'content': 'Create a webpage ${metadata.title}: ${metadata.alpha}',
          },
          {
            'role': 'user',
            'content': userMessage,
          },
        ],
        true);

    yield* _aiService.streamCompletionResponse(request);
  }

  // Stream chat response for UI (doesn't save to file)
  Stream<String> streamChatResponse(
      String appletId, String userMessage) async* {
    final metadata = await _appletsService.getMetadata(appletId);
    final chatHistory = await _chatService.getChatHistory(appletId);

    // Build messages including chat history
    final messages = <Map<String, dynamic>>[
      {
        'role': 'system',
        'content':
            """You are a helpful assistant that creates self-contained HTML documents for a desktop panel. You're helping the user iterate on their web application.

The user has a project titled "${metadata.title}" with description: "${metadata.description}".

Respond naturally to the user's questions and requests. When they ask about modifications, explain what changes you would make and how they would improve the application. Keep responses conversational and focused on their specific needs.""",
      },
    ];

    // Add chat history
    for (final message in chatHistory.messages) {
      messages.add({
        'role': message.role,
        'content': message.content,
      });
    }

    // Add new user message
    messages.add({
      'role': 'user',
      'content': userMessage,
    });

    final request =
        _aiService.getCompletionRequest(_prototypeModel, messages, true);

    yield* _aiService.streamCompletionResponse(request);
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

  // Stream prototype generation for UI (saves to file)
  Stream<String> streamPrototypeGeneration(
      String appletId, String userInput) async* {
    final metadata = await _appletsService.getMetadata(appletId);
    final appletPath = await _appletsService.getAppletPath(appletId);

    String indexPath;
    Stream<String> stream;

    if (metadata.platform == 'evc') {
      indexPath = '$appletPath/index.dart';
      stream = _streamPrototypeEvc(metadata, userInput);
    } else {
      indexPath = '$appletPath/index.html';
      stream = _streamPrototypeHtml(metadata, userInput);
    }

    var content = '';
    try {
      await for (final chunk in stream) {
        content += chunk;
        yield chunk;
      }
    } finally {
      content = content.replaceFirst('```html', '').replaceFirst('```dart', '');
      content = content.endsWith('```')
          ? content.substring(0, content.length - 3)
          : content;

      final indexFile = File(indexPath);
      await indexFile.writeAsString(content, mode: FileMode.append);
    }
  }

  // Stream edit prototype generation for UI (saves to file)
  Stream<String> streamEditPrototype(
      String appletId, String editRequest) async* {
    final metadata = await _appletsService.getMetadata(appletId);
    final chatHistory = await _chatService.getChatHistory(appletId);
    final appletPath = await _appletsService.getAppletPath(appletId);

    String indexPath;
    String systemPrompt;

    if (metadata.platform == 'evc') {
      indexPath = '$appletPath/index.dart';
      systemPrompt =
          """You are a helpful assistant that creates Flutter widgets for flutter_eval. The user will provide a request, and you should generate a COMPLETE, FULL Dart file that fulfills the request, incorporating any edits or modifications requested.

**IMPORTANT: You must output the ENTIRE Dart file, not just changes or snippets.**

**Instructions:**

1.  **Dart Structure:** Create a complete, valid Dart file.
2.  **Import:** Always start with `import 'package:flutter/material.dart';`
3.  **Widget Class:** Create a StatelessWidget or StatefulWidget class named `MyWidget`.
4.  **Constructor:** The widget should have a simple constructor: `MyWidget();`
5.  **Build Method:** Implement the build method returning the widget tree.
6.  **Flutter Compatible:** The code must be compatible with flutter_eval and standard Flutter widgets.
7.  **Self-Contained:** No external dependencies beyond Flutter material.

The user has a project titled "${metadata.title}" with description: "${metadata.description}".

Based on the conversation history and the edit request, generate the complete Dart file that incorporates the requested changes.

Output the complete Dart file starting with import 'package:flutter/material.dart';""";
    } else {
      indexPath = '$appletPath/index.html';
      systemPrompt =
          """You are a helpful assistant that creates self-contained HTML documents for a desktop panel. The user will provide a request, and you should generate a COMPLETE, FULL HTML file that fulfills the request, incorporating any edits or modifications requested.

**IMPORTANT: You must output the ENTIRE HTML file, not just changes or snippets.**

**Instructions:**

1.  **HTML Structure:** Create a complete, valid HTML5 document.
2.  **Styling:** Use the Tailwind CSS CDN for all styling. Do not use any other CSS or style tags.
    -   Include the Tailwind CSS script in the `<head>`: `<script src="https://cdn.tailwindcss.com"></script>`
3.  **Interactivity:** Use Alpine.js for any required interactivity. Do not use any other JavaScript libraries or inline `<script>` tags for custom logic, except for Alpine.js.
    -   Include the Alpine.js script in the `<head>`: `<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
4.  **Content:** The body of the HTML should contain the UI elements needed to fulfill the user's request.
5.  **Self-Contained:** The final output must be a single HTML file with no external dependencies other than the Tailwind and Alpine.js CDNs.
6. **Responsive and Desktop oriented:** The output HTML must be responsive and oriented for desktop usage (use wide divs if scenario prefers).

The user has a project titled "${metadata.title}" with description: "${metadata.description}".

Based on the conversation history and the edit request, generate the complete HTML file that incorporates the requested changes.

Output the complete HTML file starting with <!DOCTYPE html>""";
    }

    final indexFile = File(indexPath);

    // Build messages including chat history for context
    final messages = <Map<String, dynamic>>[
      {
        'role': 'system',
        'content': systemPrompt,
      },
    ];

    // Add chat history for context
    for (final message in chatHistory.messages) {
      messages.add({
        'role': message.role,
        'content': message.content,
      });
    }

    // Add original file content
    final originalContent = await indexFile.readAsString();
    messages.add({
      'role': 'user',
      'content': originalContent,
    });

    // Add edit request
    messages.add({
      'role': 'user',
      'content': editRequest,
    });

    final request =
        _aiService.getCompletionRequest(_prototypeModel, messages, true);

    // Clear the existing file and write the new content
    if (await indexFile.exists()) {
      await indexFile.delete();
    }

    final stream = _aiService.streamCompletionResponse(request);

    var content = '';
    try {
      await for (final chunk in stream) {
        content += chunk;
        yield chunk;
      }
    } finally {
      content = content.replaceFirst('```html', '').replaceFirst('```dart', '');
      content = content.endsWith('```')
          ? content.substring(0, content.length - 3)
          : content;

      final indexFile = File(indexPath);
      await indexFile.writeAsString(content, mode: FileMode.append);
    }
  }
}
