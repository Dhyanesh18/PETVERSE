const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // Secure password hashing
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10; // Hashing strength


const petverseData = {
    title: 'PetVerse',
    iconPath: '/images/icon.jpg',
    siteName: 'PetVerse',
    loginUrl: '/login',
    navLinks: [
      { name: 'Home', url: '/', dropdown: false },
      { name: 'About', url: '/about', dropdown: false },
      { name: 'Pets', url: '/pets', dropdown: false },
      { 
        name: 'Products', 
        url: '#', 
        dropdown: true,
        dropdownItems: [
          { name: 'Pet Food', url: '/products/petfood' },
          { name: 'Toys', url: '/products/toys' },
          { name: 'Accessories', url: '/products/accessories' }
        ]
      },
      { name: 'Services', url: '#', dropdown: true, dropdownItems: [{name:'Services', url:'services'},{name:'PetMate', url:'/mate'}] }
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

  const servicesData = {
    pageTitle: 'PetVerse Services',
    services: [
      {
        id: 1,
        category: 'Veterinary Doctor',
        name: 'Dr. Rahul Singh, DVM',
        image: '/images/services/service1.jpg',
        location: 'Mumbai, MH',
        description: 'Expert in small animal care and emergency surgeries. 10+ years of experience.',
        price: null,
        rating: 4.8,
        reviewCount: 87
      },
      {
        id: 2,
        category: 'Pet Grooming',
        name: 'Claws & Paws Salon',
        image: '/images/services/service2.jpg',
        location: 'Bengaluru, KA',
        description: 'Professional grooming for dogs and cats. Bathing, trimming, and styling.',
        price: 349,
        rating: 4.2,
        reviewCount: 45
      },
      {
        id: 3,
        category: 'Dog Training',
        name: 'GuruK9 Academy',
        image: '/images/services/service3.jpg',
        location: 'Delhi, DL',
        description: 'Group and private classes for all breeds. Positive reinforcement methods.',
        price: null,
        rating: 4.9,
        reviewCount: 62
      },
      {
        id: 4,
        category: 'Veterinary Doctor',
        name: 'Dr. Priya Sharma, DVM',
        image: '/images/services/service4.jpg',
        location: 'Kolkata, WB',
        description: 'Specialist in orthopedic surgery and advanced diagnostics. 15+ years of experience.',
        price: null,
        rating: 4.7,
        reviewCount: 120
      },
      {
        id: 5,
        category: 'Pet Grooming',
        name: 'Sparkle Pet Spa',
        image: '/images/services/service5.jpg',
        location: 'Ahmedabad, GJ',
        description: 'Luxury grooming services, fur trimming, and coat conditioning for all breeds.',
        price: 399,
        rating: 4.1,
        reviewCount: 34
      },
      {
        id: 6,
        category: 'Dog Training',
        name: 'Happy Tails Obedience',
        image: '/images/services/service6.jpg',
        location: 'Pune, MH',
        description: 'Specialized in behavior correction, agility training, and advanced obedience.',
        price: null,
        rating: 4.8,
        reviewCount: 51
      },
      {
        id: 7,
        category: 'Pet Grooming',
        name: 'Posh Pets Spa',
        image: '/images/services/service7.jpg',
        location: 'Jaipur, RJ',
        description: 'Full-service grooming, nail clipping, fur styling, and gentle bathing.',
        price: 279,
        rating: 4.5,
        reviewCount: 40
      },
      {
        id: 8,
        category: 'Veterinary Doctor',
        name: 'Dr. Anjali Verma, DVM',
        image: '/images/services/service8.jpg',
        location: 'Chennai, TN',
        description: 'Focuses on preventive medicine, routine checkups, and wellness programs.',
        price: null,
        rating: 4.6,
        reviewCount: 66
      },
      {
        id: 9,
        category: 'Dog Training',
        name: 'Bark & Train',
        image: '/images/services/service9.jpg',
        location: 'Hyderabad, TS',
        description: 'Personalized training for rescue dogs, puppies, and reactive behavior cases.',
        price: null,
        rating: 4.3,
        reviewCount: 29
      },
      {
        id: 10,
        category: 'Pet Grooming',
        name: 'Fancy Fur House',
        image: '/images/services/service10.jpg',
        location: 'Chandigarh, CH',
        description: 'Premium grooming packages with organic products and breed-specific trims.',
        price: 449,
        rating: 4.7,
        reviewCount: 48
      }
    ]
  };


  const petMateData = {
    // Pet listings
    pets: [
        {
            id: 1,
            name: "Rocky",
            type: "dog",
            breed: "Labrador Retriever",
            age: "2 years",
            gender: "male",
            image: "/images/pets/labrador.jpg",
            state: "Karnataka",
            district: "Bangalore",
            contact: "9876543210",
            description: "Healthy and playful Labrador with excellent temperament. AKC registered with all vaccinations up to date."
        },
        {
            id: 2,
            name: "Luna",
            type: "dog",
            breed: "German Shepherd",
            age: "3 years",
            gender: "female",
            image: "/images/pets/german.jpg",
            state: "Maharashtra",
            district: "Mumbai",
            contact: "8765432109",
            description: "Beautiful German Shepherd with show-quality bloodlines. Looking for a similar breed partner."
        },
        {
            id: 3,
            name: "Simba",
            type: "cat",
            breed: "Persian",
            age: "1.5 years",
            gender: "male",
            image: "/images/pets/persian.jpg",
            state: "Tamil Nadu",
            district: "Chennai",
            contact: "7654321098",
            description: "Pure Persian cat with luxurious coat. Prize-winning bloodline."
        },
        {
            id: 4,
            name: "Daisy",
            type: "dog",
            breed: "Pomeranian",
            age: "2.5 years",
            gender: "female",
            image: "/images/pets/pom.jpg",
            state: "Delhi",
            district: "New Delhi",
            contact: "6543210987",
            description: "Adorable and healthy Pomeranian. Has won several local competitions."
        },
        {
            id: 5,
            name: "Leo",
            type: "dog",
            breed: "Beagle",
            age: "3 years",
            gender: "male",
            image: "/images/pets/beagle.jpg",
            state: "Gujarat",
            district: "Ahmedabad",
            contact: "5432109876",
            description: "Energetic Beagle with great hunting lineage. All health checks complete."
        },
        {
            id: 6,
            name: "Bella",
            type: "cat",
            breed: "Siamese",
            age: "2 years",
            gender: "female",
            image: "/images/pets/siamese.jpg",
            state: "Kerala",
            district: "Kochi",
            contact: "4321098765",
            description: "Purebred Siamese with beautiful blue eyes. Very affectionate and healthy."
        },
        {
            id: 7,
            name: "Max",
            type: "dog",
            breed: "Golden Retriever",
            age: "4 years",
            gender: "male",
            image: "/images/pets/golden.jpg",
            state: "Punjab",
            district: "Chandigarh",
            contact: "3210987654",
            description: "Friendly Golden Retriever with excellent health record and temperament."
        },
        {
            id: 8,
            name: "Zara",
            type: "dog",
            breed: "Shih Tzu",
            age: "3 years",
            gender: "female",
            image: "/images/pets/shihtzu.jpg",
            state: "Telangana",
            district: "Hyderabad",
            contact: "2109876543",
            description: "Beautiful coat and loving personality. Looking for a compatible mate."
        }
    ],
    
    // Filter options for pet types
    petTypes: [
        { value: "dog", label: "Dog" },
        { value: "cat", label: "Cat" },
        { value: "bird", label: "Bird" },
        { value: "rabbit", label: "Rabbit" },
        { value: "hamster", label: "Hamster" },
        { value: "fish", label: "Fish" }
    ],
    
    // Filter options for breeds (sample for common breeds)
    breeds: [
        // Dogs
        { value: "labrador", label: "Labrador Retriever" },
        { value: "german_shepherd", label: "German Shepherd" },
        { value: "golden_retriever", label: "Golden Retriever" },
        { value: "beagle", label: "Beagle" },
        { value: "pomeranian", label: "Pomeranian" },
        { value: "pug", label: "Pug" },
        { value: "shih_tzu", label: "Shih Tzu" },
        { value: "doberman", label: "Doberman" },
        { value: "rottweiler", label: "Rottweiler" },
        { value: "boxer", label: "Boxer" },
        { value: "dalmatian", label: "Dalmatian" },
        
        // Cats
        { value: "persian", label: "Persian" },
        { value: "siamese", label: "Siamese" },
        { value: "maine_coon", label: "Maine Coon" },
        { value: "ragdoll", label: "Ragdoll" },
        { value: "bengal", label: "Bengal" },
        { value: "british_shorthair", label: "British Shorthair" },
        { value: "sphynx", label: "Sphynx" }
    ],
    
    // Indian states for location filter
    states: [
        { value: "andhra_pradesh", label: "Andhra Pradesh" },
        { value: "arunachal_pradesh", label: "Arunachal Pradesh" },
        { value: "assam", label: "Assam" },
        { value: "bihar", label: "Bihar" },
        { value: "chhattisgarh", label: "Chhattisgarh" },
        { value: "goa", label: "Goa" },
        { value: "gujarat", label: "Gujarat" },
        { value: "haryana", label: "Haryana" },
        { value: "himachal_pradesh", label: "Himachal Pradesh" },
        { value: "jharkhand", label: "Jharkhand" },
        { value: "karnataka", label: "Karnataka" },
        { value: "kerala", label: "Kerala" },
        { value: "madhya_pradesh", label: "Madhya Pradesh" },
        { value: "maharashtra", label: "Maharashtra" },
        { value: "manipur", label: "Manipur" },
        { value: "meghalaya", label: "Meghalaya" },
        { value: "mizoram", label: "Mizoram" },
        { value: "nagaland", label: "Nagaland" },
        { value: "odisha", label: "Odisha" },
        { value: "punjab", label: "Punjab" },
        { value: "rajasthan", label: "Rajasthan" },
        { value: "sikkim", label: "Sikkim" },
        { value: "tamil_nadu", label: "Tamil Nadu" },
        { value: "telangana", label: "Telangana" },
        { value: "tripura", label: "Tripura" },
        { value: "uttar_pradesh", label: "Uttar Pradesh" },
        { value: "uttarakhand", label: "Uttarakhand" },
        { value: "west_bengal", label: "West Bengal" },
        { value: "delhi", label: "Delhi" }
    ]
};

const aboutData = {
    activeUsers : 100,
    activeSellers : 15,
    activeServiceProviders: 10,
    petsAvailable: 250
  };
  
  


app.get('/services', (req, res) => {
    res.render('services', servicesData);
  });
  


// Connect to SQLite Database
const db = new sqlite3.Database('./petverse.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to petverse.db');
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your_secret_key',  
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Middleware to parse JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required!" });
    }

    const query = `SELECT id, user_type, password FROM users WHERE email = ?`;

    db.get(query, [email], async (err, user) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found!" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: "Invalid credentials!" });
        }

        req.session.user = {
            id: user.id,
            user_type: user.user_type,
            email: email
        };

        console.log("Session after setting user:", req.session);

        // Redirect based on user type
        if (user.user_type === "seller") {
            return res.redirect("/seller-dashboard");
        } else if (user.user_type === "service_provider") {
            return res.redirect("/service-dashboard");
        } else {
            return res.redirect("/owner-dashboard"); // Default for pet owners
        }
    });
});



