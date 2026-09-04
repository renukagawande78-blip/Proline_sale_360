import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://psaguppgoigpxumzgvjx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(headerLine);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (vals.length === 1 && !vals[0]) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });
    rows.push(obj);
  }
  return { headers, rows };
};

async function main() {
  console.log('--- SYNCING AGENCY MASTER & PINCODES TO SUPABASE ---');

  // 1. Clear existing agencies
  console.log('Clearing old agencies...');
  let totalDeleted = 0;
  while (true) {
    const { data: existing, error } = await supabase.from('agencies').select('id').limit(100);
    if (error) {
      console.error('Fetch error during clear:', error.message);
      break;
    }
    if (!existing || existing.length === 0) break;
    const ids = existing.map(x => x.id);
    const { error: delErr } = await supabase.from('agencies').delete().in('id', ids);
    if (delErr) {
      console.error('Delete error:', delErr.message);
      break;
    }
    totalDeleted += ids.length;
    process.stdout.write('.');
  }
  console.log(`\nCleared ${totalDeleted} agencies.`);

  // 2. Read Agency CSV
  const csvPath = '/Users/renukagawande/.gemini/antigravity-ide/brain/74790226-435e-4a59-acb6-b8ccee3b72e9/.user_uploaded/media_1788479630084.csv';
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const { rows } = parseCSV(rawCsv);
  console.log(`Parsed ${rows.length} agency records from CSV.`);

  // Count duplicate names
  const nameCounts = {};
  rows.forEach(r => {
    const name = r['Agency Name']?.trim();
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  });

  const nowIso = new Date().toISOString();
  const seenNames = new Set();

  const agenciesToInsert = rows.map((r, idx) => {
    const cityName = (r['City'] || 'Surat').trim();
    const cityPrefix = (cityName || 'SUR').substring(0, 3).toUpperCase();
    const rawCode = r['Agency Code']?.trim();
    const cleanCode = rawCode || `AG-${cityPrefix}-${(idx + 1).toString().padStart(4, '0')}`;
    const segment = (r['Agency Type / Segment (FMCG / FMCD)'] || 'FMCG').toUpperCase().includes('FMCD') ? 'FMCD' : 'FMCG';
    const pin = (r['Pincode'] || '').trim();
    const zone = (r['Zone'] || r['Zone.1'] || 'Surat City').trim();
    const region = (r['Region_Type'] || r['Zone Type'] || 'Surat City').trim();
    const area = (r['Area / Territory'] || cityName).trim();

    let rawName = r['Agency Name']?.trim() || `Agency ${idx + 1}`;
    if (nameCounts[rawName] > 1) {
      if (seenNames.has(rawName)) {
        if (segment) {
          rawName = `${rawName} (${segment})`;
        } else if (area) {
          rawName = `${rawName} (${area})`;
        } else {
          rawName = `${rawName} - ${idx + 1}`;
        }
      } else {
        seenNames.add(rawName);
      }
    }

    return {
      id: `00000000-0000-0000-0000-${(idx + 1).toString(16).padStart(12, '0')}`,
      agency_code: cleanCode,
      agency_name: rawName,
      area_name: area,
      area: area,
      city: cityName,
      district: cityName,
      location: cityName,
      address: pin || area,
      gstin: (r['GSTIN Number'] || '').trim() || null,
      gst_number: (r['GSTIN Number'] || '').trim() || null,
      account_group: segment,
      contact_person: (r['Contact Person'] || '').trim() || null,
      mobile: (r['Mobile'] || '').trim() || null,
      phone: (r['Mobile'] || '').trim() || null,
      email: (r['Email'] || '').trim() || null,
      credit_limit: parseFloat(r['Credit Limit (INR)']) || 0,
      assigned_salesperson: (r['Assigned Salespersons'] || '').trim() || 'Chirag Desai',
      zone_name: zone,
      zone_region: region,
      active: true,
      created_at: nowIso,
      updated_at: nowIso,
      sno: idx + 1
    };
  });

  console.log(`Inserting ${agenciesToInsert.length} agencies in chunks of 50...`);
  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < agenciesToInsert.length; i += chunkSize) {
    const chunk = agenciesToInsert.slice(i, i + chunkSize);
    const { error: insErr } = await supabase.from('agencies').insert(chunk);
    if (insErr) {
      console.error(`\nInsert error at batch ${i}:`, insErr.message);
      // If error is duplicate name or constraint, retry single rows
      for (const single of chunk) {
        const { error: sErr } = await supabase.from('agencies').insert([single]);
        if (sErr) {
          console.error(`Single insert error for ${single.agency_name}:`, sErr.message);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += chunk.length;
      process.stdout.write('.');
    }
  }

  console.log(`\nSuccessfully inserted ${inserted} agencies into Supabase!`);
  const { count: finalCount } = await supabase.from('agencies').select('*', { count: 'exact', head: true });
  console.log(`Final verified Supabase Agency count: ${finalCount}`);
}

main().catch(console.error);
