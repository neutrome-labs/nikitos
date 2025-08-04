import 'dart:io';
import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart';
import 'package:nikitos/models/metadata.dart';

class AiService {
  final String _apiKey = dotenv.env['AI_API_KEY']!;
  final String _apiEndpoint = dotenv.env['AI_ENDPOINT']!;

  Request getCompletionRequest(
      String model, List<Map<String, dynamic>> messages, bool stream) {
    final request =
        Request('POST', Uri.parse('$_apiEndpoint/chat/completions'));
    request.headers.addAll({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $_apiKey',
    });
    request.body = jsonEncode({
      'model': model,
      'messages': messages,
      'stream': stream,
    });
    return request;
  }

  Future<String> getCompletionResponse(Request request) async {
    request.headers['Accept'] = 'application/json';

    final response = await request.send();
    if (response.statusCode != 200) {
      throw Exception(
          'Failed to get response from AI: status code ${response.statusCode}');
    }

    final responseBody = await response.stream.bytesToString();
    final json = jsonDecode(responseBody);
    if (json['choices'] == null || json['choices'].isEmpty) {
      throw Exception('No choices found in AI response');
    }

    return json['choices'][0]['message']['content'] ?? '';
  }

  Stream<String> streamCompletionResponse(Request request) async* {
    request.headers['Accept'] = 'text/event-stream';

    final response = await request.send();

    if (response.statusCode != 200) {
      throw Exception('Failed to get response from AI');
    }

    await for (final chunk in response.stream.transform(utf8.decoder)) {
      if (chunk.isEmpty) continue;

      final subchunks = chunk.split('\n');
      for (final subchunk in subchunks) {
        if (!subchunk.startsWith("data: {")) continue;

        dynamic jsonChunk;
        try {
          jsonChunk = jsonDecode(subchunk.substring(6).trim());
          if (jsonChunk['choices'] == null || jsonChunk['choices'].isEmpty) {
            continue;
          }
        } catch (e) {
          // Handle JSON parsing error
          continue;
        }

        final content = jsonChunk['choices'][0]['delta']['content'] ?? '';
        if (content.isEmpty) continue;

        // Yield the content chunk by chunk
        if (content == '[DONE]') break; // End of stream

        if (content is String) {
          yield content;
        } else if (content is Map) {
          // Handle case where content is a map (e.g., metadata)
          final chunk = jsonEncode(content);
          if (chunk.isNotEmpty) {
            // Ensure we don't yield empty chunks
            yield chunk;
          }
        }
      }
    }
  }
}

extension MetadataCopyWith on Metadata {
  Metadata copyWith({
    String? type,
    String? platform,
    String? alpha,
    String? stack,
    String? title,
    String? description,
  }) {
    return Metadata(
      type: type ?? this.type,
      platform: platform ?? this.platform,
      alpha: alpha ?? this.alpha,
      stack: stack ?? this.stack,
      title: title ?? this.title,
      description: description ?? this.description,
    );
  }
}
