const Review = require("../models/reviews");
const Product = require("../models/products");
const User = require("../models/users");

exports.createReview = async (req, res)=> {
    try {
        const { userId, rating, comment, productId } = req.body;
        if (!userId || !rating || !productId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Missing required fields: userId, rating, productId'
            });
        }
        const user = await User.findById(userId);
        if (!user){
            return res.status(400).json({
                status: 'fail',
                message: 'User not found'
            });
        }
        const product = await Product.findById(productId);
        if (!product){
            return res.status(400).json({
                status: 'fail',
                message: 'Product not found'
            });
        }
        const newReview = await Review.create({
            user: userId,
            rating, 
            comment,
            targetType: 'Product',
            targetId: productId
        });

        res.status(201).json({
            status: "success",
            data: {
                review: newReview
            }
        });
    }
    catch (err){
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getProductReviews = async (req, res)=>{
    try {
        const reviews = await Review.find({
            targetType: 'Product',
            targetId: req.params.productId
        }).populate('user', 'username');
        res.status(200).json({
            status: "success",
            data: {
                reviews
            }
        });
    }
    catch (err){
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};