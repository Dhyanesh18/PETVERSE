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

const petFoodData = {
  categoryTitle: 'Pet Food',
  
  // Category filters relevant to pet food
  categoryFilters: [
    { id: 'dog-food', value: 'dog-food', label: 'Dog Food' },
    { id: 'cat-food', value: 'cat-food', label: 'Cat Food' },
    { id: 'bird-food', value: 'bird-food', label: 'Bird Food' },
    { id: 'fish-food', value: 'fish-food', label: 'Fish Food' }
  ],
  
  // Common pet food brands
  brandFilters: [
    { id: 'royal-canin', value: 'royal-canin', label: 'Royal Canin' },
    { id: 'pedigree', value: 'pedigree', label: 'Pedigree' },
    { id: 'whiskas', value: 'whiskas', label: 'Whiskas' },
    { id: 'drools', value: 'drools', label: 'Drools' }
  ],
  
  // Standard rating filters
  ratingFilters: [
    { id: 'rating-4', value: '4', label: '4★ & above' },
    { id: 'rating-3', value: '3', label: '3★ & above' },
    { id: 'rating-2', value: '2', label: '2★ & above' }
  ],
  
  // Dynamic filters specific to pet food
  dynamicFilters: [
    {
      title: 'Life Stage',
      name: 'life-stage',
      options: [
        { id: 'puppy', value: 'puppy', label: 'Puppy' },
        { id: 'adult', value: 'adult', label: 'Adult' },
        { id: 'senior', value: 'senior', label: 'Senior' }
      ]
    },
    {
      title: 'Food Type',
      name: 'food-type',
      options: [
        { id: 'dry', value: 'dry', label: 'Dry Food' },
        { id: 'wet', value: 'wet', label: 'Wet Food' },
        { id: 'treats', value: 'treats', label: 'Treats' }
      ]
    },
    {
      title: 'Special Diet',
      name: 'special-diet',
      options: [
        { id: 'grain-free', value: 'grain-free', label: 'Grain Free' },
        { id: 'organic', value: 'organic', label: 'Organic' },
        { id: 'weight-control', value: 'weight-control', label: 'Weight Control' }
      ]
    }
  ],
  
  // Product data for the 4 pet food images you have
  products: [
    {
      id: 1,
      name: 'Royal Canin Adult Dog Food Premium',
      description: 'Premium dry food for adult dogs with real chicken as the first ingredient. Supports muscle maintenance and overall health.',
      price: 1299.99,
      image: '/images/products/Drools.jpg', // Update path to your actual image
      rating: 4.5,
      reviewCount: 128,
      category: 'dog-food',
      brand: 'royal-canin',
      tags: ['adult', 'dry', 'premium']
    },
    {
      id: 2,
      name: 'Whiskas Ocean Fish Cat Food',
      description: 'Delicious seafood flavors that cats love with added vitamins and minerals for complete nutrition.',
      price: 899.50,
      image: '/images/products/Henlo_1.jpg', // Update path to your actual image
      rating: 4.2,
      reviewCount: 95,
      category: 'cat-food',
      brand: 'whiskas',
      tags: ['adult', 'dry', 'fish-flavor']
    },
    {
      id: 3,
      name: 'Pedigree Puppy Chicken & Milk',
      description: 'Specially formulated for growing puppies with DHA for brain development and calcium for strong bones.',
      price: 750.00,
      image: '/images/products/Pedigree_1.jpg', // Update path to your actual image
      rating: 4.7,
      reviewCount: 112,
      category: 'dog-food',
      brand: 'pedigree',
      tags: ['puppy', 'dry', 'chicken-flavor']
    },
    {
      id: 4,
      name: 'Drools Absolute Vitamin Rich Fish Food',
      description: 'Complete and balanced nutrition for all aquarium fish. Enhances color and promotes healthy growth.',
      price: 299.50,
      image: '/images/products/RoyalCanin_1.jpg', // Update path to your actual image
      rating: 3.9,
      reviewCount: 45,
      category: 'fish-food',
      brand: 'drools',
      tags: ['all-life-stages', 'flakes', 'color-enhancing']
    }
    ,{
      id: 5,
      name: 'Royal Canin Adult Dog Food Premium',
      description: 'Premium dry food for adult dogs with real chicken as the first ingredient. Supports muscle maintenance and overall health.',
      price: 1299.99,
      regularPrice: 1799.99,
      image: '/images/products/Drools.jpg',
      rating: 4.5,
      reviewCount: 128,
      category: 'dog-food',
      brand: 'royal-canin',
      tags: ['adult', 'dry', 'premium'],
    },
    {
      id: 6,
      name: 'Whiskas Ocean Fish Cat Food Special',
      description: 'Delicious seafood flavors that cats love with added vitamins and minerals for complete nutrition.',
      price: 899.50,
      image: '/images/products/Henlo_1.jpg',
      rating: 4.2,
      reviewCount: 95,
      category: 'cat-food',
      brand: 'whiskas',
      tags: ['adult', 'dry', 'fish-flavor']
    },
    {
      id: 7,
      name: 'Pedigree Puppy Chicken & Milk',
      description: 'Specially formulated for growing puppies with DHA for brain development and calcium for strong bones.',
      price: 750.00,
      image: '/images/products/Pedigree_1.jpg',
      rating: 4.7,
      reviewCount: 112,
      category: 'dog-food',
      brand: 'pedigree',
      tags: ['puppy', 'dry', 'chicken-flavor']
    },
    {
      id: 8,
      name: 'Drools Absolute Vitamin Rich Fish Food',
      description: 'Complete and balanced nutrition for all aquarium fish. Enhances color and promotes healthy growth.',
      price: 299.50,
      image: '/images/products/RoyalCanin_1.jpg',
      rating: 3.9,
      reviewCount: 45,
      category: 'fish-food',
      brand: 'drools',
      tags: ['all-life-stages', 'flakes', 'color-enhancing']
    },
    {
      id: 9,
      name: 'Royal Canin Adult Dog Food Premium',
      description: 'Premium dry food for adult dogs with real chicken as the first ingredient. Supports muscle maintenance and overall health.',
      price: 1299.99,
      regularPrice: 1799.99,
      image: '/images/products/Drools.jpg',
      rating: 4.5,
      reviewCount: 128,
      category: 'dog-food',
      brand: 'royal-canin',
      tags: ['adult', 'dry', 'premium'],
    },
    {
      id: 10,
      name: 'Whiskas Ocean Fish Cat Food Special',
      description: 'Delicious seafood flavors that cats love with added vitamins and minerals for complete nutrition.',
      price: 899.50,
      image: '/images/products/Henlo_1.jpg',
      rating: 4.2,
      reviewCount: 95,
      category: 'cat-food',
      brand: 'whiskas',
      tags: ['adult', 'dry', 'fish-flavor']
    },
    {
      id: 11,
      name: 'Pedigree Puppy Chicken & Milk',
      description: 'Specially formulated for growing puppies with DHA for brain development and calcium for strong bones.',
      price: 750.00,
      image: '/images/products/Pedigree_1.jpg',
      rating: 4.7,
      reviewCount: 112,
      category: 'dog-food',
      brand: 'pedigree',
      tags: ['puppy', 'dry', 'chicken-flavor']
    },
    {
      id: 12,
      name: 'Drools Absolute Vitamin Rich Fish Food',
      description: 'Complete and balanced nutrition for all aquarium fish. Enhances color and promotes healthy growth.',
      price: 299.50,
      image: '/images/products/RoyalCanin_1.jpg',
      rating: 3.9,
      reviewCount: 45,
      category: 'fish-food',
      brand: 'drools',
      tags: ['all-life-stages', 'flakes', 'color-enhancing']
    }
  ]
};

