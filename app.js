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
      console.log('Attempting to load user with ID:', req.session.userId);
      req.user = await User.findById(req.session.userId);
      
      if (req.user) {
        console.log('User loaded successfully:', req.user.email, 'Role:', req.user.role);
      } else {
        console.log('No user found with ID:', req.session.userId);
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
  } else {
    console.log('No user ID in session, skipping user loader');
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
const servicesRoutes = require('./routes/services-routes');
const serviceProviderRoutes = require('./routes/service-provider-routes');

const userRoutes = require('./routes/user-routes');
const cartRoutes = require('./routes/cart');
const petRoutes = require('./routes/pet-routes');
const mateRoutes = require('./routes/mate-routes');
const sellerRoutes = require('./routes/seller');

// Main routes
app.use('/', userRoutes);
app.use('/', authRoutes);
app.use('/', imageRoutes);

// Pet related routes
app.use('/pets', mateRoutes);
app.use('/pets', petRoutes);

// Seller related routes
app.use('/seller', sellerRoutes);
app.use('/seller', productRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// Service routes
app.use('/cart', cartRoutes);
app.use('/booking', bookingRoutes);
app.use('/services', servicesRoutes);
app.use('/service-provider', serviceProviderRoutes);
app.use('/', reviewRoutes);

app.get('/', (req, res) => {
  res.render('login', { error: null });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`PetVerse app listening at http://localhost:${port}`);
});
