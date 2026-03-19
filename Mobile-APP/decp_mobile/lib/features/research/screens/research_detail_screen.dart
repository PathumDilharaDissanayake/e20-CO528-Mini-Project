import 'package:flutter/material.dart';

class ResearchDetailScreen extends StatelessWidget {
  final String researchId;

  const ResearchDetailScreen({super.key, required this.researchId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Research Detail')),
      body: Center(child: Text('Research ID: $researchId')),
    );
  }
}
