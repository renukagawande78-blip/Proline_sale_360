import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MobileOrdersListScreen extends StatelessWidget {
  const MobileOrdersListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Agency Orders'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: 'Search agency or order #...',
              prefixIcon: const Icon(LucideIcons.search, size: 18),
              filled: true,
              fillColor: const Color(0xFF1E293B),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF334155)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('PRL-2026-001054', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF38BDF8))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFBBF24).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFBBF24)),
                        ),
                        child: const Text('SUBMITTED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text('Krishna Trading Agency', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const Text('Priyagold Foods • Delhi NCR Territory', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                  const Divider(color: Color(0xFF334155), height: 16),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('245 Total PCS', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF34D399))),
                      Text('₹6,125', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
