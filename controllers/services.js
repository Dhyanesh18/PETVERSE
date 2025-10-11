const User = require('../models/users');
const Review = require('../models/reviews');
const Wallet = require('../models/wallet');

exports.getServices = async (req, res) => {
  try {
    // Only fetch providers with a valid serviceType
    const providers = await User.find({ 
      role: 'service_provider',
      serviceType: { $exists: true, $ne: null, $ne: '' }
    });
    console.log(`Found ${providers.length} service providers`);

    const categoryMap = {
      'veterinarian': 'Veterinary Doctor',
      'groomer': 'Pet Grooming',
      'trainer': 'Dog Training',
      'pet sitter': 'Pet Sitting',
      'breeder': 'Breeding Services',
      'walking': 'Dog Walking',
      'sitting': 'Pet Sitting'
    };

    const services = await Promise.all(providers.map(async (provider) => {
      console.log(`Processing provider: ${provider._id}, Name: ${provider.fullName}`);
      
      // Fetch reviews from MongoDB with user information populated
      const reviews = await Review.find({ 
        targetType: 'ServiceProvider', 
        targetId: provider._id 
      }).populate('user', 'fullName username');
      
      console.log(`Found ${reviews.length} reviews for provider ${provider._id}`);
      
      if (reviews.length > 0) {
        console.log(`Sample review - Rating: ${reviews[0].rating}, Comment: ${reviews[0].comment ? reviews[0].comment.substring(0, 30) + '...' : 'No comment'}`);
      }
      
      const reviewCount = reviews.length;
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const formattedRating = parseFloat(avgRating.toFixed(1));

      // Get top 2 most recent reviews with user data from MongoDB
      const topReviews = reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2)
        .map(review => ({
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          userName: review.user ? review.user.fullName : 'Anonymous'
        }));
      
      // Skip providers without serviceType (safety check)
      if (!provider.serviceType) {
        return null;
      }
      
      // Calculate price based on service type
      let price;
      const serviceType = provider.serviceType.toLowerCase();
      if (serviceType === 'veterinarian' || serviceType === 'trainer') {
        price = 500;
      } else if (serviceType === 'groomer') {
        price = 300;
      } else if (serviceType === 'pet sitter' || serviceType === 'breeder') {
        price = 200;
      } else {
        price = 400;
      }

      return {
        id: provider._id,
        name: provider.fullName,
        username: provider.username,
        email: provider.email,
        phone: provider.phone,
        serviceType: provider.serviceType,
        serviceAddress: provider.serviceAddress,
        isApproved: provider.isApproved,
        category: categoryMap[serviceType] || provider.serviceType,
        rating: formattedRating,
        reviewCount: reviewCount,
        price: price,
        topReviews: topReviews || [],
        image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg'
      };
    }));

    // Filter out null values (providers without serviceType)
    services = services.filter(service => service !== null);

    console.log(`Rendering services page with ${services.length} service providers`);
    
    if (services.length === 0) {
      console.log('No services found to display');
    }

    res.render('services', { 
      pageTitle: 'Pet Services', 
      services,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).render('error', { message: 'Error loading services' });
  }
};

exports.getServiceDetails = async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = await User.findById(providerId);
    
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).render('error', { message: 'Service provider not found' });
    }
    
    const reviews = await Review.find({ 
      targetType: 'ServiceProvider', 
      targetId: providerId 
    }).populate('user', 'fullName username');
    
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0;
    
    const categoryMap = {
      'veterinarian': 'Veterinary Doctor',
      'groomer': 'Pet Grooming',
      'trainer': 'Dog Training',
      'pet sitter': 'Pet Sitting',
      'breeder': 'Breeding Services',
      'walking': 'Dog Walking',
      'sitting': 'Pet Sitting'
    };
    
    let price;
    if (provider.serviceType === 'veterinarian' || provider.serviceType === 'trainer') {
      price = 500;
    } else if (provider.serviceType === 'groomer') {
      price = 300;
    } else if (provider.serviceType === 'walking' || provider.serviceType === 'sitting') {
      price = 200;
    } else {
      price = 400;
    }
    
    const serviceDetails = {
      id: provider._id,
      name: provider.fullName || 'Service Provider',
      category: categoryMap[provider.serviceType] || provider.serviceType || 'Pet Service',
      location: provider.serviceAddress || 'Available Locally',
      description: provider.description || 'Professional pet services provider.',
      email: provider.email,
      phone: provider.phone || 'Contact via email',
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviewCount,
      price: price,
      image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg',
      reviews: reviews
    };
    
    let userReview = null;
    if (req.user && req.user._id) {
      userReview = await Review.findOne({
        user: req.user._id,
        targetType: 'ServiceProvider',
        targetId: providerId
      });
    }
    
    res.render('service-details', { 
      pageTitle: `${serviceDetails.name} - ${serviceDetails.category}`,
      service: serviceDetails,
      user: req.user,
      userReview: userReview
    });
  } catch (err) {
    console.error('Error fetching service details:', err);
    res.status(500).render('error', { message: 'Error loading service details' });
  }
};

