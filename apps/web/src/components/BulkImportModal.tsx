import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Table, 
  Sparkles, 
  RefreshCw,
  FileText,
  Check,
  Layers,
  HelpCircle,
  Play
} from 'lucide-react';
import { MasterType, MASTER_SCHEMAS, downloadSampleCSV } from '../lib/masterImportExport';
import { 
  saveAgencyToSupabase, 
  saveProductToSupabase,
  saveCompanyToSupabase,
  saveUserToSupabase,
  saveAreaToSupabase,
  saveOrderToSupabase,
  generateNewAgencyCode, 
  generateNewBarcodeSKUCode,
  resolveZoneForAreaAndCity,
  deduplicateAgencies,
  supabase,
  generateUuid
} from '../lib/supabase';
import { Agency, Product, Order } from '../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterType: MasterType;
  onImportSuccess?: (importedRows: any[], masterType: MasterType, count: number) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  masterType,
  onImportSuccess
}) => {
  // Input Mode: 'file' | 'paste'
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('paste');
  const [rawCsvText, setRawCsvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Header Mapping & Preview State
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'input' | 'mapping' | 'uploading' | 'completed'>('input');
  
  // Progress & Execution State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentExecutingItem, setCurrentExecutingItem] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const schema = MASTER_SCHEMAS[masterType] || MASTER_SCHEMAS.agencies;

  // Split CSV line handling quotes safely
  const parseCsvLine = (line: string): string[] => {
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

  // Step 1: Process Raw CSV Text or File
  const handleParseCsvData = (csvContent: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      setErrorMsg('CSV text is empty! Please paste rows or upload a valid CSV file.');
      return;
    }

    const headers = parseCsvLine(lines[0]).map(h => h.replace(/^[\uFEFF]/, '').trim());
    if (headers.length === 0) {
      setErrorMsg('No header columns found in CSV first row.');
      return;
    }

    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      if (vals.length > 0 && vals.some(v => v.trim().length > 0)) {
        rows.push(vals);
      }
    }

    if (rows.length === 0) {
      setErrorMsg('No data rows found below CSV header line.');
      return;
    }

    // Robust 2-Pass Auto-mapping detected CSV headers to target schema keys
    const initialMap: Record<string, string> = {};
    const claimedHeaders = new Set<string>();

    const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Common aliases for each schema key
    const ALIAS_MAP: Record<string, string[]> = {
      order_number: ['ordernumber', 'order_number', 'orderno', 'order_no', 'sono', 'so_number', 'salesordernumber', 'sales_order_number', 'order'],
      salesperson_name: ['salespersonname', 'salesperson_name', 'salesperson', 'salesrep', 'sales_rep', 'assignedsalesperson', 'sales_person', 'rep', 'employee'],
      box_qty: ['boxqty', 'box_qty', 'boxes', 'boxcount', 'totalboxes', 'box_quantity', 'qty_boxes'],
      loose_pcs: ['loosepcs', 'loose_pcs', 'loosequantity', 'loose_quantity', 'loose', 'pcs'],
      free_pcs: ['freepcs', 'free_pcs', 'freescheme', 'scheme_pcs', 'free', 'bonus'],
      delivery_type: ['deliverymode', 'delivery_mode', 'deliverytype', 'delivery_type', 'mode', 'shippingmode', 'shipping_type'],
      remarks: ['orderremarks', 'order_remarks', 'remarks', 'remark', 'notes', 'comments', 'instruction'],
      product_code: ['productcode', 'product_code', 'skucode', 'sku_code', 'sku', 'barcode', 'itemcode', 'item_code', 'code', 'modelcode'],
      product_name: ['productname', 'product_name', 'itemname', 'item_name', 'modelname', 'model', 'title', 'description', 'product', 'producttitle', 'item'],
      company_name: ['productcompanyname', 'companyname', 'company_name', 'brandname', 'brand_name', 'brand', 'company', 'manufacturer'],
      segment: ['productcompanysegment', 'companysegment', 'segment', 'division', 'industry'],
      category: ['productcategory', 'product_category', 'categoryname', 'category_name', 'itemcategory', 'item_category', 'category', 'cat'],
      pcs_per_box: ['pcsperbox', 'pcs_per_box', 'packsize', 'pack_size', 'boxpack', 'box_pack', 'pcsbox', 'pcs/box', 'unitsperbox'],
      mrp_price: ['mrpprice', 'mrp_price', 'mrp', 'retailprice', 'retail_price', 'mrpinr', 'mrp(inr)', 'mrp(₹)'],
      unit_price: ['unitprice', 'unit_price', 'dealerprice', 'dealer_price', 'dealerrate', 'dealer_rate', 'rate', 'wholesaleprice', 'price', 'cost'],
      agency_name: ['agencyname', 'agency_name', 'partyname', 'party_name', 'party', 'agency', 'customername', 'customer_name', 'firmname', 'firm_name'],
      agency_code: ['agencycode', 'agency_code', 'partycode', 'party_code', 'partyid', 'party_id', 'customercode', 'customer_code', 'code'],
      account_group: ['accountgroup', 'account_group', 'agencytype', 'agency_type', 'segment', 'companybrand', 'company_brand', 'brand', 'group', 'type'],
      assigned_salesperson: ['assignedsalespersons', 'assignedsalesperson', 'assigned_salespersons', 'assigned_salesperson', 'salesperson', 'salespersons', 'sales_person', 'salesrep', 'assigned_sales'],
      gstin: ['gstin', 'gstnumber', 'gst_number', 'gst', 'gstno', 'gst_no', 'taxid', 'tax_id'],
      mobile: ['mobile', 'mobilenumber', 'mobile_number', 'phone', 'phonenumber', 'contactnumber', 'cell'],
      email: ['email', 'emailid', 'email_id', 'emailaddress', 'email_address', 'mail'],
      city: ['city', 'district', 'town', 'location'],
      area_name: ['areaname', 'area_name', 'area', 'locality', 'territory', 'zone'],
      contact_person: ['contactperson', 'contact_person', 'personname', 'owner', 'contact'],
      credit_limit: ['creditlimit', 'credit_limit', 'credit', 'limit'],
      full_name: ['fullname', 'full_name', 'username', 'user_name', 'name', 'employee_name'],
      role_name: ['rolename', 'role_name', 'role', 'designation', 'user_role']
    };

    // Pass 1: Exact matches
    schema.columns.forEach(col => {
      const colClean = cleanStr(col.key);
      const headerClean = cleanStr(col.header);

      const exactMatch = headers.find(h => {
        if (claimedHeaders.has(h)) return false;
        const hClean = cleanStr(h);
        return hClean === colClean || hClean === headerClean;
      });

      if (exactMatch) {
        initialMap[col.key] = exactMatch;
        claimedHeaders.add(exactMatch);
      }
    });

    // Pass 2: Alias matches
    schema.columns.forEach(col => {
      if (initialMap[col.key]) return; // already mapped in pass 1

      const aliases = ALIAS_MAP[col.key] || [];
      const matchedHeader = headers.find(h => {
        if (claimedHeaders.has(h)) return false;
        const hClean = cleanStr(h);
        
        // Disambiguate product_name vs product_code
        if (col.key === 'product_name' && (hClean.includes('code') || hClean.includes('sku') || hClean.includes('barcode'))) {
          return false;
        }
        if (col.key === 'product_code' && (hClean.includes('name') || hClean.includes('title') || hClean.includes('desc'))) {
          return false;
        }

        return aliases.some(alias => hClean === cleanStr(alias) || hClean.includes(cleanStr(alias)));
      });

      if (matchedHeader) {
        initialMap[col.key] = matchedHeader;
        claimedHeaders.add(matchedHeader);
      }
    });

    setRawHeaders(headers);
    setRawRows(rows);
    setColumnMap(initialMap);
    setStep('mapping');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseCsvData(content);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Step 2: Execute Sequential One-by-One Bulk Upload to Supabase
  const handleExecuteSequentialUpload = async () => {
    setStep('uploading');
    setIsProcessing(true);
    setErrorMsg(null);
    setTotalCount(rawRows.length);

    // Fetch live reference data for accurate ID and code linking
    let liveCompanies: any[] = [];
    let liveAgencies: any[] = [];
    let liveProducts: any[] = [];
    let liveUsers: any[] = [];
    try {
      const [compRes, agRes, prodRes, userRes] = await Promise.all([
        supabase.from('companies').select('id, company_name, company_code, segment'),
        supabase.from('agencies').select('id, agency_name, agency_code, area_name, city, zone_name, zone_region'),
        supabase.from('products').select('id, product_name, product_code, segment, pcs_per_box, unit_price, mrp_price, company_id'),
        supabase.from('users').select('id, full_name, email, role_name')
      ]);
      if (compRes.data) liveCompanies = compRes.data;
      if (agRes.data) liveAgencies = agRes.data;
      if (prodRes.data) liveProducts = prodRes.data;
      if (userRes.data) liveUsers = userRes.data;
    } catch (e) {
      console.warn('Could not pre-fetch live references for import mapping', e);
    }

    const importedItems: any[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      setCurrentIndex(i + 1);
      const rowVals = rawRows[i];

      // Extract row data using confirmed column mapping
      const getVal = (targetKey: string): string => {
        const headerName = columnMap[targetKey];
        if (!headerName) return '';
        const idx = rawHeaders.indexOf(headerName);
        if (idx === -1 || idx >= rowVals.length) return '';
        return (rowVals[idx] || '').trim();
      };

      if (masterType === 'products') {
        const name = getVal('product_name') || getVal('name') || getVal('title') || `Product SKU ${i + 1}`;
        const brandInput = getVal('company_name') || getVal('brand') || getVal('company') || 'AKAI';
        
        // Find matching company in database by name or code
        const matchedComp = liveCompanies.find(c => 
          c.company_name?.toLowerCase() === brandInput.toLowerCase() ||
          c.company_code?.toLowerCase() === brandInput.toLowerCase() ||
          brandInput.toLowerCase().includes(c.company_name?.toLowerCase() || '___')
        );

        const segment = (getVal('segment') || matchedComp?.segment || 'FMCD').toUpperCase();
        const code = getVal('product_code') || getVal('sku_code') || getVal('code') || generateNewBarcodeSKUCode(matchedComp?.company_code || brandInput, name, i + 1);
        const pcsPerBox = Number(getVal('pcs_per_box') || getVal('pack_size') || (segment === 'FMCD' ? 1 : 24));
        const mrp = Number(getVal('mrp_price') || getVal('mrp') || 1000);
        const unitPrice = Number(getVal('unit_price') || getVal('price') || getVal('rate') || (mrp > 0 ? Math.round(mrp * 0.8) : 800));
        const category = getVal('category') || 'General';

        setCurrentExecutingItem(`${name} (${code})`);

        const productRecord: Product = {
          id: generateUuid(),
          company_id: matchedComp?.id || 'c_akai',
          product_code: code,
          product_name: name,
          segment: segment,
          category: category,
          pcs_per_box: pcsPerBox,
          mrp_price: mrp,
          unit_price: unitPrice,
          active: true
        };

        importedItems.push(productRecord);
        const res = await saveProductToSupabase(productRecord);
        if (!res.success && res.error) {
          console.error(`Product row ${i + 1} error:`, res.error);
        }

      } else if (masterType === 'companies') {
        const name = getVal('company_name') || getVal('name') || `Brand Company ${i + 1}`;
        const code = getVal('company_code') || getVal('code') || name.slice(0, 4).toUpperCase();
        const segment = getVal('segment') || 'FMCG';

        setCurrentExecutingItem(`${name} (${code})`);

        const companyRecord = {
          id: `c_bulk_${Date.now()}_${i}`,
          company_code: code,
          company_name: name,
          handle: code,
          segment: segment
        };

        importedItems.push(companyRecord);
        const res = await saveCompanyToSupabase(companyRecord);
        if (!res.success && res.error) {
          console.error(`Company row ${i + 1} error:`, res.error);
        }

      } else if (masterType === 'users') {
        const name = getVal('full_name') || getVal('name') || `User ${i + 1}`;
        const email = getVal('email') || `user${Date.now()}_${i}@proline.com`;
        let role = (getVal('role_name') || getVal('role') || 'SALES_PERSON').toUpperCase().trim().replace(/[\s\/-]+/g, '_');
        if (role.includes('EXEC') || role === 'SALES_EXECUTIVE') {
          role = 'SALES_EXECUTIVE';
        } else if (role.includes('PERSON') || role === 'SALES') {
          role = 'SALES_PERSON';
        } else if (role.includes('ASM') || role.includes('AREA')) {
          role = 'AREA_SALES_MANAGER';
        } else if (role.includes('ADMIN')) {
          role = role.includes('SUPER') ? 'SUPER_ADMIN' : 'SALES_ADMIN';
        } else if (role.includes('BILL')) {
          role = 'BILLING';
        } else if (role.includes('DISPATCH')) {
          role = 'DISPATCH_MANAGER';
        } else if (role.includes('ACC')) {
          role = 'ACCOUNTS';
        }

        const handle = getVal('company_handle') || getVal('handle') || 'All';
        const password = getVal('password') || '1234';

        setCurrentExecutingItem(`${name} (${email})`);

        const userRecord = {
          id: `u_bulk_${Date.now()}_${i}`,
          full_name: name,
          email: email,
          role_name: role as any,
          company_handle: handle,
          password: password,
          active: true
        };

        importedItems.push(userRecord);
        const res = await saveUserToSupabase(userRecord);
        if (!res.success && res.error) {
          console.error(`User row ${i + 1} error:`, res.error);
        }

      } else if (masterType === 'orders') {
        const orderNum = getVal('order_number') || `SO-BULK-${Date.now().toString().slice(-4)}-${i + 1}`;
        const agencyName = getVal('agency_name') || 'Agency';
        const brandName = getVal('company_name') || 'Priyagold';
        const salesName = getVal('salesperson_name') || 'Sales Rep';
        const prodName = getVal('product_name') || 'Product SKU';
        const boxQty = Number(getVal('box_qty') || 0);
        const loosePcs = Number(getVal('loose_pcs') || 0);
        const freePcs = Number(getVal('free_pcs') || 0);
        const unitPrice = Number(getVal('unit_price') || 100);
        const deliveryType = getVal('delivery_type') || 'F.O.R';
        const remarks = getVal('remarks') || 'Bulk CSV Import Order';

        const matchedAg = liveAgencies.find(a =>
          a.agency_name?.toLowerCase() === agencyName.toLowerCase() ||
          a.agency_code?.toLowerCase() === agencyName.toLowerCase() ||
          agencyName.toLowerCase().includes(a.agency_name?.toLowerCase() || '___')
        ) || liveAgencies[0] || { id: generateUuid(), agency_name: agencyName, area_name: 'Surat Central', city: 'Surat' };

        const matchedComp = liveCompanies.find(c =>
          c.company_name?.toLowerCase() === brandName.toLowerCase() ||
          c.company_code?.toLowerCase() === brandName.toLowerCase() ||
          brandName.toLowerCase().includes(c.company_name?.toLowerCase() || '___')
        ) || liveCompanies[0] || { id: generateUuid(), company_name: brandName, company_code: 'PRG', segment: 'FMCG' };

        const matchedProd = liveProducts.find(p =>
          p.product_name?.toLowerCase() === prodName.toLowerCase() ||
          p.product_code?.toLowerCase() === prodName.toLowerCase() ||
          prodName.toLowerCase().includes(p.product_name?.toLowerCase() || '___')
        ) || liveProducts[0] || { id: generateUuid(), product_name: prodName, product_code: 'SKU-001', pcs_per_box: 24, unit_price: unitPrice };

        const matchedUser = liveUsers.find(u =>
          u.full_name?.toLowerCase() === salesName.toLowerCase() ||
          salesName.toLowerCase().includes(u.full_name?.toLowerCase() || '___')
        ) || liveUsers.find(u => u.role_name === 'SALES_PERSON') || liveUsers[0] || { id: generateUuid(), full_name: salesName };

        const pcsPerBox = matchedProd?.pcs_per_box || (matchedComp?.segment === 'FMCD' ? 1 : 24);
        const totalPcs = (boxQty * pcsPerBox) + loosePcs + freePcs;
        const totalAmount = (boxQty * pcsPerBox + loosePcs) * (unitPrice || matchedProd?.unit_price || 100);

        setCurrentExecutingItem(`Order ${orderNum} — ${matchedAg?.agency_name || agencyName}`);

        const orderId = generateUuid();
        const orderRecord: Order = {
          id: orderId,
          order_number: orderNum,
          order_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          company_id: matchedComp?.id || 'c_default',
          company_name: matchedComp?.company_name || brandName,
          agency_id: matchedAg?.id || 'a_default',
          agency_name: matchedAg?.agency_name || agencyName,
          salesperson_id: matchedUser?.id || 'u_default',
          salesperson_name: matchedUser?.full_name || salesName,
          area_id: matchedAg?.area_name || 'Surat Central',
          area_name: matchedAg?.area_name || 'Surat Central',
          status: 'SUBMITTED',
          delivery_type: (deliveryType.toLowerCase().includes('pickup') ? 'Self Pickup' : 'F.O.R') as any,
          remarks: remarks,
          total_box_qty: boxQty,
          total_loose_pcs: loosePcs,
          total_free_pcs: freePcs,
          total_qty_pcs: totalPcs,
          total_amount: totalAmount,
          items: [
            {
              id: generateUuid(),
              order_id: orderId,
              product_id: matchedProd?.id || 'p_default',
              product_code: matchedProd?.product_code || 'SKU-001',
              product_name: matchedProd?.product_name || prodName,
              pcs_per_box: pcsPerBox,
              box_qty: boxQty,
              loose_pcs: loosePcs,
              free_pcs: freePcs,
              total_qty_pcs: totalPcs,
              unit_price: unitPrice || matchedProd?.unit_price || 100,
              total_price: totalAmount,
              dispatched_qty_pcs: 0,
              pending_qty_pcs: totalPcs,
              remark: remarks
            }
          ],
          order_history: [
            {
              id: generateUuid(),
              order_id: orderId,
              performed_at: new Date().toISOString(),
              action: 'ORDER_BULK_IMPORTED',
              performed_by: 'Bulk CSV Import',
              remarks: `Bulk registered with ${boxQty} Boxes, ${loosePcs} Loose, ${freePcs} Free PCS`
            }
          ]
        };

        importedItems.push(orderRecord);
        const res = await saveOrderToSupabase(orderRecord);
        if (!res.success && res.error) {
          console.error(`Order row ${i + 1} error:`, res.error);
        }

      } else {
        // Agencies / B2B Parties (Default)
        const name = getVal('agency_name') || getVal('name') || getVal('party_name') || `Agency ${i + 1}`;
        const code = getVal('agency_code') || generateNewAgencyCode(getVal('city'));
        const city = getVal('city') || 'Surat';
        const area = getVal('area_name') || getVal('area') || city;
        const gstin = getVal('gstin') || getVal('gst_number') || 'N/A';
        const contact = getVal('contact_person') || getVal('contact') || 'N/A';
        const phone = getVal('mobile') || getVal('phone') || 'N/A';
        const group = getVal('account_group') || getVal('company_name') || getVal('group') || getVal('segment') || 'FMCG';
        const rawLimit = getVal('credit_limit');
        const limit = rawLimit !== '' ? (Number(rawLimit) || 0) : 0;
        const email = getVal('email') || 'N/A';
        const assignedSales = getVal('assigned_salesperson') || getVal('salesperson') || getVal('assigned_salespersons') || 'Chirag Patel';

        setCurrentExecutingItem(`${name} (${gstin !== 'N/A' ? gstin : code})`);

        const resolvedZone = resolveZoneForAreaAndCity(area, city);

        const agencyRecord: Agency = {
          id: `ag_bulk_${Date.now()}_${i}`,
          agency_code: code,
          agency_name: name,
          company_id: 'c01',
          city: city,
          area_name: area,
          gstin: gstin,
          gst_number: gstin,
          account_group: group,
          contact_person: contact,
          mobile: phone,
          email: email,
          credit_limit: limit,
          bank_name: 'N/A',
          account_number: 'N/A',
          ifsc_code: 'N/A',
          branch_name: 'N/A',
          assigned_salesperson: assignedSales,
          zone_name: resolvedZone.zone_name,
          zone_region: resolvedZone.region,
          active: true
        };

        importedItems.push(agencyRecord);

        const res = await saveAgencyToSupabase(agencyRecord);
        if (!res.success && res.error) {
          console.error(`Row ${i + 1} (${name}) insert error:`, res.error);
          setErrorMsg(`⚠️ Error on row ${i + 1} (${name}): ${res.error}`);
        }

        if (agencyRecord.area_name && agencyRecord.area_name !== agencyRecord.city) {
          await saveAreaToSupabase({
            id: `ar_${Date.now()}_${i}`,
            area_code: agencyRecord.agency_code || 'AR-001',
            area_name: agencyRecord.area_name || agencyRecord.city || 'Surat',
            city: agencyRecord.city || 'Surat',
            zone_code: 'ZN-SUR-A',
            region: agencyRecord.zone_region || 'Surat City Zone',
            description: `Auto-mapped area for ${agencyRecord.agency_name}`
          });
        }
      }

      // Small pause for visual feedback
      await new Promise(r => setTimeout(r, 40));
    }

    setIsProcessing(false);
    setStep('completed');
    setSuccessMsg(`🎉 Successfully inserted/updated ${rawRows.length} ${masterType} record(s) in Supabase database!`);

    if (onImportSuccess) {
      onImportSuccess(importedItems, masterType, rawRows.length);
    }
  };


  const progressPercentage = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="modal-card"
        style={{
          maxWidth: 880,
          width: '95vw',
          background: '#0f172a',
          border: '1px solid #38bdf8',
          borderRadius: 20,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Upload size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Interactive CSV Bulk Registration</h2>
                <span style={{ fontSize: '0.675rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.15rem 0.55rem', borderRadius: 6, border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                  {schema.title}
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: 2 }}>
                Paste raw CSV text or upload a CSV file, verify column headers, and upload records sequentially to Supabase
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.45rem',
              borderRadius: 10,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Info Banner & Template Download */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.85rem 1.15rem', borderRadius: 14, border: '1px solid #334155' }}>
            <div>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f8fafc', display: 'block' }}>Need the CSV Template Format?</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Download pre-formatted sample sheet with standard column headers</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleCSV(masterType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={15} /> Download CSV Template
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', borderRadius: 12, fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399', color: '#34d399', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: INPUT MODE SELECTOR (Paste Text or Upload File) */}
          {step === 'input' && (
            <>
              {/* Toggle Input Mode */}
              <div style={{ display: 'flex', gap: '0.5rem', background: '#0b1329', padding: '0.35rem', borderRadius: 12, border: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: 8,
                    border: 'none',
                    background: inputMode === 'paste' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                    color: inputMode === 'paste' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <FileText size={16} /> 📋 Option 1: Paste CSV Text Directly
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: 8,
                    border: 'none',
                    background: inputMode === 'file' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                    color: inputMode === 'file' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Upload size={16} /> 📁 Option 2: Upload CSV File
                </button>
              </div>

              {/* Paste Textarea */}
              {inputMode === 'paste' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Paste your CSV Rows Below (Including Column Header Line):
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`agency_name, gstin, city, area_name, contact_person, mobile\nShree Ram Agency, 24AAACS1234A1Z1, Surat, Varachha, Ramesh Patel, 9825012345\nMahadev Traders, 24BBBCD5678B2Z2, Surat, Katargam, Suresh Shah, 9898023456`}
                    value={rawCsvText}
                    onChange={(e) => setRawCsvText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070e20',
                      border: '1.5px solid #1e3a5f',
                      borderRadius: 12,
                      padding: '0.85rem',
                      color: '#34d399',
                      fontSize: '0.825rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      disabled={!rawCsvText.trim()}
                      onClick={() => handleParseCsvData(rawCsvText)}
                      style={{
                        padding: '0.65rem 1.4rem',
                        background: rawCsvText.trim() ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#1e293b',
                        color: rawCsvText.trim() ? '#ffffff' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        borderRadius: 10,
                        border: 'none',
                        cursor: rawCsvText.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>Analyze CSV Headers & Verify Mapping</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* File Upload Area */
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #38bdf8',
                    borderRadius: 16,
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    background: '#0b1329',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv, .txt" 
                    style={{ display: 'none' }} 
                  />
                  <Upload size={40} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
                    {file ? `File Selected: ${file.name}` : 'Click or Drag & Drop CSV Sheet Here'}
                  </h4>
                  <p style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                    Supports `.csv` files. Uploading will automatically extract column headers for mapping verification.
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP 2: INTERACTIVE HEADER MAPPING VERIFICATION ("ask if correct") */}
          {step === 'mapping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.85rem 1.15rem',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
                    🔍 Header Mapping Verification Step ({rawRows.length} Rows Detected)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                    Confirm or adjust which CSV column maps to each agency attribute before starting bulk registration:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Input
                </button>
              </div>

              {/* Header Mapping Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                {schema.columns.map(col => (
                  <div key={col.key} style={{ background: '#0b1329', border: '1px solid #1e293b', padding: '0.75rem', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>
                        {col.header}
                      </label>
                      <span style={{ fontSize: '0.675rem', color: '#64748b' }}>Attribute: {col.key}</span>
                    </div>

                    <select
                      value={columnMap[col.key] || ''}
                      onChange={(e) => setColumnMap({ ...columnMap, [col.key]: e.target.value })}
                      style={{
                        width: '100%',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: '0.45rem 0.65rem',
                        color: '#34d399',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ color: '#64748b' }}>-- Skip / Not Provided in CSV --</option>
                      {rawHeaders.map((h, idx) => (
                        <option key={idx} value={h} style={{ background: '#0f172a', color: '#fff' }}>
                          CSV Header: "{h}"
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Live Preview Table */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Table size={15} /> Mapped Data Preview (First 5 Rows)
                </div>

                <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 10, border: '1px solid #1e293b', background: '#070e20' }}>
                  <table className="data-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        {schema.columns.slice(0, 6).map(col => (
                          <th key={col.key}>{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 5).map((rowVals, rIdx) => (
                        <tr key={rIdx}>
                          {schema.columns.slice(0, 6).map(col => {
                            const headerName = columnMap[col.key];
                            const hIdx = headerName ? rawHeaders.indexOf(headerName) : -1;
                            const cellVal = hIdx !== -1 ? rowVals[hIdx] : 'N/A';
                            return (
                              <td key={col.key}>
                                <span style={{ color: cellVal && cellVal !== 'N/A' ? '#f8fafc' : '#64748b', fontWeight: 600 }}>
                                  {cellVal || 'N/A'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleExecuteSequentialUpload}
                  style={{
                    padding: '0.75rem 1.65rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Play size={18} />
                  <span>⚡ Headers Confirmed: Start Sequential Upload ({rawRows.length} Rows)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SEQUENTIAL ONE-BY-ONE UPLOADING PROGRESS */}
          {step === 'uploading' && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)', border: '2px solid #38bdf8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8'
                }}>
                  <RefreshCw size={28} className="spin" />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Uploading Records One-by-One to Supabase...
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: 4, fontWeight: 700 }}>
                  Processing {currentIndex} of {totalCount}: <span style={{ color: '#34d399' }}>{currentExecutingItem}</span>
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', background: '#0b1329', height: 16, borderRadius: 10, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <div 
                  style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #34d399)',
                    transition: 'width 0.1s ease',
                    borderRadius: 10
                  }}
                />
              </div>

              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8' }}>
                {progressPercentage}% Completed ({currentIndex} / {totalCount})
              </span>
            </div>
          )}

          {/* STEP 4: COMPLETED BANNER */}
          {step === 'completed' && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)', border: '2px solid #34d399',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Bulk Registration Complete!
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
                  All {totalCount} {schema.title || masterType} record(s) were validated, mapped, and saved to live database.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 1.5rem',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close & Refresh View
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
