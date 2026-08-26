import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'core/theme.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/orders/orders_list_screen.dart';
import 'features/orders/create_order_screen.dart';
import 'features/approvals/admin_approval_screen.dart';
import 'features/notifications/notifications_screen.dart';

void main() {
  runApp(const ProviderScope(child: ProlineApp()));
}

final activeRoleProvider = StateProvider<String>((ref) => 'SALES_PERSON');

class ProlineApp extends ConsumerWidget {
  const ProlineApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Proline OMS 360',
      theme: ProlineTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    MobileDashboardScreen(),
    MobileOrdersListScreen(),
    MobileCreateOrderScreen(),
    MobileAdminApprovalScreen(),
    MobileNotificationsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFF334155), width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF38BDF8),
          unselectedItemColor: const Color(0xFF64748B),
          type: BottomNavigationBarType.fixed,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          items: const [
            BottomNavigationBarItem(icon: Icon(LucideIcons.layoutDashboard), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.shoppingCart), label: 'Orders'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.plusCircle), label: 'Create'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.shieldCheck), label: 'Approvals'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.bell), label: 'Alerts'),
          ],
        ),
      ),
    );
  }
}
