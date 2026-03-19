class Event {
  final String id;
  final String title;
  final String description;
  final String type;
  final DateTime startDate;
  final DateTime endDate;
  final String? location;
  final bool isVirtual;
  final String? meetingLink;
  final String organizerId;
  final int? capacity;
  final String? imageUrl;
  final String status;
  final List<String>? tags;
  final int? rsvpCount;
  final String? userRsvpStatus;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Event({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.startDate,
    required this.endDate,
    this.location,
    required this.isVirtual,
    this.meetingLink,
    required this.organizerId,
    this.capacity,
    this.imageUrl,
    required this.status,
    this.tags,
    this.rsvpCount,
    this.userRsvpStatus,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    String resolveOrganizerId() {
      if (json['organizerId'] != null) return json['organizerId'].toString();
      if (json['organizer'] is Map<String, dynamic>) {
        final o = json['organizer'] as Map<String, dynamic>;
        return o['_id'] as String? ?? o['id'] as String? ?? '';
      }
      if (json['organizer'] != null) return json['organizer'].toString();
      return '';
    }

    return Event(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      type: json['type'] as String? ?? 'other',
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString()) ??
              DateTime.now().add(const Duration(hours: 1))
          : DateTime.now().add(const Duration(hours: 1)),
      location: json['location'] as String?,
      isVirtual: json['isVirtual'] as bool? ?? false,
      meetingLink: json['meetingLink'] as String?,
      organizerId: resolveOrganizerId(),
      capacity: json['capacity'] as int?,
      imageUrl: json['imageUrl'] as String? ??
          json['bannerImage'] as String? ??
          json['coverImage'] as String?,
      status: json['status'] as String? ?? 'published',
      tags: (json['tags'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      rsvpCount: json['rsvpCount'] as int? ?? json['goingCount'] as int?,
      userRsvpStatus: json['userRsvpStatus'] as String?,
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
      'description': description,
      'type': type,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      if (location != null) 'location': location,
      'isVirtual': isVirtual,
      if (meetingLink != null) 'meetingLink': meetingLink,
      'organizerId': organizerId,
      if (capacity != null) 'capacity': capacity,
      if (imageUrl != null) 'imageUrl': imageUrl,
      'status': status,
      if (tags != null) 'tags': tags,
      if (rsvpCount != null) 'rsvpCount': rsvpCount,
      if (userRsvpStatus != null) 'userRsvpStatus': userRsvpStatus,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Event copyWith({
    String? id,
    String? title,
    String? description,
    String? type,
    DateTime? startDate,
    DateTime? endDate,
    String? location,
    bool? isVirtual,
    String? meetingLink,
    String? organizerId,
    int? capacity,
    String? imageUrl,
    String? status,
    List<String>? tags,
    int? rsvpCount,
    String? userRsvpStatus,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Event(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      location: location ?? this.location,
      isVirtual: isVirtual ?? this.isVirtual,
      meetingLink: meetingLink ?? this.meetingLink,
      organizerId: organizerId ?? this.organizerId,
      capacity: capacity ?? this.capacity,
      imageUrl: imageUrl ?? this.imageUrl,
      status: status ?? this.status,
      tags: tags ?? this.tags,
      rsvpCount: rsvpCount ?? this.rsvpCount,
      userRsvpStatus: userRsvpStatus ?? this.userRsvpStatus,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