// Service payment pages and handler (similar to events)
exports.getServicePaymentPage = async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = await User.findById(providerId).lean();
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).render('error', { message: 'Service provider not found' });
    }

    const mapPrice = (serviceType) => {
      if (serviceType === 'veterinarian' || serviceType === 'trainer') return 500;
      if (serviceType === 'groomer') return 300;
      if (serviceType === 'walking' || serviceType === 'sitting' || serviceType === 'pet sitter') return 200;
      if (serviceType === 'breeder') return 200;
      return 400;
    };

    const price = mapPrice(provider.serviceType);
    const wallet = await Wallet.findOne({ user: req.user._id });

    const service = {
      _id: provider._id,
      title: provider.fullName || 'Service Booking',
      category: provider.serviceType,
      date: null,
      startTime: null,
      endTime: null,
      location: { venue: provider.serviceAddress, city: provider.serviceAddress },
      entryFee: price
    };

    return res.render('service-payment', { user: req.user, wallet: wallet || { balance: 0 }, service });
  } catch (err) {
    console.error('Service payment page error:', err);
    res.status(500).render('error', { message: 'Failed to load payment page' });
  }
};

exports.payForService = async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = await User.findById(providerId).lean();
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const mapPrice = (serviceType) => {
      if (serviceType === 'veterinarian' || serviceType === 'trainer') return 500;
      if (serviceType === 'groomer') return 300;
      if (serviceType === 'walking' || serviceType === 'sitting' || serviceType === 'pet sitter') return 200;
      if (serviceType === 'breeder') return 200;
      return 400;
    };
    const amount = mapPrice(provider.serviceType);

    const { paymentMethod, details } = req.body || {};
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet) return res.status(400).json({ success: false, message: 'Wallet not found' });
      if (wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      await wallet.deductFunds(amount);
    } else if (paymentMethod === 'upi') {
      const upiId = details && details.upiId ? String(details.upiId).trim() : '';
      const upiRegex = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
      if (!upiRegex.test(upiId)) {
        return res.status(400).json({ success: false, message: 'Invalid UPI ID' });
      }
    } else if (paymentMethod === 'credit-card') {
      const name = details && details.cardName ? String(details.cardName).trim() : '';
      const number = details && details.cardNumber ? String(details.cardNumber).replace(/\s+/g, '') : '';
      const expiry = details && details.expiryDate ? String(details.expiryDate).trim() : '';
      const cvv = details && details.cvv ? String(details.cvv).trim() : '';
      const numRegex = /^\d{13,19}$/;
      const expRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
      const cvvRegex = /^\d{3,4}$/;
      if (!name || !numRegex.test(number) || !expRegex.test(expiry) || !cvvRegex.test(cvv)) {
        return res.status(400).json({ success: false, message: 'Invalid card details' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported payment method' });
    }

    // After payment success, redirect to owner dashboard; booking confirmation is already created earlier
    return res.json({ success: true, redirect: `/owner-dashboard` });
  } catch (err) {
    console.error('Service payment error:', err);
    res.status(500).json({ success: false, message: 'Payment failed' });
  }
};

// NEW FUNCTION - AJAX endpoint to get reviews
exports.getProviderReviews = async (req, res) => {
  try {
    const providerId = req.params.providerId;
    
    const reviews = await Review.find({ 
      targetType: 'ServiceProvider', 
      targetId: providerId 
    })
    .populate('user', 'fullName username')
    .sort({ createdAt: -1 });
    
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0;
    
    res.json({
      success: true,
      reviews: reviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviewCount
    });
  } catch (err) {
    console.error('Error fetching provider reviews:', err);
    res.status(500).json({
      success: false,
      message: 'Error loading reviews'
    });
  }
};

exports.getBreederServices = async (req, res) => {
    try {
        const breedingProviders = await User.find({ 
            role: 'service_provider',
            serviceType: 'breeder'
        });

        const services = await Promise.all(breedingProviders.map(async (provider) => {
            const reviews = await Review.find({ 
                targetType: 'ServiceProvider', 
                targetId: provider._id 
            });
            
            const reviewCount = reviews.length;
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
            
            return {
                id: provider._id,
                name: provider.fullName,
                email: provider.email,
                phone: provider.phone,
                serviceType: provider.serviceType,
                serviceAddress: provider.serviceAddress,
                category: 'Breeding Services',
                rating: parseFloat(avgRating.toFixed(1)),
                reviewCount: reviewCount,
                price: 200,
                image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg'
            };
        }));

        res.render('services2', { 
            pageTitle: 'Breeding Services',
            services: services,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching breeder services:', error);
        res.status(500).render('error', { 
            message: 'Error loading breeder services' 
        });
    }
};

exports.filterBreedersByLocation = async (req, res) => {
    try {
        const locationQuery = req.query.location;
        
        let query = {
            role: 'service_provider',
            serviceType: 'breeder'
        };

        if (locationQuery) {
            query.serviceAddress = new RegExp(locationQuery, 'i');
        }

        const breeders = await User.find(query);
        
        const services = breeders.map(breeder => ({
            _id: breeder._id,
            fullName: breeder.fullName,
            email: breeder.email,
            phone: breeder.phone,
            serviceType: breeder.serviceType,
            serviceAddress: breeder.serviceAddress
        }));

        res.json({
            services,
            isEmpty: services.length === 0
        });
    } catch (error) {
        console.error('Error filtering breeders:', error);
        res.status(500).json({ 
            message: 'Error filtering breeders',
            error: error.message 
        });
    }
};

// NEW FUNCTION - API endpoint for filtering services with reviews
exports.filterServices = async (req, res) => {
  try {
    const { categories, minPrice, maxPrice, minRating } = req.query;
    
    let query = { 
      role: 'service_provider',
      serviceType: { $exists: true, $ne: null, $ne: '' }
    };
    
    // Filter by categories
    if (categories) {
      const categoryArray = categories.split(',').map(c => c.trim().toLowerCase());
      query.serviceType = { $in: categoryArray };
    }
    
    const providers = await User.find(query);
    
    const categoryMap = {
      'veterinarian': 'Veterinary Doctor',
      'groomer': 'Pet Grooming',
      'trainer': 'Dog Training',
      'pet sitter': 'Pet Sitting',
      'breeder': 'Breeding Services',
      'walking': 'Dog Walking',
      'sitting': 'Pet Sitting'
    };

    const services = await Promise.all(providers.map(async (provider) => {
      // Fetch reviews from MongoDB with user information populated
      const reviews = await Review.find({ 
        targetType: 'ServiceProvider', 
        targetId: provider._id 
      }).populate('user', 'fullName username');
      
      const reviewCount = reviews.length;
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const formattedRating = parseFloat(avgRating.toFixed(1));

      // Get top 2 most recent reviews with user data
      const topReviews = reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2)
        .map(review => ({
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          userName: review.user ? review.user.fullName : 'Anonymous'
        }));
      
      // Skip providers without serviceType (safety check)
      if (!provider.serviceType) {
        return null;
      }
      
      // Calculate price based on service type
      let price;
      const serviceType = provider.serviceType.toLowerCase();
      if (serviceType === 'veterinarian' || serviceType === 'trainer') {
        price = 500;
      } else if (serviceType === 'groomer') {
        price = 300;
      } else if (serviceType === 'pet sitter' || serviceType === 'breeder') {
        price = 200;
      } else {
        price = 400;
      }

      return {
        id: provider._id,
        fullName: provider.fullName || 'Service Provider',
        username: provider.username,
        email: provider.email,
        phone: provider.phone,
        serviceType: provider.serviceType,
        serviceAddress: provider.serviceAddress || 'Location not specified',
        isApproved: provider.isApproved,
        category: categoryMap[serviceType] || provider.serviceType,
        rating: formattedRating,
        reviewCount: reviewCount,
        price: price,
        topReviews: topReviews || [],
        image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg'
      };
    }));

    // Filter out null values (providers without serviceType)
    let filteredServices = services.filter(service => service !== null);
    
    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredServices = filteredServices.filter(s => s && s.price >= min);
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredServices = filteredServices.filter(s => s && s.price <= max);
    }
    
    if (minRating) {
      const rating = parseFloat(minRating);
      filteredServices = filteredServices.filter(s => s && s.rating >= rating);
    }

    res.json({
      success: true,
      services: filteredServices,
      count: filteredServices.length
    });
  } catch (err) {
    console.error('Error filtering services:', err);
    res.status(500).json({
      success: false,
      message: 'Error filtering services'
    });
  }
};
