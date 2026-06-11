// API endpoint to validate Lemonsqueezy license keys
const LEMONSQUEEZY_API = 'https://api.lemonsqueezy.com/v1';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseKey } = req.body;
  if (!licenseKey || typeof licenseKey !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing license key' });
  }

  try {
    // Validate license via Lemonsqueezy API
    const response = await fetch(`${LEMONSQUEEZY_API}/licenses/validate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({ license_key: licenseKey, store_id: parseInt(process.env.LEMONSQUEEZY_STORE_ID, 10) }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ valid: false, error: data.errors?.[0]?.detail || 'Invalid license' });
    }

    const status = data.license_key?.status;
    if (status === 'active') {
      return res.status(200).json({
        valid: true,
        customerEmail: data.license_key?.customer_email,
        expiresAt: data.license_key?.expires_at,
      });
    }

    return res.status(200).json({
      valid: false,
      error: status === 'expired' ? 'License has expired' : `License status: ${status}`,
    });
  } catch (e) {
    return res.status(200).json({ valid: false, error: 'Unable to verify license. Please try again.' });
  }
}
