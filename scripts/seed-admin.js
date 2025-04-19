const User = require('../models/users');
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://gamerksd18:jZoFscKX4ZNPWmDY@cluster0.kd8kkec.mongodb.net/petverseDB?retryWrites=true&w=majority&appName=Cluster0")
    .then(async () => {
    await User.create({
        email: 'admin@petverse.com',
        password: 'SecureAdminPass123!', 
        fullName: 'System Admin',
        phone: '1234567890',
        username: 'systemadmin',
        role: 'admin',
        isAdmin: true,
    });
    console.log('Admin account created!');
    process.exit();
    })
    .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});