const petsData = {
  categoryTitle: 'Pets for Sale',
  
  // Category filters for different types of pets
  categoryFilters: [
    { id: 'dogs', value: 'dogs', label: 'Dogs' },
    { id: 'cats', value: 'cats', label: 'Cats' },
    { id: 'birds', value: 'birds', label: 'Birds' },
    { id: 'fish', value: 'fish', label: 'Fish' },
    { id: 'small-pets', value: 'small-pets', label: 'Small Pets' }
  ],
  
  // Common pet breeds by category
  breedFilters: [
    // Dog breeds
    { id: 'german-shepherd', value: 'german-shepherd', label: 'German Shepherd', category: 'dogs' },
    { id: 'labrador', value: 'labrador', label: 'Labrador', category: 'dogs' },
    { id: 'rottweiler', value: 'rottweiler', label: 'Rottweiler', category: 'dogs' },
    { id: 'golden-retriever', value: 'golden-retriever', label: 'Golden Retriever', category: 'dogs' },
    { id: 'beagle', value: 'beagle', label: 'Beagle', category: 'dogs' },
    { id: 'pug', value: 'pug', label: 'Pug', category: 'dogs' },
    
    // Cat breeds
    { id: 'persian', value: 'persian', label: 'Persian', category: 'cats' },
    { id: 'siamese', value: 'siamese', label: 'Siamese', category: 'cats' },
    { id: 'maine-coon', value: 'maine-coon', label: 'Maine Coon', category: 'cats' },
    { id: 'bengal', value: 'bengal', label: 'Bengal', category: 'cats' },
    { id: 'siberian', value: 'siberian', label: 'Siberian', category: 'cats' },
    
    // Bird breeds
    { id: 'parakeet', value: 'parakeet', label: 'Parakeet', category: 'birds' },
    { id: 'cockatiel', value: 'cockatiel', label: 'Cockatiel', category: 'birds' },
    { id: 'canary', value: 'canary', label: 'Canary', category: 'birds' },
    { id: 'parrot', value: 'parrot', label: 'Parrot', category: 'birds' },
    
    // Fish breeds
    { id: 'goldfish', value: 'goldfish', label: 'Goldfish', category: 'fish' },
    { id: 'betta', value: 'betta', label: 'Betta Fish', category: 'fish' },
    { id: 'guppy', value: 'guppy', label: 'Guppy', category: 'fish' },
    { id: 'tetra', value: 'tetra', label: 'Tetra', category: 'fish' },
    
    // Small pets
    { id: 'hamster', value: 'hamster', label: 'Hamster', category: 'small-pets' },
    { id: 'guinea-pig', value: 'guinea-pig', label: 'Guinea Pig', category: 'small-pets' },
    { id: 'rabbit', value: 'rabbit', label: 'Rabbit', category: 'small-pets' }
  ],
  
  // Dynamic filters specific to pets
  dynamicFilters: [
    {
      title: 'Age',
      name: 'age',
      options: [
        { id: 'baby', value: 'baby', label: 'Baby (0-6 months)' },
        { id: 'young', value: 'young', label: 'Young (6 months-2 years)' },
        { id: 'adult', value: 'adult', label: 'Adult (2-8 years)' },
        { id: 'senior', value: 'senior', label: 'Senior (8+ years)' }
      ]
    },
    {
      title: 'Gender',
      name: 'gender',
      options: [
        { id: 'male', value: 'male', label: 'Male' },
        { id: 'female', value: 'female', label: 'Female' }
      ]
    },
    {
      title: 'Size',
      name: 'size',
      options: [
        { id: 'small', value: 'small', label: 'Small' },
        { id: 'medium', value: 'medium', label: 'Medium' },
        { id: 'large', value: 'large', label: 'Large' }
      ]
    },
    {
      title: 'Color',
      name: 'color',
      options: [
        { id: 'black', value: 'black', label: 'Black' },
        { id: 'white', value: 'white', label: 'White' },
        { id: 'brown', value: 'brown', label: 'Brown' },
        { id: 'grey', value: 'grey', label: 'Grey' },
        { id: 'multi', value: 'multi', label: 'Multi-colored' }
      ]
    },
    {
      title: 'Special Characteristics',
      name: 'characteristics',
      options: [
        { id: 'pedigree', value: 'pedigree', label: 'Pedigree' },
        { id: 'house-trained', value: 'house-trained', label: 'House Trained' },
        { id: 'vaccinated', value: 'vaccinated', label: 'Vaccinated' },
        { id: 'neutered', value: 'neutered', label: 'Neutered/Spayed' },
        { id: 'special-needs', value: 'special-needs', label: 'Special Needs' }
      ]
    }
  ],
  
  // Pet listings
  pets: [
    {
      id: 1,
      name: 'Max',
      breed: 'German Shepherd',
      description: 'Friendly and energetic German Shepherd puppy. Good with children and other pets. Partially house trained.',
      price: 25000,
      image: '/images/pets/gsdpup.jpg',
      age: '3 months',
      gender: 'male',
      size: 'medium',
      color: 'black',
      category: 'dogs',
      tags: ['baby', 'male', 'vaccinated', 'pedigree']
    },
    {
      id: 2,
      name: 'Luna',
      breed: 'Siberian',
      description: 'Beautiful Siberian cat with a playful personality. Fully litter trained and very affectionate.',
      price: 18000,
      image: '/images/pets/siberian.jpg',
      age: '6 months',
      gender: 'female',
      size: 'medium',
      color: 'grey',
      category: 'cats',
      tags: ['young', 'female', 'vaccinated', 'house-trained']
    },
    {
      id: 3,
      name: 'Rocky',
      breed: 'Rottweiler',
      description: 'Strong and loyal Rottweiler with basic obedience training. Great guard dog with a gentle temperament around family.',
      price: 30000,
      image: '/images/pets/rott.jpg',
      age: '1 year',
      gender: 'male',
      size: 'large',
      color: 'black',
      category: 'dogs',
      tags: ['young', 'male', 'vaccinated', 'house-trained']
    },
    {
      id: 4,
      name: 'Coco',
      breed: 'Maine Coon',
      description: 'Majestic Maine Coon with a fluffy coat and friendly disposition. Gets along well with dogs and children.',
      price: 22000,
      image: '/images/pets/mc.jpg',
      age: '2 years',
      gender: 'female',
      size: 'large',
      color: 'brown',
      category: 'cats',
      tags: ['adult', 'female', 'vaccinated', 'neutered']
    },
    {
      id: 5,
      name: 'Buddy',
      breed: 'Golden Retriever',
      description: 'Gentle and intelligent Golden Retriever puppy. Already showing great promise for training and family companionship.',
      price: 28000,
      regularPrice: 32000,
      image: '/images/pets/golden.jpg',
      age: '4 months',
      gender: 'male',
      size: 'medium',
      color: 'golden',
      category: 'dogs',
      tags: ['baby', 'male', 'vaccinated', 'pedigree']
    },
    {
      id: 6,
      name: 'Charlie',
      breed: 'Cockatiel',
      description: 'Hand-raised cockatiel that whistles tunes and is very social. Comes with cage and starter food kit.',
      price: 5000,
      image: '/images/pets/cockatiel.jpg',
      age: '1 year',
      gender: 'male',
      size: 'small',
      color: 'grey',
      category: 'birds',
      tags: ['young', 'male', 'trained']
    },
    {
      id: 7,
      name: 'Oliver',
      breed: 'Bengal',
      description: 'Stunning Bengal cat with distinctive spotted coat. Very active and playful, needs plenty of stimulation.',
      price: 35000,
      image: '/images/pets/bengal.jpg',
      age: '8 months',
      gender: 'male',
      size: 'medium',
      color: 'multi',
      category: 'cats',
      tags: ['young', 'male', 'vaccinated', 'pedigree']
    },
    {
      id: 8,
      name: 'Daisy',
      breed: 'Beagle',
      description: 'Sweet-natured Beagle with classic tri-color coat. Good with other dogs and loves outdoor activities.',
      price: 20000,
      image: '/images/pets/beagle.jpg',
      age: '1.5 years',
      gender: 'female',
      size: 'medium',
      color: 'multi',
      category: 'dogs',
      tags: ['young', 'female', 'vaccinated', 'house-trained']
    },
    {
      id: 9,
      name: 'Snowball',
      breed: 'Persian',
      description: 'Pure white Persian cat with copper eyes. Very calm temperament and enjoys lounging. Requires regular grooming.',
      price: 25000,
      image: '/images/pets/persian.jpg',
      age: '3 years',
      gender: 'female',
      size: 'medium',
      color: 'white',
      category: 'cats',
      tags: ['adult', 'female', 'vaccinated', 'neutered', 'pedigree']
    },
    {
      id: 10,
      name: 'Thumper',
      breed: 'Rabbit',
      description: 'Friendly dwarf rabbit with floppy ears. Already litter trained and comfortable being handled.',
      price: 3500,
      image: '/images/pets/rabbit.jpg',
      age: '5 months',
      gender: 'male',
      size: 'small',
      color: 'brown',
      category: 'small-pets',
      tags: ['baby', 'male', 'house-trained']
    },
    {
      id: 11,
      name: 'Nemo',
      breed: 'Betta Fish',
      description: 'Vibrant blue and red male betta fish with flowing fins. Comes with basic tank setup.',
      price: 1500,
      image: '/images/pets/betta.jpg',
      age: '1 year',
      gender: 'male',
      size: 'small',
      color: 'multi',
      category: 'fish',
      tags: ['young', 'male']
    },
    {
      id: 12,
      name: 'Ruby',
      breed: 'Parrot',
      description: 'Intelligent African Grey Parrot that can mimic speech. Requires dedicated owner for social interaction.',
      price: 45000,
      image: '/images/pets/parrot.jpg',
      age: '5 years',
      gender: 'female',
      size: 'medium',
      color: 'grey',
      category: 'birds',
      tags: ['adult', 'female', 'trained']
    },
    {
      id: 13,
      name: 'Bruno',
      breed: 'Pug',
      description: 'Charming Pug puppy with a playful personality. Has received initial vaccinations and veterinary check-ups.',
      price: 18000,
      regularPrice: 22000,
      image: '/images/pets/pug.jpg',
      age: '2 months',
      gender: 'male',
      size: 'small',
      color: 'fawn',
      category: 'dogs',
      tags: ['baby', 'male', 'vaccinated']
    },
    {
      id: 14,
      name: 'Whiskers',
      breed: 'Siamese',
      description: 'Traditional Siamese cat with striking blue eyes and vocal personality. Very affectionate and people-oriented.',
      price: 20000,
      image: '/images/pets/siamese.jpg',
      age: '1 year',
      gender: 'female',
      size: 'medium',
      color: 'cream',
      category: 'cats',
      tags: ['young', 'female', 'vaccinated', 'house-trained']
    },
    {
      id: 15,
      name: 'Peanut',
      breed: 'Hamster',
      description: 'Friendly Syrian hamster that enjoys being handled. Comes with cage, exercise wheel, and starter food.',
      price: 1200,
      image: '/images/pets/hamster.jpg',
      age: '3 months',
      gender: 'female',
      size: 'small',
      color: 'golden',
      category: 'small-pets',
      tags: ['baby', 'female']
    }
  ]
};


