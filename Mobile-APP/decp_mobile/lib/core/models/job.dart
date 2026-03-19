class Job {
  final String id;
  final String title;
  final String description;
  final String company;
  final String location;
  final String type;
  final JobSalary? salary;
  final List<String> requirements;
  final List<String> skills;
  final String postedBy;
  final String status;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Job({
    required this.id,
    required this.title,
    required this.description,
    required this.company,
    required this.location,
    required this.type,
    this.salary,
    required this.requirements,
    required this.skills,
    required this.postedBy,
    required this.status,
    this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      company: json['company'] as String? ?? '',
      location: json['location'] as String? ?? '',
      type: json['type'] as String? ?? 'full-time',
      salary: json['salary'] != null
          ? JobSalary.fromJson(json['salary'] as Map<String, dynamic>)
          : null,
      requirements: (json['requirements'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      postedBy: json['postedBy'] is Map<String, dynamic>
          ? ((json['postedBy'] as Map<String, dynamic>)['_id'] as String? ??
              (json['postedBy'] as Map<String, dynamic>)['id'] as String? ??
              '')
          : json['postedBy']?.toString() ?? '',
      status: json['status'] as String? ?? 'active',
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
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
      'company': company,
      'location': location,
      'type': type,
      if (salary != null) 'salary': salary!.toJson(),
      'requirements': requirements,
      'skills': skills,
      'postedBy': postedBy,
      'status': status,
      if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Job copyWith({
    String? id,
    String? title,
    String? description,
    String? company,
    String? location,
    String? type,
    JobSalary? salary,
    List<String>? requirements,
    List<String>? skills,
    String? postedBy,
    String? status,
    DateTime? expiresAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Job(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      company: company ?? this.company,
      location: location ?? this.location,
      type: type ?? this.type,
      salary: salary ?? this.salary,
      requirements: requirements ?? this.requirements,
      skills: skills ?? this.skills,
      postedBy: postedBy ?? this.postedBy,
      status: status ?? this.status,
      expiresAt: expiresAt ?? this.expiresAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class JobSalary {
  final double? min;
  final double? max;
  final String currency;
  final String period;

  const JobSalary({
    this.min,
    this.max,
    required this.currency,
    required this.period,
  });

  factory JobSalary.fromJson(Map<String, dynamic> json) {
    return JobSalary(
      min: (json['min'] as num?)?.toDouble(),
      max: (json['max'] as num?)?.toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      period: json['period'] as String? ?? 'yearly',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (min != null) 'min': min,
      if (max != null) 'max': max,
      'currency': currency,
      'period': period,
    };
  }

  String get displayRange {
    if (min == null && max == null) return 'Not disclosed';
    final sym = currency == 'USD' ? '\$' : currency;
    String fmt(double v) =>
        v >= 1000 ? '$sym${(v / 1000).toStringAsFixed(0)}k' : '$sym${v.toStringAsFixed(0)}';
    if (min != null && max != null) return '${fmt(min!)} – ${fmt(max!)}';
    if (min != null) return '${fmt(min!)}+';
    return 'Up to ${fmt(max!)}';
  }
}

class JobApplication {
  final String id;
  final String jobId;
  final String userId;
  final String? resumeUrl;
  final String? coverLetter;
  final String status;
  final DateTime createdAt;
  final Job? job;

  const JobApplication({
    required this.id,
    required this.jobId,
    required this.userId,
    this.resumeUrl,
    this.coverLetter,
    required this.status,
    required this.createdAt,
    this.job,
  });

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    String resolveJobId() {
      if (json['jobId'] != null) return json['jobId'].toString();
      if (json['job'] is Map<String, dynamic>) {
        final j = json['job'] as Map<String, dynamic>;
        return j['_id'] as String? ?? j['id'] as String? ?? '';
      }
      if (json['job'] != null) return json['job'].toString();
      return '';
    }

    return JobApplication(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      jobId: resolveJobId(),
      userId: json['userId'] as String? ??
          (json['user'] is Map<String, dynamic>
              ? ((json['user'] as Map<String, dynamic>)['_id'] as String? ??
                  (json['user'] as Map<String, dynamic>)['id'] as String? ??
                  '')
              : json['user']?.toString() ?? ''),
      resumeUrl: json['resumeUrl'] as String?,
      coverLetter: json['coverLetter'] as String?,
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      job: json['job'] is Map<String, dynamic>
          ? Job.fromJson(json['job'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'jobId': jobId,
      'userId': userId,
      if (resumeUrl != null) 'resumeUrl': resumeUrl,
      if (coverLetter != null) 'coverLetter': coverLetter,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      if (job != null) 'job': job!.toJson(),
    };
  }

  JobApplication copyWith({
    String? id,
    String? jobId,
    String? userId,
    String? resumeUrl,
    String? coverLetter,
    String? status,
    DateTime? createdAt,
    Job? job,
  }) {
    return JobApplication(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      userId: userId ?? this.userId,
      resumeUrl: resumeUrl ?? this.resumeUrl,
      coverLetter: coverLetter ?? this.coverLetter,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      job: job ?? this.job,
    );
  }
}
