import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectMappings() {
  const { data: users, error: uErr } = await supabase.from('users').select('*').limit(2);
  if (uErr) {
    console.error('Error fetching users:', uErr);
  } else {
    console.log('User sample keys:', Object.keys(users[0] || {}));
  }

  const { data: companies, error: cErr } = await supabase.from('companies').select('*');
  if (cErr) {
    console.error('Error fetching companies:', cErr);
    return;
  }
  
  for (const c of companies) {
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', c.id);
    const { count: agCount } = await supabase.from('agencies').select('*', { count: 'exact', head: true }).eq('company_id', c.id);
    console.log(`Brand: ${c.handle} (ID: ${c.id}, Segment: ${c.segment}) | Products: ${prodCount} | Agencies: ${agCount}`);
  }
}

inspectMappings().catch(console.error);
