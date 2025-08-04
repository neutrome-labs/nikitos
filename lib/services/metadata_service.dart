import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:nikitos/models/metadata.dart';
import 'package:nikitos/models/applet.dart';
import 'package:nikitos/services/ai_service.dart';
import 'package:nikitos/services/applets_service.dart';

class MetadataService {
  final String _metadataModel = dotenv.env['AI_MODEL_METADATA']!;
  final AiService _aiService = AiService();
  final AppletsService _appletsService = AppletsService();

  Future<Metadata> _createMetadata(String userInput,
      {String? type, String? platform}) async {
    String systemPrompt = """You are a metadata generator. 
Given a user input, you must return a JSON object with the following fields: type, platform, alpha, stack, title, description, recommendedWidth, recommendedHeight. 
The "type" can only be "prototype" or "app". 
For "prototype" type, the "platform" should default to "web", use "evc" (for Flutter widgets) only when specifically requested "flutter" or "native" or when the request clearly needs native technologies. 
For "app" type, the "platform" can only be "claudecode". 
The "stack" must be: null for evc platform, "vanilla" for web platform, "flutter" for claudecode platform. 
The "alpha" is a short prompt enriching user input. 
The "title" is a user-friendly title. 
The "description" is a short description.
The "recommendedWidth" is an integer for the recommended window width in pixels.
The "recommendedHeight" is an integer for the recommended window height in pixels.""";

    // Add constraints if type or platform are specified
    if (type != null) {
      systemPrompt += '\nIMPORTANT: The "type" must be "$type".';
    }
    if (platform != null) {
      systemPrompt += '\nIMPORTANT: The "platform" must be "$platform".';
    }

    final request = _aiService.getCompletionRequest(
      _metadataModel,
      [
        {
          'role': 'system',
          'content': systemPrompt,
        },
        {
          'role': 'user',
          'content': userInput,
        }
      ],
      false,
    );

    try {
      final response = await _aiService.getCompletionResponse(request);
      return Metadata.fromJson(jsonDecode(response));
    } catch (e) {
      throw Exception('Failed to get metadata from AI: $e');
    }
  }

  Future<Applet> createApplet(String userInput,
      {String? type, String? platform}) async {
    final metadata =
        await _createMetadata(userInput, type: type, platform: platform);
    return await _appletsService.createApplet(metadata);
  }
}
