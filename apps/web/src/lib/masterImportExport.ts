import { Agency, Product, Company, ZoneMaster, User } from '../types';

export type MasterType = 'agencies' | 'products' | 'zones' | 'companies' | 'users' | 'party_balances' | 'orders';

export interface MasterColumnConfig {
  key: string;
  header: string;
  example: string;
}

export interface MasterSchema {
  title: string;
  filenamePrefix: string;
  columns: MasterColumnConfig[];
  sampleData: Record<string, any>[];
}

export const MASTER_SCHEMAS: Record<MasterType, MasterSchema> = {
  party_balances: {
    title: 'Daily Party Ledger & Account Balances Bulk Update',
    filenamePrefix: 'Daily_Party_Balances_Bulk_Update_Sample',
    columns: [
      { key: 'agency_code', header: 'Agency Code / Party ID', example: 'a_pty_001' },
      { key: 'agency_name', header: 'Agency / Party Name', example: 'A One Electronics' },
      { key: 'credit_limit', header: 'Credit Limit (INR)', example: '250000' },
      { key: 'outstanding_balance', header: 'Current Outstanding Balance (INR)', example: '125000' },
      { key: 'overdue_amount', header: 'Overdue Amount (INR)', example: '35000' },
      { key: 'credit_days', header: 'Credit Days / Terms', example: '30' },
      { key: 'last_payment_date', header: 'Last Payment Date', example: '2026-08-10' }
    ],
    sampleData: [
      {
        agency_code: 'a_pty_001',
        agency_name: 'A One Electronics',
        credit_limit: '250000',
        outstanding_balance: '125000',
        overdue_amount: '35000',
        credit_days: '30',
        last_payment_date: '2026-08-10'
      },
      {
        agency_code: 'a_pty_002',
        agency_name: 'A One Mall',
        credit_limit: '500000',
        outstanding_balance: '89000',
        overdue_amount: '0',
        credit_days: '45',
        last_payment_date: '2026-08-11'
      }
    ]
  },
  agencies: {
    title: 'Agencies & B2B Parties Master',
    filenamePrefix: 'Agencies_Parties_Master_Bulk_Upload_Sample',
    columns: [
      { key: 'agency_code', header: 'Agency Code', example: 'AG-9901' },
      { key: 'agency_name', header: 'Agency Name', example: 'Shree Ram Agency' },
      { key: 'account_group', header: 'Agency Type / Segment (FMCG / FMCD)', example: 'FMCG' },
      { key: 'area_name', header: 'Area / Territory', example: 'Parle Point' },
      { key: 'city', header: 'City', example: 'Surat' },
      { key: 'pincode', header: 'PIN Code', example: '395007' },
      { key: 'contact_person', header: 'Contact Person', example: 'Ramesh Patel' },
      { key: 'mobile', header: 'Mobile', example: '9898012345' },
      { key: 'email', header: 'Email', example: 'ramesh@shreeram.com' },
      { key: 'gstin', header: 'GSTIN Number', example: '24AGRPR2900H2ZB' },
      { key: 'credit_limit', header: 'Credit Limit (INR)', example: '0' },
      { key: 'assigned_salesperson', header: 'Assigned Salespersons', example: 'Chirag Patel, Nikhil' }
    ],
    sampleData: [
      {
        agency_code: 'AG-9901',
        agency_name: 'Shree Ram Agency',
        account_group: 'FMCG',
        area_name: 'Parle Point',
        city: 'Surat',
        pincode: '395007',
        contact_person: 'Ramesh Patel',
        mobile: '9898012345',
        email: 'ramesh@shreeram.com',
        gstin: '24AGRPR2900H2ZB',
        credit_limit: '0',
        assigned_salesperson: 'Chirag Patel, Nikhil'
      },
      {
        agency_code: 'AG-9902',
        agency_name: 'Jay Ambe Electronics & Superstore',
        account_group: 'FMCD',
        area_name: 'Piplod Hub',
        city: 'Surat',
        pincode: '395007',
        contact_person: 'Jayeshbhai Shah',
        mobile: '9879054321',
        email: 'info@jayambe.com',
        gstin: '24AAACJ1234F1Z9',
        credit_limit: '0',
        assigned_salesperson: 'Rahul Sharma, Jay'
      },
      {
        agency_code: 'AG-9903',
        agency_name: 'Ambica Traders & Distributors',
        account_group: 'FMCG, FMCD',
        area_name: 'Vapi GIDC',
        city: 'Vapi',
        pincode: '396195',
        contact_person: 'Hareshbhai Mehta',
        mobile: '9825011223',
        email: 'ambica.vapi@gmail.com',
        gstin: '24ABIPA9988C1Z2',
        credit_limit: '0',
        assigned_salesperson: 'Nikhil, Chirag Desai'
      }
    ]
  },

  products: {
    title: 'Products & SKUs Master',
    filenamePrefix: 'Products_SKU_Master_Bulk_Upload_Sample',
    columns: [
      { key: 'product_code', header: 'Product SKU Code', example: 'P-AK-001' },
      { key: 'product_name', header: 'Product Name', example: 'AKAI 43 Inch 4K UHD Smart Google TV' },
      { key: 'company_name', header: 'Brand / Company Name', example: 'AKAI' },
      { key: 'segment', header: 'Segment (FMCG / FMCD)', example: 'FMCD' },
      { key: 'category', header: 'Product Category', example: 'Smart TV' },
      { key: 'pcs_per_box', header: 'Pack Size (Pcs Per Box)', example: '1' },
      { key: 'mrp_price', header: 'MRP Price (INR)', example: '28990' },
      { key: 'unit_price', header: 'Unit Price / Dealer Rate (INR)', example: '20500' }
    ],
    sampleData: [
      {
        product_code: 'P-AK-001',
        product_name: 'AKAI 32 Inch HD Ready LED TV',
        company_name: 'AKAI',
        segment: 'FMCD',
        category: 'Smart TV',
        pcs_per_box: '1',
        mrp_price: '14990',
        unit_price: '10500'
      },
      {
        product_code: 'P-AK-002',
        product_name: 'AKAI 43 Inch 4K UHD Smart Google TV',
        company_name: 'AKAI',
        segment: 'FMCD',
        category: 'Smart TV',
        pcs_per_box: '1',
        mrp_price: '28990',
        unit_price: '20500'
      },
      {
        product_code: 'P-PG-001',
        product_name: 'Priyagold Butter Delite 100g',
        company_name: 'Priyagold',
        segment: 'FMCG',
        category: 'Biscuits',
        pcs_per_box: '24',
        mrp_price: '150',
        unit_price: '120'
      }
    ]
  },

  zones: {
    title: 'Zones & Coverage Master',
    filenamePrefix: 'Zones_Coverage_Master_Bulk_Upload_Sample',
    columns: [
      { key: 'zone_code', header: 'Zone Code', example: 'Z-SUR-99' },
      { key: 'zone_name', header: 'Zone Name', example: 'City-Z Hub' },
      { key: 'region', header: 'Region Category', example: 'Surat City Zone' },
      { key: 'major_areas', header: 'Major Localities (Comma Separated)', example: 'Piplod, Vesu, Adajan, Parle Point' },
      { key: 'description', header: 'Zone Description', example: 'Special Surat West Premium Retail Hub' }
    ],
    sampleData: [
      {
        zone_code: 'Z-SUR-99',
        zone_name: 'City-Z Hub',
        region: 'Surat City Zone',
        major_areas: 'Piplod, Vesu, Adajan, Parle Point',
        description: 'Special Surat West Premium Retail Hub'
      },
      {
        zone_code: 'Z-VAP-01',
        zone_name: 'Vapi Industrial Belt',
        region: 'South Gujarat Rural Zone',
        major_areas: 'Vapi GIDC, Chanod, Salvav',
        description: 'Vapi GIDC Wholesale & Distribution Territory'
      }
    ]
  },

  companies: {
    title: 'Brands & Companies Master',
    filenamePrefix: 'Brands_Companies_Master_Bulk_Upload_Sample',
    columns: [
      { key: 'company_code', header: 'Brand Code', example: 'COMP-99' },
      { key: 'company_name', header: 'Brand / Company Name', example: 'Priyagold Foods India' },
      { key: 'segment', header: 'Industry Segment', example: 'FMCG' }
    ],
    sampleData: [
      {
        company_code: 'COMP-99',
        company_name: 'Priyagold Foods India',
        segment: 'FMCG'
      },
      {
        company_code: 'COMP-100',
        company_name: 'Samsung Electronics Commercial',
        segment: 'FMCD'
      }
    ]
  },

  users: {
    title: 'Users & Roles Master',
    filenamePrefix: 'Users_Roles_Master_Bulk_Upload_Sample',
    columns: [
      { key: 'full_name', header: 'Full Person Name', example: 'Vikram Singh' },
      { key: 'email', header: 'Email Address', example: 'vikram@proline.com' },
      { key: 'role_name', header: 'System Role', example: 'AREA_SALES_MANAGER' },
      { key: 'company_handle', header: 'Company Brand Access Scope', example: 'Pringod, Orion' },
      { key: 'password', header: 'Initial Password', example: '1234' }
    ],
    sampleData: [
      {
        full_name: 'Vikram Singh',
        email: 'vikram@proline.com',
        role_name: 'AREA_SALES_MANAGER',
        company_handle: 'Pringod, Orion',
        password: '1234'
      },
      {
        full_name: 'Anjali Shah',
        email: 'anjali.billing@proline.com',
        role_name: 'BILLING',
        company_handle: 'Whirlpool, Daikin',
        password: '1234'
      }
    ]
  },

  orders: {
    title: 'Sales Orders Bulk CSV Upload',
    filenamePrefix: 'Sales_Orders_Bulk_Upload_Sample',
    columns: [
      { key: 'order_number', header: 'Order Number', example: 'SO-2026-901' },
      { key: 'agency_name', header: 'Agency / Party Name', example: 'A One Electronics' },
      { key: 'company_name', header: 'Brand / Company Name', example: 'Priyagold' },
      { key: 'salesperson_name', header: 'Salesperson Name', example: 'Chirag Patel' },
      { key: 'product_name', header: 'Product Name / SKU', example: 'Butter Gold 100g' },
      { key: 'box_qty', header: 'Box Qty', example: '10' },
      { key: 'loose_pcs', header: 'Loose Pcs', example: '0' },
      { key: 'free_pcs', header: 'Free Pcs', example: '1' },
      { key: 'unit_price', header: 'Unit Rate (INR)', example: '120' },
      { key: 'delivery_type', header: 'Delivery Mode (F.O.R / Self Pickup)', example: 'F.O.R' },
      { key: 'remarks', header: 'Order Remarks', example: 'Bulk Order Sample' }
    ],
    sampleData: [
      {
        order_number: 'SO-2026-901',
        agency_name: 'A One Electronics',
        company_name: 'Priyagold',
        salesperson_name: 'Chirag Patel',
        product_name: 'Butter Gold 100g',
        box_qty: '10',
        loose_pcs: '0',
        free_pcs: '1',
        unit_price: '120',
        delivery_type: 'F.O.R',
        remarks: 'Sample B2B Order 1'
      },
      {
        order_number: 'SO-2026-902',
        agency_name: 'A One Mall',
        company_name: 'Orion',
        salesperson_name: 'Nikhil',
        product_name: 'Choco Pie 6P',
        box_qty: '25',
        loose_pcs: '0',
        free_pcs: '2',
        unit_price: '90',
        delivery_type: 'F.O.R',
        remarks: 'Sample B2B Order 2'
      }
    ]
  }
};

