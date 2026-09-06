export interface TestOrderPayload {
  orderNumber: string;
  agencyName: string;
  agencyCode: string;
  companyName: string;
  productName: string;
  boxQuantity: number;
  pcsQuantity?: number;
  paymentType: 'ADVANCE' | 'CREDIT' | 'CASH' | 'CHEQUE';
  advanceReceiptNumber?: string;
  remarks?: string;
}

export const generateUniqueOrderId = (prefix = 'TEST-ORD'): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestamp}-${random}`;
};

export const MOCK_TEST_AGENCIES = [
  { id: 'ag_arham', name: 'Arham Sales', code: 'AG-SUR-001', city: 'Surat', area: 'Katargam' },
  { id: 'ag_ambika', name: 'Ambika Electronic', code: 'AG-SUR-002', city: 'Surat', area: 'Varachha' },
  { id: 'ag_arihant', name: 'Arihant Mobile', code: 'AG-SUR-003', city: 'Surat', area: 'Ring Road' },
  { id: 'ag_alina', name: 'Alina Mobile', code: 'AG-SUR-004', city: 'Surat', area: 'Nanpura' }
];

export const MOCK_TEST_PRODUCTS = [
  { id: 'prod_pg_01', name: 'Butter Gold 50g', company: 'Priyagold', pcsPerBox: 24, price: 120 },
  { id: 'prod_pg_02', name: 'Snackers Salted 100g', company: 'Priyagold', pcsPerBox: 24, price: 150 },
  { id: 'prod_or_01', name: 'Choco Pie 6P', company: 'Orion', pcsPerBox: 16, price: 180 },
  { id: 'prod_hl_01', name: 'Hell Classic 250ml', company: 'Hell', pcsPerBox: 24, price: 360 },
  { id: 'prod_wp_01', name: 'Whirlpool 190L Direct Cool Refrigerator', company: 'Whirlpool', pcsPerBox: 1, price: 14500 }
];

export const createRandomOrderPayload = (overrides?: Partial<TestOrderPayload>): TestOrderPayload => {
  const orderNumber = generateUniqueOrderId();
  const agency = MOCK_TEST_AGENCIES[0];
  const product = MOCK_TEST_PRODUCTS[0];

  return {
    orderNumber,
    agencyName: agency.name,
    agencyCode: agency.code,
    companyName: product.company,
    productName: product.name,
    boxQuantity: 5,
    paymentType: 'CREDIT',
    remarks: 'Automated E2E Test Order',
    ...overrides
  };
};
