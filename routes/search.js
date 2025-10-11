const express = require("express");
const router = express.Router();

const Pet = require("../models/pets");
const Product = require("../models/products");
const ServiceProvider = require("../models/serviceProvider");


// Reusable search helper
async function searchAllCollections(query, limit) {
    const regex = new RegExp(query, "i"); // case-insensitive search

    const [pets, products, services] = await Promise.all([
        Pet.find({ $or: [{ name: regex }, { breed: regex }, { category: regex }] }).limit(limit),
        Product.find({ $or: [{ name: regex }, { brand: regex }, { category: regex }] }).limit(limit),
        ServiceProvider.find({
        $or: [{ serviceType: regex }, { serviceAddress: regex }]
        }).limit(limit),
    ]);

    return { pets, products, services };
}


// JSON API (for AJAX search bar)
router.get("/api", async (req, res) => {
    const query = req.query.term;
    if (!query || query.trim() === "") {
        return res.json({ pets: [], products: [], services: [] });
    }

    try {
        const results = await searchAllCollections(query, 5);
        res.json(results);
    } catch (err) {
        console.error("Search API error:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// Full page results 
router.get("/", async (req, res) => {
    const query = req.query.q;
    
    if (!query || query.trim() === "") {
        return res.render("searchResults", {
        query: "",
        pets: [],
        products: [],
        services: [],
        });
    }

    try {
        const results = await searchAllCollections(query, 10);
        res.render("searchResults", { query, ...results });
    } catch (err) {
        console.error("Search page error:", err);
        res.status(500).send("Server error");
    }
});


module.exports = router;