app.get('/seller-dashboard', (req, res) => {
    if (!req.session.user || req.session.user.user_type !== "seller") {
        return res.redirect('/login');
    }
    res.render("seller_dashboard", { user: req.session.user });
});

app.get('/service-dashboard', (req, res) => {
    if (!req.session.user || req.session.user.user_type !== "service_provider") {
        return res.redirect('/login');
    }
    res.render("service_dashboard", { user: req.session.user });
});

app.get('/owner/dashboard', (req, res) => {
    if (!req.session.user || req.session.user.user_type !== "owner") {
        return res.redirect('/login');
    }
    res.render("owner_dashboard", { user: req.session.user });
});


app.get('/book/:serviceId', (req, res) => {
    const serviceId = parseInt(req.params.serviceId);
    const service = servicesData.services.find(s => s.id === serviceId);
  
    if (!service) {
      return res.status(404).send('Service not found');
    }
  
    // Render booking.ejs with the chosen service
    // No confirmation data here, so pass confirmed: false
    res.render('booking', { service, confirmed: false, booking: null });
});


function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect if user is not logged in
    }
    res.render("dashboard", {user:req.session.user});
});



app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});


app.get("/", (req,res)=>{
    res.render("index",petverseData);
});

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/signup", (req,res)=>{
    res.render("signup");
});

