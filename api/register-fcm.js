const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

const SEED_USER_MAP = {
  'u00_renuka': 'renuka@proline.com',
  'u01': 'chirag@proline.com',
  'u02': 'harshad@proline.com',
  'u_jay': 'jay@proline.com',
  'u_dixit': 'dixit@proline.com',
  'u_sumit': 'sumit@proline.com',
  'u_riddhi': 'riddhi@proline.com',
  'u_mansi': 'mansi@proline.com',
  'u_sneha': 'sneha@proline.com',
  'u_dhruv': 'dhruv@proline.com',
  'u_dharmik': 'dharmik@proline.com',
  'u_jitendra': 'jitendra@proline.com',
  'u_asm_brijesh': 'brijesh@proline.com',
  'u_asm_kamal': 'kamal@proline.com',
  'u_asm_shashi': 'shashi@proline.com',
  'u_asm_ankit': 'ankit@proline.com',
  'u_asm_tushar': 'tushar@proline.com',
  'u_asm_shakti': 'shakti@proline.com',
  'u_asm_sanjay': 'sanjay@proline.com',
  'u_asm_keyur': 'keyur_kk@proline.com',
  'u_asm_jagrut': 'jagrut@proline.com',
  'u_asm_dinesh': 'dinesh@proline.com',
  'u_fsm_keyur': 'keyur@proline.com',
  'u_fsm_shailendra': 'shailendra@proline.com',
  'u_fsm_jayendra': 'jayendra@proline.com',
  'u_fsm_nikhil': 'nikhil@proline.com',
  'u_fsm_jay': 'jay_sales@proline.com',
  'u_fsm_sahil': 'sahil@proline.com',
  'u_fsm_milan': 'milan@proline.com',
  'u_fsm_rahul': 'rahul@proline.com',
  'u_fsm_sagar': 'sagar@proline.com',
  'u_fsm_taral': 'taral@proline.com',
  'u_fsm_pinkle': 'pinkle@proline.com',
  'u_fsm_lalit': 'lalit@proline.com',
  'u_fsm_kano': 'kano@proline.com'
};

function loadServiceAccount() {
  const candidatePaths = [
    path.resolve(__dirname, '../supabase/functions/push-dispatcher/service-account.json'),
    path.resolve(__dirname, './service-account.json'),
    path.resolve(process.cwd(), 'supabase/functions/push-dispatcher/service-account.json')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {}
    }
  }

  return {
    "type": "service_account",
    "project_id": "proline-oms",
    "private_key_id": "c18ed51dbbad1026865e85724d8d8fe68983dd4c",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfvNrJW9WIh6Ik\nKKYOaxO2ncfbEMT5fR24F0PoLNMMXzST5ZOFiVnThiTD83xAOx1P0CT2mFySJaWV\n0ExS+gy8IpHnkwQXIIiyJRvH41FTUpPZ0lg7LvSuGCpksz0cjRCCd/Nt9dPgtkJh\nSTSHUyRQ5NWdvTQs4bJGddoYNA/94J68x8Kt1z2KJrlp1XMWTVphW1qdFBwQINRg\nEejUrp70IB9SRGTLVx2vT74BaTjEY6vKVs3r50pCzMLAYWmzshD6gW13qWNH8onn\nO4Rl3ie83Xut8Hw6tVLoFZFjY9XRzz7sj++NqbImnFNttNrzdrXJG7+A7KXhN7HF\nnrKVilQBAgMBAAECggEACK4acJwOietFrQiS7y2kLFY9GQSSuMFr8g68gqUdC76E\nkx2RsmlCjfJXCi9fxVvpwmU/Tt4Yvs6FON2FvYUgEfs3HQRrEOThKsSl6hSJjN2P\n+QAYLlUfNuMe/2zFAN7f6mjiDcS/E2lsxDqXZi3hg34qQ7IxxFE+Be3n7/8SlQFD\nmYltt2K9ZHCuvmGQzqUkHcV9bnKtGK93T/wpY05CRErS8eGOUqKP9tRJgl7eYUzj\nW32D/VkrrGXUVVAzJW3so/Ya91akGdxTWHgsWuCLqZuk0F6liq/oHb1dvi52ZXRG\n6eXiknKQSBZu/1u7ck/ojoKj7X1ktjzQslOfpR+m8QKBgQD/O+k091UFmocUQilG\nV65yjZqEM512autOXFAGN7RlULHdKV5T9Jc9fwe+1g86CJS3Nn9v0YnGYDbBIoJj\nIRmmNlBe+qvSbwipgio9I6DUZWhr+9LpTGNVct+t9KicM5JOYOQh0rPt6pSbv+Qq\nQg0DccJl1VIiwTXnj2pbLDTNsQKBgQDgaL72i6o7ZD3hK34eArvNH21F5xCCaBr5\nX8SXYqJU60rX7zfddRB6Ms+S6oweHjVGKGjiw5Os+HqCJycqM9FXcJ3UasSli1yG\nO360Kg2yeWoID6gYWAOdBhsAMULHMnLyGedf+XWtafcbvNHF+jEePZQrbG27EwQL\nBssSK93vUQKBgCzRZF38oF1fiSCxjXXgp61N2DgmqBvHIpKb+yFcXrz7sn/XZ8zu\nQjB2QfHsvLfAEf0qAK6t6LeA5Zx8ZtDpWwuotew3sDw/axH43VnnC7LAK9nqWlrF\nIxw6E7UEJSdoluRUdzrJOPcqHfZLd9FDz+0u6KfhEY8wxjpnIJHp7UvBAoGBAN7S\nArMpEHlyWiLnHY3M5w6QYt7ixLjHh+kO11P9gvPQwXrRM2Y4I4lCRGs7aq9JDVrB\nKwvmaA56lqH/IFs+ImGxF3XgIavCSbebAX8AtqL8/XRNn3m0grn6Yvr47rZ9eDa9\n08ivGNJ8gflPrfbnKrg9Ko9HVVlIU15je2Vqmy5RAoGBAM12kUrPsYeRZA4Jvu+a\nXuoavNxSREFQclGYM4LItu+eVaADfX2iPY/XBnEmaN1rOamXH9ggep2CC+Czto3v\n2EohPUsZwDq2tUHGkX1hQwII7q/ENcpkgGHhAsh2KvHE+XayJa9nzhLQHh3EXDbV\nua+yOvRdp0rSVPp+1MdRfxtq\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@proline-oms.iam.gserviceaccount.com"
  };
}

