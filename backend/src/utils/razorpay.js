const Razorpay = require('razorpay');

function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const err = new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET is not set');
        err.statusCode = 500;
        throw err;
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function toPaise(amountInRupees) {
    return Math.round(Number(amountInRupees) * 100);
}

async function refundRazorpayPayment({
    paymentId,
    amountPaise,
    notes,
    speed = 'optimum',
    receipt = null
}) {
    if (!paymentId) {
        const err = new Error('paymentId is required for Razorpay refund');
        err.statusCode = 400;
        throw err;
    }

    const client = getRazorpayClient();

    const params = {};
    if (typeof amountPaise === 'number') params.amount = amountPaise;
    if (notes && typeof notes === 'object') params.notes = notes;
    if (speed) params.speed = speed;
    if (receipt !== undefined) params.receipt = receipt;

    return client.payments.refund(paymentId, params);
}

module.exports = {
    getRazorpayClient,
    toPaise,
    refundRazorpayPayment
};
