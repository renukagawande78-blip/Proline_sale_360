const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://psaguppgoigpxumzgvjx.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYWd1cHBnb2lncHh1bXpndmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjYyNjcsImV4cCI6MjEwMTcwMjI2N30.fJbplLizPdrvvxWlZ2L-Nh32RCaAnpJhXVPP4cWqj68';

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

  // Fallback to embedded credentials if file is not found in serverless bundle
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
  if (!data.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function sendSingleMessage(accessToken, projectId, target, title, body, dataPayload) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const message = {
    notification: {
      title: String(title || 'PROKAP OMS 360 Alert'),
      body: String(body || 'Order notification update')
    },
    android: {
      priority: 'high',
      notification: {
        channel_id: 'proline_orders',
        sound: 'default',
        default_sound: true,
        default_vibrate_timings: true,
        notification_priority: 'PRIORITY_MAX',
        visibility: 'PUBLIC'
      }
    },
    data: Object.fromEntries(
      Object.entries(dataPayload || {}).map(([k, v]) => [k, String(v ?? '')])
    )
  };

  if (target.token) message.token = target.token;
  else if (target.topic) message.topic = target.topic;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  return await res.json();
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
    const { title, message, body: textBody, tokens, topic, data } = body;
    const targetRoles = body.target_roles || body.targetRoles;
    const targetUserId = body.target_user_id || body.targetUserId;
    const alertTitle = title || 'PROKAP OMS 360 Alert';
    const alertBody = message || textBody || 'Realtime order alert';
    const dataPayload = {
      title: String(alertTitle),
      message: String(alertBody),
      event_type: String(data?.event_type || body.category || 'ORDER_ALERT'),
      order_id: String(data?.order_id || body.order_id || ''),
      timestamp: new Date().toISOString()
    };

    const sa = loadServiceAccount();
    const accessToken = await getAccessToken(sa);

    const recipientTokens = new Set();
    if (Array.isArray(tokens)) {
      tokens.forEach(t => t && recipientTokens.add(t));
    }
    if (body.token) recipientTokens.add(body.token);

    // Fetch registered tokens from Supabase users via REST API
    try {
      // Note: users table stores device push tokens embedded in brand_scope as <!--FCM_TOKEN:...-->
      let queryUrl = `${SUPABASE_URL}/rest/v1/users?select=id,role_name,brand_scope`;
      if (targetUserId) {
        queryUrl += `&id=eq.${encodeURIComponent(targetUserId)}`;
      }
      const usersRes = await fetch(queryUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const dbUsers = await usersRes.json();
      if (Array.isArray(dbUsers)) {
        dbUsers.forEach(u => {
          if (!targetRoles || targetRoles.length === 0 || targetRoles.includes(u.role_name)) {
            // Extract token from brand_scope <!--FCM_TOKEN:...-->
            const fcmMatch = (u.brand_scope || '').match(/<!--FCM_TOKEN:(.*?)-->/);
            if (fcmMatch && fcmMatch[1]) {
              const cleaned = fcmMatch[1].trim();
              if (cleaned.length > 20) {
                recipientTokens.add(cleaned);
              }
            }
            // Also check u.fcm_token in case column is added in future
            if (u.fcm_token && typeof u.fcm_token === 'string' && u.fcm_token.length > 20) {
              recipientTokens.add(u.fcm_token.trim());
            }
          }
        });
      }
    } catch (dbErr) {
      console.warn('Notice while querying users for tokens in send-fcm:', dbErr);
    }

    const dedupKey = `${body.order_id || ''}_${dataPayload.event_type}_${alertTitle.slice(0, 35)}`;
    const nowTimestamp = Date.now();
    if (!global.recentFcmAlerts) {
      global.recentFcmAlerts = new Map();
    }
    const lastSentAt = global.recentFcmAlerts.get(dedupKey);
    if (lastSentAt && (nowTimestamp - lastSentAt) < 20000) {
      console.log(`[FCM] Suppressed duplicate push within 20s: ${dedupKey}`);
      return res.status(200).json({ success: true, suppressed: true, reason: 'duplicate_suppressed' });
    }
    global.recentFcmAlerts.set(dedupKey, nowTimestamp);
    if (global.recentFcmAlerts.size > 200) {
      for (const [k, t] of global.recentFcmAlerts) {
        if (nowTimestamp - t > 60000) global.recentFcmAlerts.delete(k);
      }
    }

    const sendResults = [];

    // 1. Send to all registered user tokens
    for (const token of recipientTokens) {
      try {
        const sendRes = await sendSingleMessage(accessToken, sa.project_id, { token }, alertTitle, alertBody, dataPayload);
        sendResults.push({ token: token.slice(0, 12) + '...', result: sendRes });
      } catch (err) {
        sendResults.push({ token: token.slice(0, 12) + '...', error: err.message });
      }
    }

    // 2. Only send to topic if explicit topic provided or no specific tokens were found
    let topicResult = null;
    if (topic || recipientTokens.size === 0) {
      try {
        topicResult = await sendSingleMessage(accessToken, sa.project_id, { topic: topic || 'proline_orders' }, alertTitle, alertBody, dataPayload);
      } catch (tErr) {
        topicResult = { error: tErr.message };
      }
    }

    return res.status(200).json({
      success: true,
      deliveredTokensCount: recipientTokens.size,
      results: sendResults,
      topicResult
    });
  } catch (error) {
    console.error('FCM Send Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
