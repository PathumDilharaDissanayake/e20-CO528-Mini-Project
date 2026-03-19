class ResearchProject {
  final String id;
  final String title;
  final String abstract;
  final String? description;
  final String status;
  final DateTime? startDate;
  final DateTime? endDate;
  final String leadResearcherId;
  final List<String> collaborators;
  final List<String> tags;
  final String visibility;
  final List<String> documents;
  final int? progress;
  final String? field;
  final String? coverImage;
  final bool isCollaborating;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ResearchProject({
    required this.id,
    required this.title,
    required this.abstract,
    this.description,
    required this.status,
    this.startDate,
    this.endDate,
    required this.leadResearcherId,
    required this.collaborators,
    required this.tags,
    required this.visibility,
    required this.documents,
    this.progress,
    this.field,
    this.coverImage,
    required this.isCollaborating,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ResearchProject.fromJson(Map<String, dynamic> json) {
    String resolveLeadId() {
      if (json['leadResearcherId'] != null) {
        return json['leadResearcherId'].toString();
      }
      if (json['leadResearcher'] is Map<String, dynamic>) {
        final lr = json['leadResearcher'] as Map<String, dynamic>;
        return lr['_id'] as String? ?? lr['id'] as String? ?? '';
      }
      if (json['leadResearcher'] != null) {
        return json['leadResearcher'].toString();
      }
      return '';
    }

    List<String> resolveStringOrIdList(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) {
        return raw.map((e) {
          if (e is String) return e;
          if (e is Map<String, dynamic>) {
            return e['_id'] as String? ?? e['id'] as String? ?? '';
          }
          return e.toString();
        }).toList();
      }
      return [];
    }

    int? resolveProgress(dynamic raw) {
      if (raw == null) return null;
      if (raw is int) return raw;
      if (raw is double) return raw.round();
      if (raw is num) return raw.toInt();
      return null;
    }

    return ResearchProject(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      abstract: json['abstract'] as String? ?? '',
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'planning',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString())
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString())
          : null,
      leadResearcherId: resolveLeadId(),
      collaborators: resolveStringOrIdList(json['collaborators']),
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      visibility: json['visibility'] as String? ?? 'public',
      documents: resolveStringOrIdList(json['documents']),
      progress: resolveProgress(json['progress']),
      field: json['field'] as String?,
      coverImage: json['coverImage'] as String?,
      isCollaborating: json['isCollaborating'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'abstract': abstract,
      if (description != null) 'description': description,
      'status': status,
      if (startDate != null) 'startDate': startDate!.toIso8601String(),
      if (endDate != null) 'endDate': endDate!.toIso8601String(),
      'leadResearcherId': leadResearcherId,
      'collaborators': collaborators,
      'tags': tags,
      'visibility': visibility,
      'documents': documents,
      if (progress != null) 'progress': progress,
      if (field != null) 'field': field,
      if (coverImage != null) 'coverImage': coverImage,
      'isCollaborating': isCollaborating,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  ResearchProject copyWith({
    String? id,
    String? title,
    String? abstract,
    String? description,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    String? leadResearcherId,
    List<String>? collaborators,
    List<String>? tags,
    String? visibility,
    List<String>? documents,
    int? progress,
    String? field,
    String? coverImage,
    bool? isCollaborating,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ResearchProject(
      id: id ?? this.id,
      title: title ?? this.title,
      abstract: abstract ?? this.abstract,
      description: description ?? this.description,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      leadResearcherId: leadResearcherId ?? this.leadResearcherId,
      collaborators: collaborators ?? this.collaborators,
      tags: tags ?? this.tags,
      visibility: visibility ?? this.visibility,
      documents: documents ?? this.documents,
      progress: progress ?? this.progress,
      field: field ?? this.field,
      coverImage: coverImage ?? this.coverImage,
      isCollaborating: isCollaborating ?? this.isCollaborating,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
