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
    } catch (err) {
      console.error('User loading error:', err);
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
const userRoutes = require('./routes/user-routes');
const cartRoutes = require('./routes/cart');
const petRoutes = require('./routes/pet-routes');
const mateRoutes = require('./routes/mate-routes');
app.use('/pets', mateRoutes);
app.use('/seller', petRoutes);
app.use('/', userRoutes);
app.use('/seller', productRoutes);
app.use('/', imageRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/booking', bookingRoutes);
app.use('/', reviewRoutes);

app.get('/', (req, res) => {
  res.render('login', { error: null });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`PetVerse app listening at http://localhost:${port}`);
});