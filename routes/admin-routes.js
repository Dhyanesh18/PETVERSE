const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin-auth');

router.get('/dashboard', adminAuth, (req, res)=>{
    res.render('admin/dashboard');
});

router.get('/users', adminAuth, async (req, res)=>{
    const users = await User.find();
    res.render('admin/users', {users});
});

module.exports = router;