import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkValidStatuses() {
  const { data } = await supabase.from('orders').select('status');
  const distinctStatuses = [...new Set(data?.map(o => o.status))];
  console.log('Distinct order statuses in DB:', distinctStatuses);

  const { data: itemSample } = await supabase.from('order_items').select('*').limit(1);
  console.log('Order item sample:', itemSample);
}

checkValidStatuses().catch(console.error);
