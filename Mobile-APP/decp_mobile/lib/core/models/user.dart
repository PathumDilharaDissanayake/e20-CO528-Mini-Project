class AuthUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? department;
  final int? graduationYear;
  final String? profilePicture;
  final bool isEmailVerified;

  const AuthUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.department,
    this.graduationYear,
    this.profilePicture,
    required this.isEmailVerified,
  });

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}'.toUpperCase();

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      department: json['department'] as String?,
      graduationYear: json['graduationYear'] as int?,
      profilePicture:
          json['profilePicture'] as String? ?? json['avatar'] as String?,
      isEmailVerified: json['isEmailVerified'] as bool? ??
          json['isVerified'] as bool? ??
          false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
      if (department != null) 'department': department,
      if (graduationYear != null) 'graduationYear': graduationYear,
      if (profilePicture != null) 'profilePicture': profilePicture,
      'isEmailVerified': isEmailVerified,
    };
  }

  AuthUser copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? role,
    String? department,
    int? graduationYear,
    String? profilePicture,
    bool? isEmailVerified,
  }) {
    return AuthUser(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      department: department ?? this.department,
      graduationYear: graduationYear ?? this.graduationYear,
      profilePicture: profilePicture ?? this.profilePicture,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
    );
  }
}

class UserProfile {
  final String id;
  final String userId;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? avatar;
  final String? department;
  final int? graduationYear;
  final String? bio;
  final String? headline;
  final String? location;
  final String? website;
  final List<String> skills;
  final List<Education> education;
  final List<Experience> experience;
  final bool openToWork;
  final Map<String, dynamic> socialLinks;

  const UserProfile({
    required this.id,
    required this.userId,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.avatar,
    this.department,
    this.graduationYear,
    this.bio,
    this.headline,
    this.location,
    this.website,
    required this.skills,
    required this.education,
    required this.experience,
    required this.openToWork,
    required this.socialLinks,
  });

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}'.toUpperCase();

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final resolvedId =
        json['_id'] as String? ?? json['id'] as String? ?? '';
    return UserProfile(
      id: resolvedId,
      userId: json['userId'] as String? ?? resolvedId,
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      avatar:
          json['avatar'] as String? ?? json['profilePicture'] as String?,
      department: json['department'] as String?,
      graduationYear: json['graduationYear'] as int?,
      bio: json['bio'] as String?,
      headline: json['headline'] as String?,
      location: json['location'] as String?,
      website: json['website'] as String?,
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      education: (json['education'] as List<dynamic>?)
              ?.map((e) => Education.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      experience: (json['experience'] as List<dynamic>?)
              ?.map((e) => Experience.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      openToWork: json['openToWork'] as bool? ?? false,
      socialLinks:
          json['socialLinks'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
      if (avatar != null) 'avatar': avatar,
      if (department != null) 'department': department,
      if (graduationYear != null) 'graduationYear': graduationYear,
      if (bio != null) 'bio': bio,
      if (headline != null) 'headline': headline,
      if (location != null) 'location': location,
      if (website != null) 'website': website,
      'skills': skills,
      'education': education.map((e) => e.toJson()).toList(),
      'experience': experience.map((e) => e.toJson()).toList(),
      'openToWork': openToWork,
      'socialLinks': socialLinks,
    };
  }

  UserProfile copyWith({
    String? id,
    String? userId,
    String? email,
    String? firstName,
    String? lastName,
    String? role,
    String? avatar,
    String? department,
    int? graduationYear,
    String? bio,
    String? headline,
    String? location,
    String? website,
    List<String>? skills,
    List<Education>? education,
    List<Experience>? experience,
    bool? openToWork,
    Map<String, dynamic>? socialLinks,
  }) {
    return UserProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      avatar: avatar ?? this.avatar,
      department: department ?? this.department,
      graduationYear: graduationYear ?? this.graduationYear,
      bio: bio ?? this.bio,
      headline: headline ?? this.headline,
      location: location ?? this.location,
      website: website ?? this.website,
      skills: skills ?? this.skills,
      education: education ?? this.education,
      experience: experience ?? this.experience,
      openToWork: openToWork ?? this.openToWork,
      socialLinks: socialLinks ?? this.socialLinks,
    );
  }
}

class Education {
  final String? id;
  final String institution;
  final String? degree;
  final String? fieldOfStudy;
  final int? startYear;
  final int? endYear;
  final bool current;

  const Education({
    this.id,
    required this.institution,
    this.degree,
    this.fieldOfStudy,
    this.startYear,
    this.endYear,
    required this.current,
  });

  factory Education.fromJson(Map<String, dynamic> json) {
    return Education(
      id: json['_id'] as String? ?? json['id'] as String?,
      institution: json['institution'] as String? ?? '',
      degree: json['degree'] as String?,
      fieldOfStudy: json['fieldOfStudy'] as String?,
      startYear: json['startYear'] as int?,
      endYear: json['endYear'] as int?,
      current: json['current'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'institution': institution,
      if (degree != null) 'degree': degree,
      if (fieldOfStudy != null) 'fieldOfStudy': fieldOfStudy,
      if (startYear != null) 'startYear': startYear,
      if (endYear != null) 'endYear': endYear,
      'current': current,
    };
  }
}

class Experience {
  final String? id;
  final String company;
  final String title;
  final String? location;
  final String? startDate;
  final String? endDate;
  final bool current;
  final String? description;

  const Experience({
    this.id,
    required this.company,
    required this.title,
    this.location,
    this.startDate,
    this.endDate,
    required this.current,
    this.description,
  });

  factory Experience.fromJson(Map<String, dynamic> json) {
    return Experience(
      id: json['_id'] as String? ?? json['id'] as String?,
      company: json['company'] as String? ?? '',
      title: json['title'] as String? ?? '',
      location: json['location'] as String?,
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
      current: json['current'] as bool? ?? false,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'company': company,
      'title': title,
      if (location != null) 'location': location,
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      'current': current,
      if (description != null) 'description': description,
    };
  }
}
