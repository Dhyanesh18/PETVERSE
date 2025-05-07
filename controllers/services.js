const User = require('../models/users');
const Review = require('../models/reviews');

exports.getServices = async (req, res) => {
  try {
    const providers = await User.find({ role: 'service_provider' });

    const categoryMap = {
      'veterinarian': 'Veterinary Doctor',
      'groomer': 'Pet Grooming',
      'trainer': 'Dog Training',
      'pet sitter': 'Pet Sitting',
      'breeder': 'Breeding Services'
    };

    const services = await Promise.all(providers.map(async (provider) => {
      const reviews = await Review.find({ targetType: 'ServiceProvider', targetId: provider._id });
      const reviewCount = reviews.length;
      const avgRating = reviewCount > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0;

      let price;
      if (provider.serviceType === 'veterinarian' || provider.serviceType === 'trainer') {
        price = 500;
      } else {
        price = null;
      }

      return {
        id: provider._id,
        name: provider.fullName,
        category: categoryMap[provider.serviceType] || provider.serviceType,
        location: provider.serviceAddress,
        description: provider.description || '',
        rating: avgRating,
        reviewCount: reviewCount,
        price: price,
        image: provider.image ? `/images/provider/${provider._id}` : '/images/default-provider.jpg'
      };
    }));

    res.render('services', { 
      pageTitle: 'Services', 
      services,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).render('error', { message: 'Error loading services' });
  }
};