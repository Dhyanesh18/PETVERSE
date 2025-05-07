const mongoose = require('mongoose');
const User = require('../models/users');
const Seller = require('../models/seller');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Demo seller details
const demoSeller = {
    email: 'demo.seller@petverse.com',
    password: 'Petverse@123',
    fullName: 'Demo Seller',
    phone: '9876543210',
    username: 'demoseller',
    role: 'seller',
    isApproved: true,
    businessName: 'PetVerse Demo Shop',
    businessAddress: '123 Pet Street, Petville, 56789',
    taxId: 'TAX123456789',
    license: {
        data: Buffer.from('Demo License Document'),
        contentType: 'application/pdf'
    }
};

async function createDemoSeller() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if demo seller already exists
        const existingSeller = await User.findOne({ email: demoSeller.email });
        if (existingSeller) {
            console.log('Demo seller already exists');
            console.log('Email:', demoSeller.email);
            console.log('Password:', 'Petverse@123');
            mongoose.connection.close();
            return;
        }

        // Create the demo seller
        const newSeller = new Seller({
            email: demoSeller.email,
            password: demoSeller.password,
            fullName: demoSeller.fullName,
            phone: demoSeller.phone,
            username: demoSeller.username,
            role: demoSeller.role,
            isApproved: demoSeller.isApproved,
            businessName: demoSeller.businessName,
            businessAddress: demoSeller.businessAddress,
            taxId: demoSeller.taxId,
            license: demoSeller.license
        });

        await newSeller.save();
        console.log('Demo seller created successfully');
        console.log('Demo Seller Credentials:');
        console.log('Email:', demoSeller.email);
        console.log('Password:', 'Petverse@123');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating demo seller:', error);
        mongoose.connection.close();
    }
}

createDemoSeller(); 