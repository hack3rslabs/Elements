/**
 * Unified OTP Delivery Utility
 * Supports Msg91, Twilio, and Simulation Mode.
 */

const twilio = require('twilio');

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

let twilioClient;
if (TWILIO_SID && TWILIO_TOKEN) {
    twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
}

/**
 * Sends an OTP via Msg91
 */
async function sendMsg91Otp(phone, otp) {
    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
        throw new Error('Msg91 credentials missing');
    }

    // Msg91 expects phone without '+' for some configurations, but usually E.164 works.
    // We'll strip '+' if present just in case for their 'mobile' parameter.
    const mobile = phone.startsWith('+') ? phone.substring(1) : phone;
    
    const MSG91_DLT_TE_ID = process.env.MSG91_DLT_TE_ID;
    
    let url = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${mobile}&authkey=${MSG91_AUTH_KEY}&otp=${otp}`;
    
    // Add DLT Template ID if provided (Required for Indian SMS)
    if (MSG91_DLT_TE_ID) {
        url += `&dlt_te_id=${MSG91_DLT_TE_ID}`;
    }
    
    console.log(`[AUTH] Attempting Msg91 delivery to ${mobile}...`);
    
    // Using GET as it is the standard for Msg91 v5 OTP with query params
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    
    console.log(`[AUTH] Msg91 Response:`, JSON.stringify(data));
    
    if (data.type === 'error') {
        throw new Error(`Msg91 Error: ${data.message}`);
    }
    
    return data;
}

/**
 * Sends an OTP via Twilio
 */
async function sendTwilioOtp(phone, otp) {
    if (!twilioClient) throw new Error('Twilio not configured');
    
    return await twilioClient.messages.create({
        body: `Your Hindustan Elements verification code is: ${otp}. Valid for 5 minutes.`,
        from: TWILIO_PHONE,
        to: phone
    });
}

/**
 * Main Exported Function
 */
async function sendOtp(phone, otp) {
    // 1. Simulation Mode (Fallback)
    if (process.env.NODE_ENV === 'development' && !MSG91_AUTH_KEY && !TWILIO_SID) {
        console.log('\n' + '='.repeat(40));
        console.log(`[AUTH] SIMULATED OTP DELIVERY`);
        console.log(`[AUTH] Target: ${phone}`);
        console.log(`[AUTH] Code:   ${otp}`);
        console.log('='.repeat(40) + '\n');
        return { success: true, simulated: true };
    }

    // 2. Primary: Msg91
    if (MSG91_AUTH_KEY && MSG91_TEMPLATE_ID) {
        try {
            await sendMsg91Otp(phone, otp);
            console.log(`[AUTH] OTP sent via Msg91 to ${phone}`);
            return { success: true, provider: 'msg91' };
        } catch (err) {
            console.error('[AUTH] Msg91 Delivery Failed:', err.message);
            // Fallback to Twilio if configured
            if (!twilioClient) throw err;
        }
    }

    throw new Error('No OTP provider configured (Msg91/Twilio)');
}

module.exports = { sendOtp };
