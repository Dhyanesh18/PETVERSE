const mongoose = require('mongoose');
const User = require('../models/users');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env from project root and from backend/src/.env (if present)
dotenv.config();
const localEnvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
}

function getArgValue(flag, fallback) {
    const index = process.argv.indexOf(flag);
    if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
    return fallback;
}

function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits;
}

async function main() {
    const email = (getArgValue('--email', 'sureshreddy5093@gmail.com') || '').toLowerCase();
    const password = getArgValue('--password', 'Petverse@123');
    const fullName = getArgValue('--fullName', 'Suresh Reddy');
    const phone = normalizePhone(getArgValue('--phone', '9999999999'));
    const role = getArgValue('--role', 'owner');

    if (!process.env.MONGODB_URI) {
        console.error('Missing MONGODB_URI in environment.');
        process.exit(1);
    }

    if (!email || !password) {
        console.error('Missing required args. Use --email and --password');
        process.exit(1);
    }

    if (!/^\d{10}$/.test(phone)) {
        console.error('Phone must be 10 digits. Provide --phone 9876543210');
        process.exit(1);
    }

    const baseUsername = (email.split('@')[0] || 'testuser')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 20) || 'testuser';

    await mongoose.connect(process.env.MONGODB_URI);

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('User already exists:', email);
            console.log('Role:', existing.role);
            process.exit(0);
        }

        let username = getArgValue('--username', baseUsername);

        // Ensure username uniqueness
        let suffix = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const taken = await User.findOne({ username });
            if (!taken) break;
            suffix += 1;
            username = `${baseUsername}${suffix}`;
        }

        const user = await User.create({
            email,
            password,
            fullName,
            phone,
            username,
            role
        });

        console.log('Created test user successfully:');
        console.log('Email:', user.email);
        console.log('Password:', password);
        console.log('Role:', user.role);
        console.log('Username:', user.username);
    } finally {
        await mongoose.connection.close();
    }
}

main().catch((err) => {
    console.error('Failed to create test user:', err);
    process.exit(1);
});