app.get("/about", (req,res)=>{
    res.render("about", aboutData);
});

app.get("/mate", (req,res)=>{
    res.render("mate.ejs",petMateData);
});


app.post('/signup', async (req, res) => {
  const { email, username, password, phone, full_name, user_type, business_name, license_number, service_type, certification_number } = req.body;

  if (!email || !username || !password || !phone || !full_name || !user_type) {
      return res.status(400).json({ success: false, message: "All required fields must be filled!" });
  }

  // Hash password before storing
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Check if username already exists
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) {
          return res.status(500).json({ success: false, message: "Database error", error: err.message });
      }
      if (row) {
          return res.status(400).json({ success: false, message: "Username already taken!" });
      }

      // Start a transaction
      db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          // Insert user into users table
          const insertUser = `INSERT INTO users (email, username, password, phone, full_name, user_type) VALUES (?, ?, ?, ?, ?, ?)`;
          db.run(insertUser, [email, username, hashedPassword, phone, full_name, user_type], function (err) {
              if (err) {
                  db.run("ROLLBACK");
                  return res.status(500).json({ success: false, message: "Error creating user", error: err.message });
              }

              const userId = this.lastID; // Get the inserted user ID

              if (user_type === "seller") {
                  if (!business_name || !license_number) {
                      db.run("ROLLBACK");
                      return res.status(400).json({ success: false, message: "Business name and License number required for seller" });
                  }

                  const insertSeller = `INSERT INTO sellers (user_id, business_name, license_number) VALUES (?, ?, ?)`;
                  db.run(insertSeller, [userId, business_name, license_number], function (err) {
                      if (err) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ success: false, message: "Error creating seller account", error: err.message });
                      }
                      db.run("COMMIT", (commitErr) => {
                          if (commitErr) {
                              return res.status(500).json({ success: false, message: "Database commit failed", error: commitErr.message });
                          }
                          return res.status(201).json({ success: true, message: "Seller account created successfully." });
                      });
                  });
              } 
              else if (user_type === "service_provider") {
                  if (!service_type || !certification_number) {
                      db.run("ROLLBACK");
                      return res.status(400).json({ success: false, message: "Service type and Certification number required for service providers" });
                  }

                  const insertServiceProvider = `INSERT INTO service_providers (user_id, service_type, certification_number) VALUES (?, ?, ?)`;
                  db.run(insertServiceProvider, [userId, service_type, certification_number], function (err) {
                      if (err) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ success: false, message: "Error creating service provider account", error: err.message });
                      }
                      db.run("COMMIT", (commitErr) => {
                          if (commitErr) {
                              return res.status(500).json({ success: false, message: "Database commit failed", error: commitErr.message });
                          }
                          return res.status(201).json({ success: true, message: "Service provider account created successfully." });
                      });
                  });
              } 
              else {
                  // Default case: Pet Owner (No extra fields needed)
                  db.run("COMMIT", (commitErr) => {
                      if (commitErr) {
                          return res.status(500).json({ success: false, message: "Database commit failed", error: commitErr.message });
                      }
                      return res.status(201).json({ success: true, message: "Pet owner account created successfully." });
                  });
              }
          });
      });
  });
});



app.post('/book/:serviceId', (req, res) => {
    const serviceId = parseInt(req.params.serviceId);
    const service = servicesData.services.find(s => s.id === serviceId);
  
    if (!service) {
      return res.status(404).send('Service not found');
    }
  
    // Grab form data
    const { name, petName, email, date, time } = req.body;
  
    // Create a booking object
    const booking = {
      serviceId,
      serviceName: service.name,
      category: service.category,
      name,      // user's name
      petName,   // pet's name
      email,
      date,
      time
    };
  
    // Read existing bookings from bookings.json or start with empty array
    let bookings = [];
    try {
      const data = fs.readFileSync('bookings.json', 'utf8');
      bookings = JSON.parse(data);
    } catch (err) {
      // If file doesn't exist or parse error, we'll use an empty array
    }
  
    // Add the new booking
    bookings.push(booking);
  
    // Write the updated array back to bookings.json
    fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));
  
    // Instead of sending a separate confirmation page,
    // re-render booking.ejs with "confirmed: true" and the booking data
    res.render('booking', { service, confirmed: true, booking });
  });
  

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
