const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const port = 8080;
const app = express();
const session = require('express-session');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// Session Management ---------------------
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 24*60*60*1000  // 1 day
    }
}));
// -----------------------------------------

// Add this before your route handlers
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const User = require('./models/users');
            req.user = await User.findById(req.session.userId);
        } catch (err) {
            console.error('User loading error:', err);
        }
    }
    next();
});

// Mount the routes ------------------------
const authRoutes = require('./routes/auth-routes');
const adminRoutes = require('./routes/admin-routes');
const imageRoutes = require('./routes/image-routes');
const productRoutes = require('./routes/product-routes');
app.use('/seller', productRoutes);
app.use('/', imageRoutes); 
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
// -----------------------------------------


// Connect to MongoDB Atlas ----------------
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
    console.log('MongoDB connected');
    })
.catch(err => console.error('Connection failed:', err));
// ------------------------------------------


app.get('/', (req, res) => {
    res.render('login', {error: null});  
});


app.listen(port, () => {
    console.log(`PetVerse app listening at http://localhost:${port}`);
});