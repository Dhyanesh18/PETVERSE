const User = require('../models/users');
const Review = require('../models/reviews');

exports.getServices = async (req, res) => {
  try {
    // Find all service providers
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
      // Debug log for provider information
      console.log(`Processing provider: ${provider._id}, Name: ${provider.fullName}`);
      
      // Fetch reviews for this service provider from Review model
      const reviews = await Review.find({ 
        targetType: 'ServiceProvider', 
        targetId: provider._id 
      });
      
      console.log(`Found ${reviews.length} reviews for provider ${provider._id}`);
      
      // Log first review details if available
      if (reviews.length > 0) {
        console.log(`Sample review - Rating: ${reviews[0].rating}, Comment: ${reviews[0].comment ? reviews[0].comment.substring(0, 30) + '...' : 'No comment'}`);
      }
      
      // Calculate review statistics from reviews collection
      const reviewCount = reviews.length;
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      const formattedRating = parseFloat(avgRating.toFixed(1));

      // Get top reviews (limit to 2 most recent)
      const topReviews = reviews
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      // Determine price based on service type (standard pricing)
      let price;
      if (provider.serviceType === 'veterinarian' || provider.serviceType === 'trainer') {
        price = 500;
      } else if (provider.serviceType === 'groomer') {
        price = 300;
      } else if (provider.serviceType === 'pet sitter' || provider.serviceType === 'breeder') {
        price = 200;
      } else {
        price = 400; // Default price for other service types
      }

      // Create service object using only fields that exist in the schemas
      return {
        id: provider._id,
        name: provider.fullName, // From User schema
        username: provider.username, // From User schema
        email: provider.email, // From User schema
        phone: provider.phone, // From User schema
        serviceType: provider.serviceType, // From ServiceProvider schema
        serviceAddress: provider.serviceAddress, // From ServiceProvider schema
        isApproved: provider.isApproved, // From User schema (approval status)
        
        // Mapped and calculated fields
        category: categoryMap[provider.serviceType] || 'Pet Service',
        rating: formattedRating,
        reviewCount: reviewCount,
        price: price,
        topReviews: topReviews || [],
        
        // Default image path
        image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg'
      };
    }));

    console.log(`Rendering services page with ${services.length} service providers`);
    
    // Add a check before rendering to ensure we have valid data
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
    
    // Get reviews for this provider
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
    
    // Check if user has already reviewed this service
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