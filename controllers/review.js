const Review = require("../models/reviews");
const Product = require("../models/products");
const User = require("../models/users");

// Get a user's existing review
exports.getUserReview = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to access your review'
      });
    }

    if (!targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: targetType, targetId'
      });
    }

    const review = await Review.findOne({
      user: userId,
      targetType,
      targetId
    });

    if (!review) {
      return res.status(200).json({
        success: true,
        hasReview: false,
        message: 'No review found for this user and target'
      });
    }

    return res.status(200).json({
      success: true,
      hasReview: true,
      review
    });
  } catch (err) {
    console.error('Error fetching user review:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your review'
    });
  }
};

// UPDATED - Create review with JSON response (NO ALERT/RELOAD)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, targetType, targetId } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to leave a review'
      });
    }

    if (!rating || !targetType || !targetId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: rating, targetType, targetId'
      });
    }

    console.log('Creating review with data:', {
      userId,
      rating,
      comment,
      targetType,
      targetId
    });

    // Validate target exists
    let targetExists = false;
    if (targetType === 'Product') {
      const product = await Product.findById(targetId);
      targetExists = !!product;
    } else if (targetType === 'Seller') {
      const seller = await User.findById(targetId);
      targetExists = !!seller && seller.role === 'seller';
    } else if (targetType === 'ServiceProvider') {
      const provider = await User.findById(targetId);
      targetExists = !!provider && provider.role === 'service_provider';
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        message: `${targetType} not found`
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: userId,
      targetType,
      targetId
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
      
      console.log('Review updated successfully:', existingReview);
      
      // Calculate new average rating
      const allReviews = await Review.find({ targetType, targetId });
      const reviewCount = allReviews.length;
      const avgRating = reviewCount > 0 
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
        : 0;
      
      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        review: existingReview,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviewCount
      });
    }

    // Create new review
    const newReview = new Review({
      user: userId,
      rating,
      comment,
      targetType,
      targetId
    });

    await newReview.save();
    console.log('Review created successfully:', newReview);

    // Populate user info
    await newReview.populate('user', 'fullName username');

    // Calculate new average rating
    const allReviews = await Review.find({ targetType, targetId });
    const reviewCount = allReviews.length;
    const avgRating = reviewCount > 0 
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
      : 0;

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview,
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviewCount
    });

  } catch (err) {
    console.error('Error creating review:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your review'
    });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({
      targetType: 'Product',
      targetId: productId
    })
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 });

    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

    return res.status(200).json({
      success: true,
      reviews,
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewCount
    });
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching reviews'
    });
  }
};
