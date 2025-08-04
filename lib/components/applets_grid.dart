import 'package:flutter/material.dart';
import 'package:nikitos/models/applet.dart';
import 'package:nikitos/components/applet_icon.dart';

class AppletsGrid extends StatelessWidget {
  final List<Applet> applets;
  final Set<String> runningApplets;
  final Function(Applet) onOpenApplet;
  final Function(Applet) onDeleteApplet;
  final Function(Applet) onEditApplet;
  final Function(Applet) onOpenFolder;

  const AppletsGrid({
    super.key,
    required this.applets,
    required this.runningApplets,
    required this.onOpenApplet,
    required this.onDeleteApplet,
    required this.onEditApplet,
    required this.onOpenFolder,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3, // Fewer columns for better spacing
        crossAxisSpacing: 20,
        mainAxisSpacing: 20,
        childAspectRatio: 1, // Taller cells for icon + text
      ),
      itemCount: applets.length,
      itemBuilder: (context, index) {
        final applet = applets[index];
        return AppletIcon(
          applet: applet,
          isRunning: runningApplets.contains(applet.id),
          onTap: () => onOpenApplet(applet),
          onDelete: () => onDeleteApplet(applet),
          onEdit: () => onEditApplet(applet),
          onOpenFolder: () => onOpenFolder(applet),
        );
      },
    );
  }
}
