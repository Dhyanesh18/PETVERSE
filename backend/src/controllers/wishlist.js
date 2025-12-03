const Pet = require('../models/pets');
const Product = require('../models/products');
const User = require('../models/users');
const mongoose = require('mongoose');

// Get user's wishlist items
const getWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }

        // Get user and their wishlist arrays
        const user = await User.findById(userId).lean();
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Find pets and products using user's wishlist arrays
        const [pets, products] = await Promise.all([
            Pet.find({ _id: { $in: user.wishlistPets || [] } }).select('name breed category price description images createdAt').lean(),
            Product.find({ _id: { $in: user.wishlistProducts || [] } }).select('name category price description images createdAt').lean()
        ]);

        res.json({
            success: true,
            data: {
                pets: pets || [],
                products: products || [],
                totalCount: (pets?.length || 0) + (products?.length || 0)
            }
        });

    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Toggle wishlist status for a pet
const togglePetWishlist = async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pet not found' 
            });
        }

        // Get user and toggle pet in wishlist array
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const petIdObj = new mongoose.Types.ObjectId(petId);
        const isInWishlist = user.wishlistPets.some(id => id.equals(petIdObj));
        
        if (isInWishlist) {
            // Remove from wishlist
            user.wishlistPets = user.wishlistPets.filter(id => !id.equals(petIdObj));
        } else {
            // Add to wishlist
            user.wishlistPets.push(petIdObj);
        }
        
        await user.save();

        res.json({
            success: true,
            message: !isInWishlist ? 'Pet added to wishlist' : 'Pet removed from wishlist',
            data: { 
                petId: pet._id, 
                isWishlisted: !isInWishlist
            }
        });

    } catch (error) {
        console.error('Error toggling pet wishlist:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Toggle wishlist status for a product
const toggleProductWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        // Get user and toggle product in wishlist array
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const productIdObj = new mongoose.Types.ObjectId(productId);
        const isInWishlist = user.wishlistProducts.some(id => id.equals(productIdObj));
        
        if (isInWishlist) {
            // Remove from wishlist
            user.wishlistProducts = user.wishlistProducts.filter(id => !id.equals(productIdObj));
        } else {
            // Add to wishlist
            user.wishlistProducts.push(productIdObj);
        }
        
        await user.save();

        res.json({
            success: true,
            message: !isInWishlist ? 'Product added to wishlist' : 'Product removed from wishlist',
            data: { 
                productId: product._id, 
                isWishlisted: !isInWishlist
            }
        });

    } catch (error) {
        console.error('Error toggling product wishlist:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

// Get wishlist status for a specific item
const getWishlistStatus = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.session.userId;

        if (!userId) {
            return res.json({ 
                success: true, 
                inWishlist: false 
            });
        }

        let item;
        if (type === 'pet') {
            item = await Pet.findById(id).select('wishlist');
        } else if (type === 'product') {
            item = await Product.findById(id).select('wishlist');
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid item type' 
            });
        }

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        res.json({
            success: true,
            inWishlist: item.wishlist
        });

    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

module.exports = {
    getWishlist,
    togglePetWishlist,
    toggleProductWishlist,
    getWishlistStatus
};