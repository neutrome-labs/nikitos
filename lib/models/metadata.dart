class Metadata {
  final String type;
  final String platform;
  final String alpha;
  final String? stack;
  final String title;
  final String description;
  final int? recommendedWidth;
  final int? recommendedHeight;

  Metadata({
    required this.type,
    required this.platform,
    required this.alpha,
    required this.stack,
    required this.title,
    required this.description,
    this.recommendedWidth,
    this.recommendedHeight,
  });

  factory Metadata.fromJson(Map<String, dynamic> json) {
    return Metadata(
      type: json['type'],
      platform: json['platform'],
      alpha: json['alpha'],
      stack: json['stack'],
      title: json['title'],
      description: json['description'],
      recommendedWidth: json['recommendedWidth'],
      recommendedHeight: json['recommendedHeight'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'platform': platform,
      'alpha': alpha,
      'stack': stack,
      'title': title,
      'description': description,
      'recommendedWidth': recommendedWidth,
      'recommendedHeight': recommendedHeight,
    };
  }
}
