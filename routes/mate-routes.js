const express = require('express');
const router = express.Router();
const multer = require('multer');
const mateController = require('../controllers/petMate');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 4,
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});
const auth = require('../middleware/auth');

// API route for filtering pets - must come before /mate route
router.get('/mate/api/filter', mateController.filterPets);

router.post('/mate/add', auth.isAuthenticated, upload.array('petImage', 4), mateController.addMateListing);
router.get('/mate/image/:mateId/:index', mateController.getMateImage);




const petMateData = {
    // Pet listings
    pets: [
        {
            id: 1,
            name: "Rocky",
            type: "dog",
            breed: "Labrador Retriever",
            age: "2 years",
            gender: "male",
            image: "/images/pets/labrador.jpg",
            state: "Karnataka",
            district: "Bangalore",
            contact: "9876543210",
            description: "Healthy and playful Labrador with excellent temperament. AKC registered with all vaccinations up to date."
        },
        {
            id: 2,
            name: "Luna",
            type: "dog",
            breed: "German Shepherd",
            age: "3 years",
            gender: "female",
            image: "/images/pets/german.jpg",
            state: "Maharashtra",
            district: "Mumbai",
            contact: "8765432109",
            description: "Beautiful German Shepherd with show-quality bloodlines. Looking for a similar breed partner."
        },
        {
            id: 3,
            name: "Simba",
            type: "cat",
            breed: "Persian",
            age: "1.5 years",
            gender: "male",
            image: "/images/pets/persian.jpg",
            state: "Tamil Nadu",
            district: "Chennai",
            contact: "7654321098",
            description: "Pure Persian cat with luxurious coat. Prize-winning bloodline."
        },
        {
            id: 4,
            name: "Daisy",
            type: "dog",
            breed: "Pomeranian",
            age: "2.5 years",
            gender: "female",
            image: "/images/pets/pom.jpg",
            state: "Delhi",
            district: "New Delhi",
            contact: "6543210987",
            description: "Adorable and healthy Pomeranian. Has won several local competitions."
        },
        {
            id: 5,
            name: "Leo",
            type: "dog",
            breed: "Beagle",
            age: "3 years",
            gender: "male",
            image: "/images/pets/beagle.jpg",
            state: "Gujarat",
            district: "Ahmedabad",
            contact: "5432109876",
            description: "Energetic Beagle with great hunting lineage. All health checks complete."
        },
        {
            id: 6,
            name: "Bella",
            type: "cat",
            breed: "Siamese",
            age: "2 years",
            gender: "female",
            image: "/images/pets/siamese.jpg",
            state: "Kerala",
            district: "Kochi",
            contact: "4321098765",
            description: "Purebred Siamese with beautiful blue eyes. Very affectionate and healthy."
        },
        {
            id: 7,
            name: "Max",
            type: "dog",
            breed: "Golden Retriever",
            age: "4 years",
            gender: "male",
            image: "/images/pets/golden.jpg",
            state: "Punjab",
            district: "Chandigarh",
            contact: "3210987654",
            description: "Friendly Golden Retriever with excellent health record and temperament."
        },
        {
            id: 8,
            name: "Zara",
            type: "dog",
            breed: "Shih Tzu",
            age: "3 years",
            gender: "female",
            image: "/images/pets/shihtzu.jpg",
            state: "Telangana",
            district: "Hyderabad",
            contact: "2109876543",
            description: "Beautiful coat and loving personality. Looking for a compatible mate."
        }
    ],
    
    // Filter options for pet types
    petTypes: [
        { value: "dog", label: "Dog" },
        { value: "cat", label: "Cat" },
        { value: "bird", label: "Bird" },
        { value: "rabbit", label: "Rabbit" },
        { value: "hamster", label: "Hamster" },
        { value: "fish", label: "Fish" }
    ],
    
    // Filter options for breeds (sample for common breeds)
    breeds: [
        // Dogs
        { value: "labrador", label: "Labrador Retriever" },
        { value: "german_shepherd", label: "German Shepherd" },
        { value: "golden_retriever", label: "Golden Retriever" },
        { value: "beagle", label: "Beagle" },
        { value: "pomeranian", label: "Pomeranian" },
        { value: "pug", label: "Pug" },
        { value: "shih_tzu", label: "Shih Tzu" },
        { value: "doberman", label: "Doberman" },
        { value: "rottweiler", label: "Rottweiler" },
        { value: "boxer", label: "Boxer" },
        { value: "dalmatian", label: "Dalmatian" },
        
        // Cats
        { value: "persian", label: "Persian" },
        { value: "siamese", label: "Siamese" },
        { value: "maine_coon", label: "Maine Coon" },
        { value: "ragdoll", label: "Ragdoll" },
        { value: "bengal", label: "Bengal" },
        { value: "british_shorthair", label: "British Shorthair" },
        { value: "sphynx", label: "Sphynx" }
    ],
    
    // Indian states for location filter
    states: [
        { value: "andhra_pradesh", label: "Andhra Pradesh" },
        { value: "arunachal_pradesh", label: "Arunachal Pradesh" },
        { value: "assam", label: "Assam" },
        { value: "bihar", label: "Bihar" },
        { value: "chhattisgarh", label: "Chhattisgarh" },
        { value: "goa", label: "Goa" },
        { value: "gujarat", label: "Gujarat" },
        { value: "haryana", label: "Haryana" },
        { value: "himachal_pradesh", label: "Himachal Pradesh" },
        { value: "jharkhand", label: "Jharkhand" },
        { value: "karnataka", label: "Karnataka" },
        { value: "kerala", label: "Kerala" },
        { value: "madhya_pradesh", label: "Madhya Pradesh" },
        { value: "maharashtra", label: "Maharashtra" },
        { value: "manipur", label: "Manipur" },
        { value: "meghalaya", label: "Meghalaya" },
        { value: "mizoram", label: "Mizoram" },
        { value: "nagaland", label: "Nagaland" },
        { value: "odisha", label: "Odisha" },
        { value: "punjab", label: "Punjab" },
        { value: "rajasthan", label: "Rajasthan" },
        { value: "sikkim", label: "Sikkim" },
        { value: "tamil_nadu", label: "Tamil Nadu" },
        { value: "telangana", label: "Telangana" },
        { value: "tripura", label: "Tripura" },
        { value: "uttar_pradesh", label: "Uttar Pradesh" },
        { value: "uttarakhand", label: "Uttarakhand" },
        { value: "west_bengal", label: "West Bengal" },
        { value: "delhi", label: "Delhi" }
    ]
};

// Display mate listings page
router.get('/mate', mateController.showMatePage);

module.exports = router;