const detailData = {
  products: [
    {
      id: 1,
      name: 'Royal Canin Adult Dog Food',
      description: 'Premium dry food for adult dogs with real chicken as the first ingredient. Supports muscle maintenance and overall health.',
      price: 1299.99,
      regularPrice: 1799.99,
      image: '/images/products/Drools.jpg',
      rating: 4.5,
      reviewCount: 128,
      category: 'dog-food',
      brand: 'royal-canin',
      tags: ['adult', 'dry', 'premium'],
      isLightningDeal: true,
      deliveryEstimate: '2-4 days',
      reviews: [
        { 
          name: 'John D.',
          rating: 5,
          date: '12 Feb 2025',
          text: 'My dog loves this food! His coat is shinier and he has more energy since we switched.'
        },
        {
          name: 'Sara M.',
          rating: 4,
          date: '28 Jan 2025',
          text: 'Good quality food, but a bit expensive. My dog seems to enjoy it though.'
        }
      ]
    },
    {
      id: 2,
      name: 'Whiskas Ocean Fish Cat Food',
      description: 'Delicious seafood flavors that cats love with added vitamins and minerals for complete nutrition.',
      price: 899.50,
      image: '/images/products/Henlo_1.jpg',
      rating: 4.2,
      reviewCount: 95,
      category: 'cat-food',
      brand: 'whiskas',
      tags: ['adult', 'dry', 'fish-flavor']
    },
    {
      id: 3,
      name: 'Pedigree Puppy Chicken & Milk',
      description: 'Specially formulated for growing puppies with DHA for brain development and calcium for strong bones.',
      price: 750.00,
      image: '/images/products/Pedigree_1.jpg',
      rating: 4.7,
      reviewCount: 112,
      category: 'dog-food',
      brand: 'pedigree',
      tags: ['puppy', 'dry', 'chicken-flavor']
    },
    {
      id: 4,
      name: 'Drools Absolute Vitamin Rich Fish Food',
      description: 'Complete and balanced nutrition for all aquarium fish. Enhances color and promotes healthy growth.',
      price: 299.50,
      image: '/images/products/RoyalCanin_1.jpg',
      rating: 3.9,
      reviewCount: 45,
      category: 'fish-food',
      brand: 'drools',
      tags: ['all-life-stages', 'flakes', 'color-enhancing']
    }
  ],

  // Function to get product by ID
  getProductById: function(id) {
    return this.products.find(p => p.id === id);
  },
  
  // Function to get similar products (excluding the specified product)
  getSimilarProducts: function(excludeId) {
    return this.products.filter(p => p.id !== excludeId);
  }
};


