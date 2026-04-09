// api/send-catalogue.js
// Vercel Serverless Function — Meta WhatsApp Cloud API catalogue delivery
// Required environment variables (set in Vercel dashboard → Settings → Environment Variables):
//   WHATSAPP_TOKEN      — Permanent access token from Meta Business App
//   WHATSAPP_PHONE_ID   — Phone Number ID from WhatsApp → API Setup
//   CATALOGUE_MEDIA_ID  — Media ID from uploading the catalogue PDF to Meta

export default async function handler(req, res) {

    // ── CORS: only allow requests from our own domain ──────────────────────────
    const allowedOrigins = [
        'https://al-shams-web-5zdk.vercel.app',
        'http://localhost:3000', // local dev
    ];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // ── Input Validation ───────────────────────────────────────────────────────
    const { name, phone } = req.body || {};

    // Sanitize name — letters and spaces only, max 50 chars
    const sanitizedName = String(name || '').replace(/[^a-zA-Z\s]/g, '').trim().slice(0, 50);
    if (!sanitizedName) {
        return res.status(400).json({ success: false, error: 'Valid name is required.' });
    }

    // Normalize phone — strip non-digits, keep last 10 digits (Indian number)
    const phoneDigits = String(phone || '').replace(/\D/g, '').slice(-10);
    if (phoneDigits.length < 10) {
        return res.status(400).json({ success: false, error: 'Valid 10-digit phone number is required.' });
    }

    // Build WhatsApp recipient ID — Indian country code prefix
    const recipientWaId = `91${phoneDigits}`;

    // ── Environment Variables ───────────────────────────────────────────────────
    const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, CATALOGUE_MEDIA_ID } = process.env;

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !CATALOGUE_MEDIA_ID) {
        console.error('[send-catalogue] Missing one or more required environment variables.');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    // ── Build WhatsApp Message ─────────────────────────────────────────────────
    const caption =
        `Hi ${sanitizedName}! 🏠\n\n` +
        `Here is the *Al Shams Traders* exclusive full catalogue — over 1,000+ premium tile & marble designs.\n\n` +
        `📍 No: 7/3-A, Ponneri Bypass Rd, Near Rani Mahal, Virudhachalam\n` +
        `📞 +91 95002 08677\n` +
        `🕘 Open Daily: 9 AM – 8 PM\n\n` +
        `— *Al Shams Team*`;

    // ── Call Meta WhatsApp Cloud API ───────────────────────────────────────────
    let waResponse, waData;
    try {
        waResponse = await fetch(
            `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: recipientWaId,
                    type: 'document',
                    document: {
                        id: CATALOGUE_MEDIA_ID,
                        caption: caption,
                        filename: 'Al_Shams_Traders_Exclusive_Catalogue.pdf',
                    },
                }),
            }
        );
        waData = await waResponse.json();
    } catch (err) {
        console.error('[send-catalogue] Network error calling Meta API:', err);
        return res.status(502).json({ success: false, error: 'Could not reach WhatsApp API.' });
    }

    if (!waResponse.ok) {
        // Log full error from Meta for debugging in Vercel function logs
        console.error('[send-catalogue] Meta API error:', JSON.stringify(waData));
        return res.status(502).json({ success: false, error: 'WhatsApp API rejected the request.' });
    }

    // ── Success ────────────────────────────────────────────────────────────────
    console.log(`[send-catalogue] Catalogue sent to ${recipientWaId} — message id: ${waData?.messages?.[0]?.id}`);
    return res.status(200).json({ success: true });
}
