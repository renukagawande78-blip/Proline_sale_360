import 'package:flutter/material';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../main.dart';

class MobileDashboardScreen extends ConsumerWidget {
  const MobileDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeRole = ref.watch(activeRoleProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('PROLINE OMS 360'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(LucideIcons.userCheck, color: Color(0xFF38BDF8)),
            onSelected: (role) {
              ref.read(activeRoleProvider.notifier).state = role;
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'SALES_PERSON', child: Text('Sales Person')),
              const PopupMenuItem(value: 'AREA_SALES_MANAGER', child: Text('Area Sales Manager')),
              const PopupMenuItem(value: 'SYSTEM_ADMIN', child: Text('System Admin')),
              const PopupMenuItem(value: 'DISPATCH_MANAGER', child: Text('Dispatch Manager')),
              const PopupMenuItem(value: 'ACCOUNTS', child: Text('Accounts')),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Role Banner Card
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF38BDF8).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.shield, color: Color(0xFF38BDF8)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mobile Field Sales Console',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Role: ${activeRole.replaceAll('_', ' ')}',
                          style: const TextStyle(fontSize: 13, color: Color(0xFF38BDF8), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),
            const Text(
              'Performance Summary',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 12),

            // KPI Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: const [
                _KpiTile(title: 'TODAY ORDERS', value: '3 Orders', icon: LucideIcons.shoppingBag, color: Color(0xFF38BDF8)),
                _KpiTile(title: 'PENDING CHECK', value: '1 Pending', icon: LucideIcons.clock, color: Color(0xFFFBBF24)),
                _KpiTile(title: 'APPROVED', value: '2 Approved', icon: LucideIcons.checkCircle, color: Color(0xFF34D399)),
                _KpiTile(title: 'TOTAL VALUE', value: '₹37,325', icon: LucideIcons.trendingUp, color: Color(0xFFC084FC)),
              ],
            ),

            const SizedBox(height: 24),
            const Text(
              'Recent Agency Orders',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 12),

            // Recent Orders Cards
            const _OrderCardTile(
              orderNumber: 'PRL-2026-001054',
              agencyName: 'Krishna Trading Agency',
              companyName: 'Priyagold Foods',
              pcs: '245 PCS (10 Boxes, 5 Loose)',
              amount: '₹6,125',
              status: 'SUBMITTED',
              statusColor: Color(0xFFFBBF24),
            ),
            const SizedBox(height: 10),
            const _OrderCardTile(
              orderNumber: 'PRL-2026-001055',
              agencyName: 'Apex Distributors Pvt Ltd',
              companyName: 'Mogu Mogu Beverages',
              pcs: '480 PCS (20 Boxes)',
              amount: '₹31,200',
              status: 'APPROVED',
              statusColor: Color(0xFF34D399),
            ),
          ],
        ),
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _KpiTile({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                Icon(icon, size: 16, color: color),
              ],
            ),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}

class _OrderCardTile extends StatelessWidget {
  final String orderNumber;
  final String agencyName;
  final String companyName;
  final String pcs;
  final String amount;
  final String status;
  final Color statusColor;

  const _OrderCardTile({
    required this.orderNumber,
    required this.agencyName,
    required this.companyName,
    required this.pcs,
    required this.amount,
    required this.status,
    required this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(orderNumber, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.4)),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(agencyName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text('Brand: $companyName', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
            const Divider(color: Color(0xFF334155), height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(pcs, style: const TextStyle(fontSize: 12, color: Color(0xFF34D399), fontWeight: FontWeight.bold)),
                Text(amount, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
