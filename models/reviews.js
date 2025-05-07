const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 200
    },
    targetType: {
        type: String,
        required: true,
        enum: ['Product', 'Seller', 'ServiceProvider']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetType'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true }
});

reviewSchema.index({ targetType: 1, targetId: 1 });

reviewSchema.post('save', async function(review) {
    if (review.targetType === 'Product') {
        await updateProductStats(review.targetId);
    } else if (review.targetType === 'ServiceProvider') {
        await updateServiceProviderStats(review.targetId);
    }
});

reviewSchema.post('remove', async function(review) {
    if (review.targetType === 'Product') {
        await updateProductStats(review.targetId);
    } else if (review.targetType === 'ServiceProvider') {
        await updateServiceProviderStats(review.targetId);
    }
});

const updateProductStats = async (productId) => {
    const stats = await mongoose.model('Review').aggregate([
        {
            $match: { 
                targetType: 'Product',
                targetId: productId 
            }
        },
        {
            $group: {
                _id: '$targetId',
                avgRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    const update = {
        avgRating: stats[0]?.avgRating?.toFixed(1) || 0,
        reviewCount: stats[0]?.reviewCount || 0
    };

    await mongoose.model('Product').findByIdAndUpdate(
        productId,
        { $set: update },
        { new: true, runValidators: true }
    );
};

const updateServiceProviderStats = async (providerId) => {
    const stats = await mongoose.model('Review').aggregate([
        {
            $match: { 
                targetType: 'ServiceProvider',
                targetId: providerId 
            }
        },
        {
            $group: {
                _id: '$targetId',
                avgRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    const update = {
        avgRating: stats[0]?.avgRating?.toFixed(1) || 0,
        reviewCount: stats[0]?.reviewCount || 0
    };

    await mongoose.model('User').findByIdAndUpdate(
        providerId,
        { $set: update },
        { new: true, runValidators: true }
    );
};

module.exports = mongoose.model('Review', reviewSchema);