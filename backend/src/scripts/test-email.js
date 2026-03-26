const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env from project root and from backend/src/.env (if present)
dotenv.config();
const localEnvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
}

const { sendOTPEmail } = require('../utils/emailService');

function getArgValue(flag, fallback) {
    const index = process.argv.indexOf(flag);
    if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
    return fallback;
}

async function main() {
    const to = getArgValue('--to', process.env.EMAIL_TEST_TO || 'sureshreddy5093@gmail.com');
    const purpose = getArgValue('--purpose', 'login');
    const otp = getArgValue('--otp', '123456');

    console.log('Testing email delivery with:');
    console.log('- EMAIL_DELIVERY:', process.env.EMAIL_DELIVERY);
    console.log('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('- EMAIL_USER:', process.env.EMAIL_USER);
    console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
    console.log('- To:', to);

    const result = await sendOTPEmail(to, otp, purpose);
    console.log('Result:', result);

    if (!result?.success) {
        process.exitCode = 1;
    }
}

main().catch((err) => {
    console.error('Email test failed:', err);
    process.exit(1);
});
