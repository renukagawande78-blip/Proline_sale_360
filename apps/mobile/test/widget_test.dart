import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:proline_oms_mobile/main.dart';

void main() {
  testWidgets('ProlineApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: ProlineApp()));
    expect(find.text('PROLINE OMS 360'), findsOneWidget);
  });
}

