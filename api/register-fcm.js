const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { userId, token, userEmail } = body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'FCM Token is required' });
    }

    let targetUserId = userId;
    let currentScope = 'All';

    // 1. Query user if userId or userEmail provided
    const identifier = userId || userEmail;
    if (identifier) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        let queryUrl;
        if (isUuid) {
          queryUrl = `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(identifier)}&select=id,brand_scope`;
        } else {
          queryUrl = `${SUPABASE_URL}/rest/v1/users?or=(email.ilike.*${encodeURIComponent(identifier)}*,full_name.ilike.*${encodeURIComponent(identifier)}*)&select=id,brand_scope`;
        }

        const userFetch = await fetch(queryUrl, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        let matched = await userFetch.json();
        if (!Array.isArray(matched) || matched.length === 0) {
          // Fallback: search all users and match by id, email, full_name
          const allRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,full_name,brand_scope&limit=100`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
          });
          const allUsers = await allRes.json();
          if (Array.isArray(allUsers)) {
            const found = allUsers.find(u => 
              String(u.id) === String(identifier) ||
              String(u.email || '').toLowerCase() === String(identifier).toLowerCase() ||
              String(u.full_name || '').toLowerCase() === String(identifier).toLowerCase()
            );
            if (found) {
              matched = [found];
            }
          }
        }

        if (Array.isArray(matched) && matched.length > 0) {
          targetUserId = matched[0].id;
          currentScope = matched[0].brand_scope || 'All';
        }
      } catch (err) {
        console.warn('User lookup notice in register-fcm:', err);
      }
    }

    // 2. Persist token to Supabase users via brand_scope <!--FCM_TOKEN:...-->
    if (targetUserId) {
      const cleanedScope = (currentScope || 'All').replace(/<!--FCM_TOKEN:.*?-->/g, '').trim();
      const updatedScope = `${cleanedScope} <!--FCM_TOKEN:${token}-->`.trim();
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(targetUserId)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            brand_scope: updatedScope,
            updated_at: new Date().toISOString()
          })
        });
      } catch (patchErr) {
        console.warn('Scope update error in register-fcm:', patchErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'FCM Token registered successfully',
      userId: targetUserId,
      tokenPreview: token.slice(0, 14) + '...'
    });
  } catch (error) {
    console.error('FCM Register Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