const data = {
  product : detailData.getProductById(1),
  similarProducts : detailData.getSimilarProducts(1)
};

const petToysData = {
  categoryTitle: 'Pet Toys',
  
  // Category filters relevant to pet toys
  categoryFilters: [
    { id: 'dog-toys', value: 'dog-toys', label: 'Dog Toys' },
    { id: 'cat-toys', value: 'cat-toys', label: 'Cat Toys' },
    { id: 'bird-toys', value: 'bird-toys', label: 'Bird Toys' },
    { id: 'small-pet-toys', value: 'small-pet-toys', label: 'Small Pet Toys' }
  ],
  
  // Common pet toy brands
  brandFilters: [
    { id: 'kong', value: 'kong', label: 'Kong' },
    { id: 'nylabone', value: 'nylabone', label: 'Nylabone' },
    { id: 'frisco', value: 'frisco', label: 'Frisco' },
    { id: 'outward-hound', value: 'outward-hound', label: 'Outward Hound' },
    { id: 'petstages', value: 'petstages', label: 'Petstages' }
  ],
  
  // Standard rating filters
  ratingFilters: [
    { id: 'rating-4', value: '4', label: '4★ & above' },
    { id: 'rating-3', value: '3', label: '3★ & above' },
    { id: 'rating-2', value: '2', label: '2★ & above' }
  ],
  
  // Dynamic filters specific to pet toys
  dynamicFilters: [
    {
      title: 'Toy Type',
      name: 'toy-type',
      options: [
        { id: 'chew', value: 'chew', label: 'Chew Toys' },
        { id: 'plush', value: 'plush', label: 'Plush Toys' },
        { id: 'fetch', value: 'fetch', label: 'Fetch Toys' },
        { id: 'interactive', value: 'interactive', label: 'Interactive Toys' },
        { id: 'puzzle', value: 'puzzle', label: 'Puzzle Toys' }
      ]
    },
    {
      title: 'Material',
      name: 'material',
      options: [
        { id: 'rubber', value: 'rubber', label: 'Rubber' },
        { id: 'plush', value: 'plush', label: 'Plush' },
        { id: 'rope', value: 'rope', label: 'Rope' },
        { id: 'plastic', value: 'plastic', label: 'Plastic' },
        { id: 'natural', value: 'natural', label: 'Natural Materials' }
      ]
    },
    {
      title: 'Features',
      name: 'features',
      options: [
        { id: 'squeaky', value: 'squeaky', label: 'Squeaky' },
        { id: 'bouncy', value: 'bouncy', label: 'Bouncy' },
        { id: 'treat-dispensing', value: 'treat-dispensing', label: 'Treat Dispensing' },
        { id: 'floatable', value: 'floatable', label: 'Floatable' },
        { id: 'crinkle', value: 'crinkle', label: 'Crinkle Sound' }
      ]
    },
    {
      title: 'Pet Size',
      name: 'pet-size',
      options: [
        { id: 'small', value: 'small', label: 'Small' },
        { id: 'medium', value: 'medium', label: 'Medium' },
        { id: 'large', value: 'large', label: 'Large' }
      ]
    }
  ],
  
  // Product data for 5 pet toys
  products: [
    {
      id: 1,
      name: 'Kong Classic Durable Rubber Dog Toy',
      description: 'Durable rubber toy that can be stuffed with treats. Perfect for keeping dogs mentally stimulated and physically active.',
      price: 699.99,
      image: '/images/products/kong-classic.jpg',
      rating: 4.8,
      reviewCount: 215,
      category: 'dog-toys',
      brand: 'kong',
      tags: ['chew', 'treat-dispensing', 'rubber', 'medium']
    },
    {
      id: 2,
      name: 'Frisco Colorful Springs Small Cat Toy',
      description: 'Bouncy, colorful spring toys that cats love to bat and chase. Provides hours of entertainment and exercise.',
      price: 249.50,
      image: '/images/products/cat-springs.jpg',
      rating: 4.6,
      reviewCount: 183,
      category: 'cat-toys',
      brand: 'frisco',
      tags: ['interactive', 'plastic', 'small']
    },
    {
      id: 3,
      name: 'Nylabone DuraChew Textured Dog Bone',
      description: 'Long-lasting chew toy with textured nubs that help clean teeth and freshen breath while satisfying natural chewing instincts.',
      price: 499.00,
      image: '/images/products/nylabone.jpg',
      rating: 4.5,
      reviewCount: 175,
      category: 'dog-toys',
      brand: 'nylabone',
      tags: ['chew', 'dental', 'plastic', 'large']
    },
    {
      id: 4,
      name: 'Outward Hound Hide-A-Squirrel Puzzle Toy',
      description: 'Interactive puzzle toy where dogs can hunt and pull out squeaky squirrels from the plush tree trunk. Stimulates natural hunting instincts.',
      price: 899.75,
      image: '/images/products/hide-squirrel.jpg',
      rating: 4.7,
      reviewCount: 192,
      category: 'dog-toys',
      brand: 'outward-hound',
      tags: ['puzzle', 'plush', 'squeaky', 'medium']
    },
    {
      id: 5,
      name: 'Petstages Tower of Tracks Cat Toy',
      description: 'Three-tier track toy with spinning balls that stimulates play and satisfies hunting instincts. Non-slip base keeps toy in place during play.',
      price: 549.50,
      image: '/images/products/tower-tracks.jpg',
      rating: 4.4,
      reviewCount: 156,
      category: 'cat-toys',
      brand: 'petstages',
      tags: ['interactive', 'puzzle', 'plastic', 'small']
    }
  ]
};


