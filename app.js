const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const User = require('./models/users');
      req.user = await User.findById(req.session.userId);
      
      if (!req.user) {
        // Clear invalid session data
        req.session.userId = null;
        req.session.userRole = null;
      }
    } catch (err) {
      console.error('User loading error:', err);
      // Clear session on error
      req.session.userId = null;
      req.session.userRole = null;
    }
  } 
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Connection failed:', err));

const authRoutes = require('./routes/auth-routes');
const adminRoutes = require('./routes/admin-routes');
const imageRoutes = require('./routes/image-routes');
const productRoutes = require('./routes/product-routes');
const bookingRoutes = require('./routes/booking');
const reviewRoutes = require('./routes/review-routes');
const serviceProviderRoutes = require('./routes/service-provider-routes');

const userRoutes = require('./routes/user-routes');
const cartRoutes = require('./routes/cart');
const petRoutes = require('./routes/pet-routes');
const mateRoutes = require('./routes/mate-routes');
const sellerRoutes = require('./routes/seller');
const serviceRoutes = require('./routes/services-routes');
const paymentRoutes = require('./routes/payment');

// Main routes
app.use('/', userRoutes);
app.use('/', authRoutes);
app.use('/', imageRoutes);

// Pet related routes
app.use('/pets', mateRoutes);
app.use('/seller', petRoutes);

// Seller related routes
app.use('/seller', sellerRoutes);
app.use('/seller', productRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// Service routes
app.use('/cart', cartRoutes);
app.use('/booking', bookingRoutes);
app.use('/services',serviceRoutes);
app.use('/service-provider', serviceProviderRoutes);
app.use('/', reviewRoutes);
app.use('/',paymentRoutes);

app.get('/', (req, res) => {
  if (req.session.userId) {
    // If user is logged in, redirect to home page
    res.redirect('/home');
  } else {
    // If no user is logged in, show login page
    res.render('login', { error: null });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`PetVerse app listening at http://localhost:${port}`);
});
