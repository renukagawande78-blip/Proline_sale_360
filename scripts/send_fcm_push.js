const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const saPath = path.resolve(__dirname, '../supabase/functions/push-dispatcher/service-account.json');
if (!fs.existsSync(saPath)) {
  console.error('Service account key not found at:', saPath);
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

async function getAccessToken() {
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

async function sendPushNotification({ targetToken, topic, title, body, data }) {
  const accessToken = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  
  const message = {
    notification: {
      title: title || 'PROKAP OMS 360 Alert',
      body: body || 'New order status update'
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
    data: data || {
      event_type: 'ORDER_APPROVED',
      order_id: 'OR-2026-001',
      brand: 'Orion'
    }
  };

  if (targetToken) {
    message.token = targetToken;
  } else if (topic) {
    message.topic = topic;
  } else {
    throw new Error('Either targetToken or topic must be provided.');
  }

  console.log(`Sending FCM push to ${targetToken ? 'Device Token' : 'Topic: ' + topic}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  const result = await response.json();
  if (!response.ok) {
    console.error('FCM Send Error:', result);
    return { success: false, error: result };
  }

  console.log('FCM Push Notification Sent Successfully! Message ID:', result.name);
  return { success: true, result };
}

// CLI Execution
const tokenArg = process.argv[2];
if (tokenArg) {
  sendPushNotification({
    targetToken: tokenArg,
    title: process.argv[3] || '🔥 PROKAP OMS 360 Order Alert',
    body: process.argv[4] || 'New Order OR-2026-999 (Orion FMCG) Approved by Super Admin!'
  }).then(r => console.log('Result:', r)).catch(console.error);
} else {
  module.exports = { sendPushNotification };
}
