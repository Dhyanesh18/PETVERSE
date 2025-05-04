const Product = require("../models/products");

module.exports = {
    getProduct: async (req, res)=> {
        try {
            const product = await Product.findById(req.params.productId);
            res.status(200).json({
                status: "success",
                data: {
                    product
                }
            });
        }
        catch (err) {
            res.status(400).json({
                status: "fail",
                message: err.message
            });
        }
    }
};