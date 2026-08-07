import 'package:flutter/material';
import 'package:lucide_icons/lucide_icons.dart';

class MobileCreateOrderScreen extends StatefulWidget {
  const MobileCreateOrderScreen({super.key});

  @override
  State<MobileCreateOrderScreen> createState() => _MobileCreateOrderScreenState();
}

class _MobileCreateOrderScreenState extends State<MobileCreateOrderScreen> {
  int _boxQty = 10;
  int _loosePcs = 5;
  final int _pcsPerBox = 24;
  final double _unitPrice = 25.0;

  @override
  Widget build(BuildContext context) {
    final int totalPcs = (_boxQty * _pcsPerBox) + _loosePcs;
    final double totalAmount = totalPcs * _unitPrice;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Agency Order'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Company / Brand', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: 'Priyagold Foods',
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: 'Priyagold Foods', child: Text('Priyagold Foods')),
                    DropdownMenuItem(value: 'Mogu Mogu Beverages', child: Text('Mogu Mogu Beverages')),
                  ],
                  onChanged: (v) {},
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Agency / B2B Customer', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: 'Krishna Trading Agency',
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: 'Krishna Trading Agency', child: Text('Krishna Trading Agency (AG-KRS-01)')),
                  ],
                  onChanged: (v) {},
                ),
              ),
            ),

            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Priyagold Butter Delite 100g', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    const Text('24 PCS / Box • ₹25 per unit', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Box Quantity', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              TextField(
                                keyboardType: TextInputType.number,
                                controller: TextEditingController(text: _boxQty.toString()),
                                onChanged: (val) => setState(() => _boxQty = int.tryParse(val) ?? 0),
                                decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Loose PCS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              TextField(
                                keyboardType: TextInputType.number,
                                controller: TextEditingController(text: _loosePcs.toString()),
                                onChanged: (val) => setState(() => _loosePcs = int.tryParse(val) ?? 0),
                                decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF38BDF8)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Quantity (PCS):', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('$totalPcs PCS', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF34D399))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Order Value:', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('₹${totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF38BDF8))),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Order submitted successfully! Notifications dispatched to Admin.')),
                );
              },
              icon: const Icon(LucideIcons.send),
              label: const Text('SUBMIT ORDER TO SYSTEM ADMIN'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF38BDF8),
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