/**
 * Download a sample bulk upload CSV template for the specified master type.
 */
export const downloadSampleCSV = (masterType: MasterType) => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema) return;

  const headers = schema.columns.map(c => c.header);
  const rows = schema.sampleData.map(row => 
    schema.columns.map(col => row[col.key] !== undefined ? String(row[col.key]) : col.example)
  );

  const csvLines = [
    headers.join(','),
    ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${schema.filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export current live master data into a clean CSV file.
 */
export const exportMasterCSV = (masterType: MasterType, dataList: any[]) => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema || !dataList) return;

  const headers = schema.columns.map(c => c.header);
  const rows = dataList.map(item => {
    return schema.columns.map(col => {
      let val = item[col.key];
      if (Array.isArray(val)) {
        val = val.join(', ');
      }
      return val !== undefined && val !== null ? String(val) : '';
    });
  });

  const csvLines = [
    headers.join(','),
    ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Proline_OMS360_${schema.filenamePrefix.replace('_Sample', '')}_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parse raw CSV content into an array of objects mapped by header key.
 */
export const parseCSVContent = (csvText: string, masterType: MasterType): { success: boolean; data: any[]; error?: string } => {
  const schema = MASTER_SCHEMAS[masterType];
  if (!schema) return { success: false, data: [], error: 'Invalid master type.' };

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { success: false, data: [], error: 'CSV file is empty or missing data rows.' };
  }

  // Parse header line
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]).map(h => h.replace(/^[\uFEFF]/, '').trim().toLowerCase());
  
  // Map headers to schema keys with aliases support
  const keyMap: Record<number, string> = {};
  rawHeaders.forEach((h, idx) => {
    // Check aliases for agencies
    if (masterType === 'agencies') {
      if (h === 'pincode' || h === 'pin code' || h === 'pin_code' || h === 'pin' || h === 'postal code' || h === 'zip code' || h === 'zip' || h === 'oin cide') keyMap[idx] = 'pincode';
      else if (h === 'agency code' || h === 'agency_code' || h === 'party code' || h === 'code') keyMap[idx] = 'agency_code';
      else if (h === 'agency name' || h === 'agency_name' || h === 'party name' || h === 'name') keyMap[idx] = 'agency_name';
      else if (h === 'area' || h === 'area / territory' || h === 'area name' || h === 'territory' || h === 'locality') keyMap[idx] = 'area_name';
      else if (h === 'city' || h === 'city name') keyMap[idx] = 'city';
      else if (h === 'mobile' || h === 'phone' || h === 'contact number' || h === 'mobile number') keyMap[idx] = 'mobile';
      else if (h === 'gstin' || h === 'gst' || h === 'gst number' || h === 'gstin number') keyMap[idx] = 'gstin';
      else if (h === 'credit limit' || h === 'credit limit (inr)') keyMap[idx] = 'credit_limit';
    }

    // Check aliases for products
    if (masterType === 'products') {
      if (h === 'product' || h === 'product name' || h === 'product_name') keyMap[idx] = 'product_name';
      else if (h === 'mrp' || h === 'mrp price' || h === 'mrp price (inr)' || h === 'mrp_price') keyMap[idx] = 'mrp_price';
      else if (h === 'pack size' || h === 'pack size (pcs per box)' || h === 'pcs_per_box' || h === 'pcs per box') keyMap[idx] = 'pcs_per_box';
      else if (h === 'product category' || h === 'category') keyMap[idx] = 'category';
      else if (h === 'group name' || h === 'account group' || h === 'account_group') keyMap[idx] = 'account_group';
      else if (h === 'segment') keyMap[idx] = 'segment';
      else if (h === 'sku code' || h === 'product sku code' || h === 'product_code') keyMap[idx] = 'product_code';
    }

    if (!keyMap[idx]) {
      const matchedCol = schema.columns.find(col => 
        col.header.toLowerCase() === h || col.key.toLowerCase() === h
      );
      if (matchedCol) {
        keyMap[idx] = matchedCol.key;
      }
    }
  });

  const parsedItems: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowVals = parseLine(lines[i]);
    if (rowVals.length === 0 || rowVals.every(v => !v)) continue;

    const rowObj: Record<string, any> = {};
    rowVals.forEach((val, idx) => {
      const key = keyMap[idx] || schema.columns[idx]?.key;
      if (key) {
        rowObj[key] = val;
      }
    });

    if (masterType === 'products') {
      // Autogenerate product_code if missing
      if (!rowObj.product_code || !String(rowObj.product_code).trim()) {
        rowObj.product_code = `SKU-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      }
      rowObj.mrp_price = Number(rowObj.mrp_price || 100);
      rowObj.pcs_per_box = Number(rowObj.pcs_per_box || 24);
      rowObj.category = rowObj.category || 'General';
      rowObj.account_group = rowObj.account_group || 'FMCG';
      rowObj.segment = rowObj.segment || 'FMCG';
      rowObj.unit_price = Number(rowObj.unit_price || rowObj.mrp_price);
    }

    parsedItems.push(rowObj);
  }

  return {
    success: true,
    data: parsedItems
  };
};
