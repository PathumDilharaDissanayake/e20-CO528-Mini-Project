// Extended UserProfile model (public profile view) for the DECP Platform.
// Distinct from AuthUser which is the lightweight auth session model.

// ---------------------------------------------------------------------------
// ExperienceItem
// ---------------------------------------------------------------------------

class ExperienceItem {
  final String id;
  final String company;
  final String title;
  final String? location;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isCurrent;
  final String? description;

  const ExperienceItem({
    required this.id,
    required this.company,
    required this.title,
    this.location,
    required this.startDate,
    this.endDate,
    this.isCurrent = false,
    this.description,
  });

  factory ExperienceItem.fromJson(Map<String, dynamic> json) {
    return ExperienceItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      company: json['company'] as String? ?? '',
      title: json['title'] as String? ?? '',
      location: json['location'] as String?,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString())
          : null,
      isCurrent: json['isCurrent'] as bool? ?? false,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'company': company,
        'title': title,
        if (location != null) 'location': location,
        'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate!.toIso8601String(),
        'isCurrent': isCurrent,
        if (description != null) 'description': description,
      };
}

// ---------------------------------------------------------------------------
// EducationItem
// ---------------------------------------------------------------------------

class EducationItem {
  final String id;
  final String institution;
  final String degree;
  final String? fieldOfStudy;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isCurrent;
  final String? description;

  const EducationItem({
    required this.id,
    required this.institution,
    required this.degree,
    this.fieldOfStudy,
    required this.startDate,
    this.endDate,
    this.isCurrent = false,
    this.description,
  });

  factory EducationItem.fromJson(Map<String, dynamic> json) {
    return EducationItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      institution: json['institution'] as String? ?? '',
      degree: json['degree'] as String? ?? '',
      fieldOfStudy: json['fieldOfStudy'] as String?,
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString())
          : null,
      isCurrent: json['isCurrent'] as bool? ?? false,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'institution': institution,
        'degree': degree,
        if (fieldOfStudy != null) 'fieldOfStudy': fieldOfStudy,
        'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate!.toIso8601String(),
        'isCurrent': isCurrent,
        if (description != null) 'description': description,
      };
}

// ---------------------------------------------------------------------------
// SocialLinks
// ---------------------------------------------------------------------------

class SocialLinks {
  final String? linkedin;
  final String? github;
  final String? twitter;
  final String? website;

  const SocialLinks({
    this.linkedin,
    this.github,
    this.twitter,
    this.website,
  });

  factory SocialLinks.fromJson(Map<String, dynamic> json) {
    return SocialLinks(
      linkedin: json['linkedin'] as String?,
      github: json['github'] as String?,
      twitter: json['twitter'] as String?,
      website: json['website'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        if (linkedin != null) 'linkedin': linkedin,
        if (github != null) 'github': github,
        if (twitter != null) 'twitter': twitter,
        if (website != null) 'website': website,
      };
}

// ---------------------------------------------------------------------------
// UserProfile
// ---------------------------------------------------------------------------

class UserProfile {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String role; // student | alumni | faculty | admin
  final String? department;
  final int? graduationYear;
  final String? profilePicture;
  final String? coverPhoto;
  final String? bio;
  final String? headline;
  final String? location;
  final List<String> skills;
  final List<ExperienceItem> experience;
  final List<EducationItem> education;
  final SocialLinks? socialLinks;
  final int connectionsCount;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final bool isVerified;
  final DateTime createdAt;

  const UserProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    this.department,
    this.graduationYear,
    this.profilePicture,
    this.coverPhoto,
    this.bio,
    this.headline,
    this.location,
    this.skills = const [],
    this.experience = const [],
    this.education = const [],
    this.socialLinks,
    this.connectionsCount = 0,
    this.followersCount = 0,
    this.followingCount = 0,
    this.postsCount = 0,
    required this.isVerified,
    required this.createdAt,
  });

  String get fullName => '$firstName $lastName';

  String get initials {
    final f = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final l = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$f$l';
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    List<String> parseStringList(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) return raw.map((e) => e.toString()).toList();
      return [];
    }

    return UserProfile(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      department: json['department'] as String?,
      graduationYear: json['graduationYear'] as int?,
      profilePicture: json['profilePicture'] as String?,
      coverPhoto: json['coverPhoto'] as String?,
      bio: json['bio'] as String?,
      headline: json['headline'] as String?,
      location: json['location'] as String?,
      skills: parseStringList(json['skills']),
      experience: (json['experience'] as List<dynamic>?)
              ?.map((e) => ExperienceItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      education: (json['education'] as List<dynamic>?)
              ?.map((e) => EducationItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      socialLinks: json['socialLinks'] != null
          ? SocialLinks.fromJson(
              json['socialLinks'] as Map<String, dynamic>,
            )
          : null,
      connectionsCount: json['connectionsCount'] as int? ?? 0,
      followersCount: json['followersCount'] as int? ?? 0,
      followingCount: json['followingCount'] as int? ?? 0,
      postsCount: json['postsCount'] as int? ?? 0,
      isVerified: json['isVerified'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'role': role,
        if (department != null) 'department': department,
        if (graduationYear != null) 'graduationYear': graduationYear,
        if (profilePicture != null) 'profilePicture': profilePicture,
        if (coverPhoto != null) 'coverPhoto': coverPhoto,
        if (bio != null) 'bio': bio,
        if (headline != null) 'headline': headline,
        if (location != null) 'location': location,
        'skills': skills,
        'experience': experience.map((e) => e.toJson()).toList(),
        'education': education.map((e) => e.toJson()).toList(),
        if (socialLinks != null) 'socialLinks': socialLinks!.toJson(),
        'connectionsCount': connectionsCount,
        'followersCount': followersCount,
        'followingCount': followingCount,
        'postsCount': postsCount,
        'isVerified': isVerified,
        'createdAt': createdAt.toIso8601String(),
      };

  UserProfile copyWith({
    String? firstName,
    String? lastName,
    String? bio,
    String? headline,
    String? location,
    String? profilePicture,
    String? coverPhoto,
    List<String>? skills,
    List<ExperienceItem>? experience,
    List<EducationItem>? education,
    SocialLinks? socialLinks,
    int? connectionsCount,
    int? followersCount,
    int? followingCount,
    int? postsCount,
  }) {
    return UserProfile(
      id: id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email,
      role: role,
      department: department,
      graduationYear: graduationYear,
      profilePicture: profilePicture ?? this.profilePicture,
      coverPhoto: coverPhoto ?? this.coverPhoto,
      bio: bio ?? this.bio,
      headline: headline ?? this.headline,
      location: location ?? this.location,
      skills: skills ?? this.skills,
      experience: experience ?? this.experience,
      education: education ?? this.education,
      socialLinks: socialLinks ?? this.socialLinks,
      connectionsCount: connectionsCount ?? this.connectionsCount,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      isVerified: isVerified,
      createdAt: createdAt,
    );
  }
}
