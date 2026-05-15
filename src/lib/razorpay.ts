import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

// Prevent build-time crash by using placeholders if keys are missing.
// Runtime will still fail if keys are not provided in production.
export const razorpay = new Razorpay({
    key_id: key_id || "rzp_test_build_placeholder",
    key_secret: key_secret || "build_secret_placeholder",
});