const petAccessoriesData = {
  categoryTitle: 'Pet Accessories',
  
  // Category filters relevant to pet accessories
  categoryFilters: [
    { id: 'dog-accessories', value: 'dog-accessories', label: 'Dog Accessories' },
    { id: 'cat-accessories', value: 'cat-accessories', label: 'Cat Accessories' },
    { id: 'bird-accessories', value: 'bird-accessories', label: 'Bird Accessories' },
    { id: 'small-pet-accessories', value: 'small-pet-accessories', label: 'Small Pet Accessories' }
  ],
  
  // Common pet accessory brands
  brandFilters: [
    { id: 'petsafe', value: 'petsafe', label: 'PetSafe' },
    { id: 'kurgo', value: 'kurgo', label: 'Kurgo' },
    { id: 'frisco', value: 'frisco', label: 'Frisco' },
    { id: 'petmate', value: 'petmate', label: 'Petmate' },
    { id: 'trixie', value: 'trixie', label: 'Trixie' }
  ],
  
  // Standard rating filters
  ratingFilters: [
    { id: 'rating-4', value: '4', label: '4★ & above' },
    { id: 'rating-3', value: '3', label: '3★ & above' },
    { id: 'rating-2', value: '2', label: '2★ & above' }
  ],
  
  // Dynamic filters specific to pet accessories
  dynamicFilters: [
    {
      title: 'Accessory Type',
      name: 'accessory-type',
      options: [
        { id: 'collars', value: 'collars', label: 'Collars & ID Tags' },
        { id: 'leashes', value: 'leashes', label: 'Leashes & Harnesses' },
        { id: 'bowls', value: 'bowls', label: 'Bowls & Feeders' },
        { id: 'grooming', value: 'grooming', label: 'Grooming Tools' },
        { id: 'travel', value: 'travel', label: 'Travel Accessories' }
      ]
    },
    {
      title: 'Material',
      name: 'material',
      options: [
        { id: 'nylon', value: 'nylon', label: 'Nylon' },
        { id: 'leather', value: 'leather', label: 'Leather' },
        { id: 'stainless-steel', value: 'stainless-steel', label: 'Stainless Steel' },
        { id: 'silicone', value: 'silicone', label: 'Silicone' },
        { id: 'plastic', value: 'plastic', label: 'Plastic' }
      ]
    },
    {
      title: 'Features',
      name: 'features',
      options: [
        { id: 'adjustable', value: 'adjustable', label: 'Adjustable' },
        { id: 'reflective', value: 'reflective', label: 'Reflective' },
        { id: 'waterproof', value: 'waterproof', label: 'Waterproof' },
        { id: 'collapsible', value: 'collapsible', label: 'Collapsible' },
        { id: 'personalized', value: 'personalized', label: 'Personalized' }
      ]
    },
    {
      title: 'Pet Size',
      name: 'pet-size',
      options: [
        { id: 'small', value: 'small', label: 'Small' },
        { id: 'medium', value: 'medium', label: 'Medium' },
        { id: 'large', value: 'large', label: 'Large' }
      ]
    }
  ],
  
  // Product data for 5 pet accessories
  products: [
    {
      id: 1,
      name: 'PetSafe Easy Walk Dog Harness',
      description: 'No-pull harness designed to gently discourage pulling during walks. Chest strap rests across the breastbone to prevent choking.',
      price: 1299.99,
      image: '/images/products/easy-walk-harness.jpg',
      rating: 4.7,
      reviewCount: 245,
      category: 'dog-accessories',
      brand: 'petsafe',
      tags: ['leashes', 'nylon', 'adjustable', 'medium']
    },
    {
      id: 2,
      name: 'Frisco Stainless Steel Pet Bowl Set',
      description: 'Set of two rust-resistant stainless steel bowls with non-skid rubber base. Dishwasher safe for easy cleaning.',
      price: 599.50,
      image: '/images/products/steel-bowls.jpg',
      rating: 4.5,
      reviewCount: 183,
      category: 'dog-accessories',
      brand: 'frisco',
      tags: ['bowls', 'stainless-steel', 'all-sizes']
    },
    {
      id: 3,
      name: 'Kurgo Car Seat Cover for Dogs',
      description: 'Waterproof, durable car seat cover that protects your vehicle from pet hair, mud, and scratches. Easy to install and clean.',
      price: 1899.00,
      image: '/images/products/car-seat-cover.jpg',
      rating: 4.6,
      reviewCount: 175,
      category: 'dog-accessories',
      brand: 'kurgo',
      tags: ['travel', 'waterproof', 'nylon', 'all-sizes']
    },
    {
      id: 4,
      name: 'Petmate Litter Box with Rim',
      description: 'High-sided litter box with entrance ramp and snap-on rim to help reduce litter scatter. Easy to clean with non-stick surface.',
      price: 799.75,
      image: '/images/products/litter-box.jpg',
      rating: 4.3,
      reviewCount: 192,
      category: 'cat-accessories',
      brand: 'petmate',
      tags: ['litter', 'plastic', 'all-sizes']
    },
    {
      id: 5,
      name: 'Trixie 3-in-1 Cat Activity Center',
      description: 'Interactive feeding station with multiple activities to challenge cats. Slows down eating and provides mental stimulation.',
      price: 849.50,
      image: '/images/products/activity-center.jpg',
      rating: 4.4,
      reviewCount: 156,
      category: 'cat-accessories',
      brand: 'trixie',
      tags: ['bowls', 'plastic', 'interactive', 'all-sizes']
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









app.get('/products/petfood', (req, res) => {
  res.render('products', petFoodData);
});


app.get('/', (req, res) => {
  res.render('index', petverseData);
});

// app.get('/', (req, res)=>{
//   res.render('mate', petMateData);
// });


// const dashboardData = {
//   user: {
//     name: "John Doe",
//     email: "johndoe@example.com",
//     phone: "123-456-7890",
//     address: "123 Pet Street, Petville, PV 12345",
//     profileImage: "/images/users/profile.jpg", // Set to null for default icon
//     userType: "buyer", // CHANGE THIS to "seller", "service", or "admin" to test different views
//     status: "approved" // Only relevant for seller/service
//   },
  
//   // Buyer data
//   orders: [
//     {
//       id: "ORD123456",
//       date: "2023-03-10",
//       status: "delivered",
//       total: 125.99,
//       items: [
//         {
//           name: "Dog Food Premium",
//           price: 45.99,
//           quantity: 2,
//           image: "/images/products/dogfood.jpg"
//         },
//         {
//           name: "Cat Toy Set",
//           price: 15.99,
//           quantity: 1,
//           image: "/images/products/cattoy.jpg"
//         }
//       ]
//     }
//   ],
  
//   bookings: [
//     {
//       serviceName: "Pet Grooming",
//       providerName: "Happy Paws Grooming",
//       date: "2023-03-15",
//       time: "10:00 AM",
//       status: "confirmed"
//     }
//   ],
  
//   pets: [
//     {
//       id: "PET123",
//       name: "Buddy",
//       type: "Dog",
//       breed: "Golden Retriever",
//       age: "3 years",
//       gender: "Male",
//       image: "/images/pets/dog.jpg",
//       listForMating: false
//     },
//     {
//       id: "PET124",
//       name: "Whiskers",
//       type: "Cat",
//       breed: "Siamese",
//       age: "2 years",
//       gender: "Female",
//       image: "/images/pets/cat.jpg",
//       listForMating: true
//     }
//   ],
  
//   // Seller data
//   products: [
//     {
//       id: "PROD123",
//       name: "Premium Dog Collar",
//       price: 24.99,
//       category: "Accessories",
//       stock: 15,
//       image: "/images/products/dogcollar.jpg"
//     },
//     {
//       id: "PROD124",
//       name: "Cat Food - Salmon",
//       price: 19.99,
//       category: "Food",
//       stock: 25,
//       image: "/images/products/catfood.jpg"
//     }
//   ],
  
//   sellerOrders: [
//     {
//       id: "ORD789012",
//       customerName: "Jane Smith",
//       shippingAddress: "456 Oak Street, Petville, PV 12345",
//       date: "2023-03-12",
//       status: "pending"
//     }
//   ],
  
//   // Service provider data
//   services: [
//     {
//       id: "SVC123",
//       name: "Basic Dog Grooming",
//       price: 35.00,
//       category: "Grooming",
//       description: "Full service grooming including bath, haircut, nail trimming, and ear cleaning. Perfect for all breeds and sizes of dogs.",
//       image: "/images/services/doggrooming.jpg"
//     }
//   ],
  
//   appointments: [
//     {
//       id: "APT123",
//       serviceName: "Basic Dog Grooming",
//       clientName: "Sarah Johnson",
//       date: "2023-03-18",
//       time: "2:00 PM",
//       clientPhone: "555-123-4567",
//       status: "confirmed"
//     }
//   ],
  
//   // Admin data
//   applications: [
//     {
//       id: "APP123",
//       name: "Robert Brown",
//       type: "seller",
//       email: "robert@petshop.com",
//       phone: "555-987-6543",
//       date: "2023-03-05",
//       businessName: "Robert's Pet Supplies"
//     },
//     {
//       id: "APP124",
//       name: "Lisa Wilson",
//       type: "service",
//       email: "lisa@petvets.com",
//       phone: "555-456-7890",
//       date: "2023-03-07",
//       serviceType: "Veterinarian",
//       qualifications: "Licensed Veterinarian, 5 years experience"
//     }
//   ]
// };
// app.get("/", (req,res)=>{
//   res.render('dash',dashboardData);
// });

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

app.get('/about', (req,res)=>{
  res.render('about', aboutData);
});

app.get('/pets', (req,res)=>{
  res.render('pets', petsData);
});

app.get('/products/detail', (req, res) => {
  res.render('detail', data);
});

app.get('/products/toys', (req, res) => {
  res.render('products', petToysData);
});

app.get('/products/accessories', (req, res) => {  
  res.render('products', petAccessoriesData);
});

const sampleData = {
  applications: [
    {
      id: '1001',
      type: 'seller',
      status: 'pending',
      businessName: 'Happy Paws Pet Shop',
      fullName: 'John Williams',
      email: 'john@happypaws.com',
      phone: '555-123-4567',
      licenseUrl: '/documents/license-1001.pdf',
      dateApplied: '2025-03-10',
      dateReviewed: null
    },
    {
      id: '1002',
      type: 'seller',
      status: 'approved',
      businessName: 'Fluffy Friends Store',
      fullName: 'Sarah Johnson',
      email: 'sarah@fluffyfriends.com',
      phone: '555-987-6543',
      licenseUrl: '/documents/license-1002.pdf',
      dateApplied: '2025-03-08',
      dateReviewed: '2025-03-09'
    },
    {
      id: '1003',
      type: 'service',
      status: 'pending',
      serviceType: 'Grooming',
      fullName: 'Michael Brown',
      email: 'michael@petgrooming.com',
      phone: '555-456-7890',
      licenseUrl: '/documents/license-1003.pdf',
      dateApplied: '2025-03-12',
      dateReviewed: null
    },
    {
      id: '1004',
      type: 'service',
      status: 'rejected',
      serviceType: 'Veterinary',
      fullName: 'Emily Davis',
      email: 'emily@petvet.com',
      phone: '555-789-0123',
      licenseUrl: '/documents/license-1004.pdf',
      dateApplied: '2025-03-05',
      dateReviewed: '2025-03-07'
    },
    {
      id: '1005',
      type: 'seller',
      status: 'approved',
      businessName: 'Premium Pet Supplies',
      fullName: 'David Wilson',
      email: 'david@premiumsupplies.com',
      phone: '555-234-5678',
      licenseUrl: '/documents/license-1005.pdf',
      dateApplied: '2025-03-01',
      dateReviewed: '2025-03-03'
    },
    {
      id: '1006',
      type: 'service',
      status: 'approved',
      serviceType: 'Training',
      fullName: 'Jessica Martinez',
      email: 'jessica@pettraining.com',
      phone: '555-345-6789',
      licenseUrl: '/documents/license-1006.pdf',
      dateApplied: '2025-03-04',
      dateReviewed: '2025-03-06'
    }
  ]
};

// Global variables
let currentTab = 'pending';
let currentType = 'seller';
let currentPage = 1;
let itemsPerPage = 5;
let currentData = [];
let selectedApplicationId = null;
let confirmationCallback = null;


// app.get("/", (req,res)=>{
//   res.render('admin', sampleData);
// });

// Start the server
app.listen(port, () => {
  console.log(`PetVerse app listening at http://localhost:${port}`);
});




