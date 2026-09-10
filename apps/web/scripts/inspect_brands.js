import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectAndSeed() {
  console.log('--- Fetching Companies/Brands ---');
  const { data: companies, error: compErr } = await supabase.from('companies').select('*');
  if (compErr) {
    console.error('Error fetching companies:', compErr);
    return;
  }
  console.log(`Found ${companies.length} companies:`, companies.map(c => ({ id: c.id, name: c.name, handle: c.handle, segment: c.segment })));

  console.log('\n--- Fetching Products ---');
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  if (prodErr) {
    console.error('Error fetching products:', prodErr);
    return;
  }
  console.log(`Found ${products.length} products`);

  console.log('\n--- Fetching Agencies ---');
  const { data: agencies, error: agErr } = await supabase.from('agencies').select('*');
  if (agErr) {
    console.error('Error fetching agencies:', agErr);
    return;
  }
  console.log(`Found ${agencies.length} agencies`);

  console.log('\n--- Fetching Users ---');
  const { data: users, error: userErr } = await supabase.from('users').select('*');
  if (userErr) {
    console.error('Error fetching users:', userErr);
    return;
  }
  console.log(`Found ${users.length} users`);
}

inspectAndSeed().catch(console.error);
