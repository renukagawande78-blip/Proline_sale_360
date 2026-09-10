import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectAgencies() {
  const { data: agencies, error } = await supabase.from('agencies').select('*').limit(5);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample Agency:', agencies[0]);
  }
}

inspectAgencies().catch(console.error);
