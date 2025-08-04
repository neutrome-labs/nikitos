import 'dart:convert';
import 'dart:io';

import 'package:nikitos/models/applet.dart';
import 'package:nikitos/models/metadata.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

class AppletsService {
  static const _appletsDirName = 'applets';

  Future<String> get _appletsPath async {
    final appDataDir = await getApplicationSupportDirectory();
    return '${appDataDir.path}/$_appletsDirName';
  }

  Future<List<Applet>> getApplets() async {
    final appletsPath = await _appletsPath;
    final appletsDir = Directory(appletsPath);
    if (!await appletsDir.exists()) {
      return [];
    }

    final appletDirs = await appletsDir.list().toList();
    final applets = <Applet>[];
    for (final appletDir in appletDirs) {
      if (appletDir is Directory) {
        final metadataFile = File('${appletDir.path}/meta.json');
        if (await metadataFile.exists()) {
          final metadataJson = await metadataFile.readAsString();
          final metadata = Metadata.fromJson(jsonDecode(metadataJson));
          applets.add(Applet(
            id: appletDir.path.split(RegExp(r'[/\\]')).last,
            path: appletDir.path,
            metadata: metadata,
          ));
        }
      }
    }
    return applets;
  }

  Future<Applet> createApplet(Metadata metadata) async {
    final appletsPath = await _appletsPath;
    final id = const Uuid().v4();
    final appletDir = Directory('$appletsPath/$id');
    await appletDir.create(recursive: true);

    final metadataFile = File('${appletDir.path}/meta.json');
    await metadataFile.writeAsString(jsonEncode(metadata.toJson()));

    return Applet(
      id: id,
      path: appletDir.path,
      metadata: metadata,
    );
  }

  Future<String> getAppletPath(String id) async {
    final appletsPath = await _appletsPath;
    return '$appletsPath/$id';
  }

  Future<Metadata> getMetadata(String id) async {
    final appletPath = await getAppletPath(id);
    final metadataFile = File('$appletPath/meta.json');
    final metadataJson = await metadataFile.readAsString();
    return Metadata.fromJson(jsonDecode(metadataJson));
  }

  Future<void> deleteApplet(String id) async {
    final appletPath = await getAppletPath(id);
    final appletDir = Directory(appletPath);
    if (await appletDir.exists()) {
      await appletDir.delete(recursive: true);
    }
  }
}