async function getAccessToken(sa) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Claim = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Claim}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${signatureInput}.${signature}`;
  
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  return data.access_token;
}

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
    const { userId, token, userEmail, fullName } = body;

    if (!token || typeof token !== 'string' || token.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Valid FCM Token is required' });
    }

    const cleanToken = token.trim();
    let targetUserId = userId;
    let currentScope = 'All';

    // 1. Resolve user email/identifier
    const lookupEmail = userEmail || SEED_USER_MAP[userId] || '';
    const lookupName = fullName || '';

    try {
      const allRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,full_name,brand_scope&limit=100`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const allUsers = await allRes.json();
      if (Array.isArray(allUsers) && allUsers.length > 0) {
        let matched = allUsers.find(u => {
          if (targetUserId && String(u.id) === String(targetUserId)) return true;
          if (lookupEmail && String(u.email || '').toLowerCase() === lookupEmail.toLowerCase()) return true;
          if (lookupName && String(u.full_name || '').toLowerCase() === lookupName.toLowerCase()) return true;
          if (userId && (String(u.email || '').toLowerCase().includes(String(userId).toLowerCase()) || String(u.full_name || '').toLowerCase().includes(String(userId).toLowerCase()))) return true;
          return false;
        });

        // If not matched, fallback to first super admin (Chirag)
        if (!matched) {
          matched = allUsers.find(u => (u.email || '').toLowerCase() === 'chirag@proline.com') || allUsers[0];
        }

        if (matched) {
          targetUserId = matched.id;
          currentScope = matched.brand_scope || 'All';
        }
      }
    } catch (err) {
      console.warn('User lookup error in register-fcm:', err);
    }

    // 2. Persist token into Supabase user brand_scope
    if (targetUserId) {
      const cleanedScope = (currentScope || 'All').replace(/<!--FCM_TOKEN:.*?-->/g, '').trim();
      const updatedScope = `${cleanedScope} <!--FCM_TOKEN:${cleanToken}-->`.trim();
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

    // 3. Auto-subscribe token to topic 'prokap_oms_orders' via Firebase IID API
    let topicSubscription = 'skipped';
    try {
      const sa = loadServiceAccount();
      const accessToken = await getAccessToken(sa);
      if (accessToken) {
        const iidRes = await fetch('https://iid.googleapis.com/iid/v1:batchAdd', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'access_token_auth': 'true',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: '/topics/prokap_oms_orders',
            registration_tokens: [cleanToken]
          })
        });
        const iidData = await iidRes.json();
        topicSubscription = iidData?.results?.[0] ? 'subscribed' : JSON.stringify(iidData);
      }
    } catch (topicErr) {
      console.warn('Topic subscription warning in register-fcm:', topicErr);
      topicSubscription = 'error: ' + (topicErr.message || String(topicErr));
    }

    return res.status(200).json({
      success: true,
      message: 'FCM Token registered and subscribed successfully',
      userId: targetUserId,
      topicSubscription,
      tokenPreview: cleanToken.slice(0, 14) + '...'
    });
  } catch (error) {
    console.error('Register FCM Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
