const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Sample data for the PetVerse template
const petverseData = {
  title: 'PetVerse',
  iconPath: '/images/icon.jpg',
  siteName: 'PetVerse',
  loginUrl: '/login',
  navLinks: [
    { name: 'Home', url: '/', dropdown: false },
    { name: 'About', url: '#about', dropdown: false },
    { name: 'Pets', url: '/products/pets', dropdown: false },
    { 
      name: 'Products', 
      url: '#', 
      dropdown: true,
      dropdownItems: [
        { name: 'Pet Food', url: '/products/food' },
        { name: 'Toys', url: '/products/toys' },
        { name: 'Accessories', url: '/products/accessories' }
      ]
    },
    { name: 'Services', url: '/services', dropdown: false }
  ],
  heroTitle: 'Perfect pet',
  heroSubtitle: 'Adopt a pet today and give them a forever home',
  heroButtonText: 'Adopt now',
  slideshowTitle: 'What we provide',
  slides: [
    { image: '/images/slide1.jpg', caption: 'All of your pet needs at one place' },
    { image: '/images/slide2.jpg', caption: 'Find your new life companion and their needs at the same place' },
    { image: '/images/slide3.jpg', caption: 'Your place for every type of pet' },
    { image: '/images/slide4.jpg', caption: 'Book Veterinarian Appointments for your bud with ease' }
  ],
  petSectionTitle: 'Search by Pets',
  petCategories: [
    { name: 'Dogs', image: '/images/dog.jpg' },
    { name: 'Cats', image: '/images/cat.jpg' },
    { name: 'Birds', image: '/images/bird.jpg' },
    { name: 'Fishes', image: '/images/fish.jpg' },
    { name: 'Hamsters', image: '/images/hamster.jpg' }
  ],
  exploreButtonText: 'Explore',
  featuredPetsTitle: 'Featured Pets',
  featuredPets: [
    { name: 'Rottweiler', image: '/images/dog1.jpg', age: '2 Months', price: '18000' },
    { name: 'Husky', image: '/images/dog2.jpg', age: '1 Year', price: '24000' },
    { name: 'Pitbull', image: '/images/dog3.jpg', age: '3 Months', price: '20000' },
    { name: 'Siamese Cat', image: '/images/cat1.jpg', age: '1 Year 2 Months', price: '5000' },
    { name: 'British Shorthair', image: '/images/cat2.jpg', age: '1 Year 6 Months', price: '8000' }
  ],
  detailsButtonText: 'Details',
  featuredProductsTitle: 'Featured Products',
  featuredProducts: [
    { name: 'Tug Ball', image: '/images/toy1.jpg', rating: '★★★★★', price: '249' },
    { name: 'Rubber Bone', image: '/images/toy2.jpg', rating: '★★★<span style="color: gold;">½</span><span class="empty">★</span>', price: '149' },
    { name: 'Drools 1.2Kg', image: '/images/food1.jpg', rating: '★★★★<span class="empty">★</span>', price: '799' },
    { name: 'Purepet Biscuits', image: '/images/food2.jpg', rating: '★★★★<span class="empty">★</span>', price: '399' },
    { name: 'Dog Collar (Red)', image: '/images/acc1.jpg', rating: '★★★★<span class="empty">★</span>', price: '199' }
  ],
  buyButtonText: 'Buy',
  aboutTitle: 'About Us',
  aboutText: [
    'Welcome to <strong>PetVerse</strong>, your trusted marketplace for all things pets! Whether you\'re looking to find a loving home for a pet, shop for the best food and accessories, or book professional services, we\'ve got you covered.',
    'At <strong>PetVerse</strong>, we aim to build a vibrant community of pet lovers by making it easier than ever to care for and connect with pets. Our vision is to ensure every pet finds a loving home and every pet parent has access to reliable services and products.'
  ],
  featuresTitle: 'Our Features',
  features: [
    { title: 'Adoption & Sale', description: 'Buy, sell, or adopt pets through a safe and verified platform.' },
    { title: 'Shop Essentials', description: 'Find premium pet food, toys, and accessories tailored to your pet\'s needs.' },
    { title: 'Book Services', description: 'Schedule appointments with trusted vets, trainers, groomers, and more.' },
    { title: 'Join Events', description: 'Discover and participate in exciting pet-friendly events in your area.' }
  ],
  testimonialTitle: 'What Our Customers Say',
  testimonials: [
    { text: 'Great service! My pet loved the food!', author: 'Roman reigns' },
    { text: 'Booking a vet was super easy and hassle-free!', author: 'Andrew Garfield' },
    { text: 'The adoption process was smooth and transparent.', author: 'Thomas Shelby' },
    { text: 'Great service! My pet just died!', author: 'John Wick' },
    { text: 'Booking a vet was super easy and hassle-free!', author: 'Virat Kohli' }
  ],
  ctaTitle: 'Ready to Explore the World of Pets?',
  ctaSubtitle: 'Whether you are looking for a new furry friend, shopping for essentials, or booking pet services, we\'re here to help!',
  ctaButtons: [
    { id: 'join-btn', text: 'Join Now' },
    { id: 'explr-btn', text: 'Explore pets' }
  ],
  footerTagline: 'Your one-stop destination for all pet needs',
  quickLinksTitle: 'Quick Links',
  footerLinks: [
    { name: 'About Us', url: '#about' },
    { name: 'Shop', url: '/shop' },
    { name: 'Services', url: '/services' },
    { name: 'Events', url: '/events' },
    { name: 'Contact Us', url: '/contact' }
  ],
  socialTitle: 'Follow Us',
  socialLinks: [
    { name: 'Facebook', url: 'https://facebook.com' },
    { name: 'Instagram', url: 'https://instagram.com' },
    { name: 'Twitter', url: 'https://twitter.com' }
  ]
};

// Routes
app.get('/', (req, res) => {
  res.render('index', petverseData);
});

// Route for login page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login | PetVerse' });
});

app.get('/cart', (req, res) => {
  res.render('cart');
});

app.get('/signup', (req,res)=>{
  res.render('signup'); 
});


// Start the server
app.listen(port, () => {
  console.log(`PetVerse app listening at http://localhost:${port}`);
});