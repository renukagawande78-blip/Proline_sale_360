import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Canonical area mappings
const CANONICAL_MAPPINGS = {
  'l h road': { area_name: 'L H ROAD', city: 'SURAT', zone_name: 'City-A', zone_region: 'Surat City' },
  'punagam': { area_name: 'PUNAGAM', city: 'SURAT', zone_name: 'City-B', zone_region: 'Surat City' },
  'udhna': { area_name: 'UDHNA', city: 'SURAT', zone_name: 'City-D', zone_region: 'Surat City' },
  'umbergoan': { area_name: 'Umbergaon', city: 'Umbergaon', zone_name: 'Upper South', zone_region: 'Surat Rural' },
  'umbergaon': { area_name: 'Umbergaon', city: 'Umbergaon', zone_name: 'Upper South', zone_region: 'Surat Rural' },
  'vadodara': { area_name: 'Vadodara', city: 'Vadodara', zone_name: 'Z', zone_region: 'Out of Surat' },
  'kadodara': { area_name: 'Kadodara', city: 'Surat', zone_name: 'South', zone_region: 'Surat Rural' }
};

async function main() {
  console.log('Fetching all agencies from Supabase...');
  const { data: agencies, error } = await supabase.from('agencies').select('*');
  if (error) {
    console.error('Error fetching agencies:', error);
    return;
  }
  console.log(`Total agencies fetched: ${agencies.length}`);

  let updatedCount = 0;
  for (const ag of agencies) {
    const areaNorm = (ag.area_name || '').trim().toLowerCase();
    const mapMatch = CANONICAL_MAPPINGS[areaNorm];
    
    if (mapMatch) {
      const needsUpdate = 
        ag.zone_name !== mapMatch.zone_name || 
        ag.zone_region !== mapMatch.zone_region || 
        (mapMatch.city && ag.city?.toLowerCase() !== mapMatch.city.toLowerCase());

      if (needsUpdate) {
        console.log(`Updating Agency: ${ag.agency_name} (${ag.agency_code})`);
        console.log(`  Before: Area: ${ag.area_name}, City: ${ag.city}, Zone: ${ag.zone_name}, Region: ${ag.zone_region}`);
        console.log(`  After:  Area: ${mapMatch.area_name}, City: ${mapMatch.city}, Zone: ${mapMatch.zone_name}, Region: ${mapMatch.zone_region}`);
        
        const { error: updateError } = await supabase.from('agencies').update({
          area_name: mapMatch.area_name,
          city: mapMatch.city,
          zone_name: mapMatch.zone_name,
          zone_region: mapMatch.zone_region
        }).eq('id', ag.id);

        if (updateError) {
          console.error(`  Error updating ${ag.agency_name}:`, updateError.message);
        } else {
          updatedCount++;
        }
      }
    }
  }

  // Also check if 'Vadodara' area is in 'areas' table, if not, insert it
  const { data: existingAreas } = await supabase.from('areas').select('*').eq('area_name', 'Vadodara');
  if (!existingAreas || existingAreas.length === 0) {
    console.log('Registering Vadodara in Supabase areas table...');
    await supabase.from('areas').insert({
      id: `ar_vadodara_${Date.now()}`,
      area_code: 'AR-VAD-001',
      area_name: 'Vadodara',
      city: 'Vadodara',
      zone_code: 'Z',
      region: 'Other',
      description: 'Out of Surat - Vadodara Central Hub'
    });
  }

  console.log(`\nFinished! Successfully updated ${updatedCount} agencies as per Area Master.`);
}

main().catch(console.error);
