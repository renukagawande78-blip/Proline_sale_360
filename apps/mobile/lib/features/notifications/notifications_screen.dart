import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MobileNotificationsScreen extends StatelessWidget {
  const MobileNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Realtime & Push Alerts'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            color: Color(0xFF1E293B),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Color(0x3038BDF8),
                child: Icon(LucideIcons.bell, color: Color(0xFF38BDF8), size: 18),
              ),
              title: Text('New Order Submitted: PRL-2026-001054', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: Text('Krishna Trading Agency • Created by Amit. Waiting for Account Check.', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
              trailing: Text('10m ago', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
            ),
          ),
          SizedBox(height: 8),
          Card(
            color: Color(0xFF1E293B),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Color(0x3034D399),
                child: Icon(LucideIcons.checkCircle, color: Color(0xFF34D399), size: 18),
              ),
              title: Text('Order Approved: PRL-2026-001055', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: Text('Apex Distributors Pvt Ltd • Approved by System Admin.', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
              trailing: Text('1h ago', style: TextStyle(fontSize: 10, color: Color(0xFF64748B))),
            ),
          ),
        ],
      ),
    );
  }
}
