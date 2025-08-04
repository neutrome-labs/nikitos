import 'package:nikitos/models/metadata.dart';

class Applet {
  final String id;
  final String path;
  final Metadata metadata;

  Applet({
    required this.id,
    required this.path,
    required this.metadata,
  });
}
