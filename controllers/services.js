const User = require('../models/users');
const Review = require('../models/reviews');

exports.getServices = async (req, res) => {
  try {
    const providers = await User.find({ role: 'service_provider' });
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
      
      const reviews = await Review.find({ 
        targetType: 'ServiceProvider', 
        targetId: provider._id 
      });
      
      console.log(`Found ${reviews.length} reviews for provider ${provider._id}`);
      
      if (reviews.length > 0) {
        console.log(`Sample review - Rating: ${reviews[0].rating}, Comment: ${reviews[0].comment ? reviews[0].comment.substring(0, 30) + '...' : 'No comment'}`);
      }
      
      const reviewCount = reviews.length;
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const formattedRating = parseFloat(avgRating.toFixed(1));

      const topReviews = reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      let price;
      if (provider.serviceType === 'veterinarian' || provider.serviceType === 'trainer') {
        price = 500;
      } else if (provider.serviceType === 'groomer') {
        price = 300;
      } else if (provider.serviceType === 'pet sitter' || provider.serviceType === 'breeder') {
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
        category: categoryMap[provider.serviceType] || 'Pet Service',
        rating: formattedRating,
        reviewCount: reviewCount,
        price: price,
        topReviews: topReviews || [],
        image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg'
      };
    }));

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
