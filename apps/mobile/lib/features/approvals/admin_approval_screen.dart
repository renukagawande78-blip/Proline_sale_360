import 'package:flutter/material';
import 'package:lucide_icons/lucide_icons.dart';

class MobileAdminApprovalScreen extends StatelessWidget {
  const MobileAdminApprovalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('System Admin Account Check'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('PRL-2026-001054', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF38BDF8))),
                      Text('₹6,125', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('Krishna Trading Agency', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 12),

                  // Financial Risk Card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFF59E0B)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(LucideIcons.alertTriangle, size: 16, color: Color(0xFFFBBF24)),
                            SizedBox(width: 6),
                            Text('FINANCIAL SNAPSHOT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFFBBF24))),
                          ],
                        ),
                        SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Outstanding: ₹1,25,000', style: TextStyle(fontSize: 11)),
                            Text('Overdue: ₹35,000', style: TextStyle(fontSize: 11, color: Color(0xFFFB7185), fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Credit Limit: ₹2,50,000', style: TextStyle(fontSize: 11)),
                            Text('Overdue Days: 18 Days', style: TextStyle(fontSize: 11, color: Color(0xFFFBBF24))),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(LucideIcons.alertOctagon, size: 16, color: Color(0xFFFBBF24)),
                          label: const Text('HOLD', style: TextStyle(color: Color(0xFFFBBF24))),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Order Approved! Dispatched notification sent.')),
                            );
                          },
                          icon: const Icon(LucideIcons.checkCircle, size: 16),
                          label: const Text('APPROVE'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
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
