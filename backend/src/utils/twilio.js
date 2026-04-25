const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let client;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

/**
 * Sends an OTP SMS to a phone number.
 * @param {string} phone - The phone number in E.164 format.
 * @param {string} otp - The 6-digit OTP code.
 */
const sendOtpSms = async (phone, otp) => {
    if (!client) {
        console.warn('Twilio client not initialized. Check your environment variables.');
        // For development/testing if no keys are provided yet
        console.log(`[DEV MODE] Sending OTP ${otp} to ${phone}`);
        return { success: true, devMode: true };
    }

    try {
        const message = await client.messages.create({
            body: `Your Hindustan Elements verification code is: ${otp}. Valid for 5 minutes.`,
            from: fromPhone,
            to: phone
        });
        return { success: true, messageSid: message.sid };
    } catch (error) {
        console.error('Twilio Error:', error);
        throw new Error('Failed to send SMS');
    }
};

module.exports = { sendOtpSms };
