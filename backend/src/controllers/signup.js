const User = require("../models/users");
const Seller = require("../models/seller");
const ServiceProvider = require("../models/serviceProvider");
const Availability = require("../models/availability");

module.exports = {
    showSignupForm: (req, res) => {
        res.render("signup", {error : null});
    },

    profileChoice: (req, res)=>{
        const userType = req.body.userType; 
        switch(userType) {
            case 'owner':
                res.render('signup-owner');
                break;
            case 'seller':
                res.render('signup-seller');
                break;
            case 'service':
                res.render('signup-service');
                break;
            default:
                res.render("signup",{error: "Please choose a user type!"})
        } 
    },

    handleSignupOwner: async (req, res) => {
        try {
            // Basic validation
            if (!req.body || Object.keys(req.body).length === 0) {
                console.error('Empty body received');
                return res.status(400).json({ 
                    message: "Request body is required",
                    received: false
                });
            }
    
            const { email, username, password, fullName, phone } = req.body;
            
            // Field validation
            if (!email || !username || !password || !fullName || !phone) {
                return res.status(400).json({ 
                    message: 'All fields are required',
                    missingFields: {
                        email: !email,
                        username: !username,
                        password: !password,
                        fullName: !fullName,
                        phone: !phone
                    }
                });
            }
    
            // Check existing user
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
    
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'User with this email or username already exists' 
                });
            }
    
            // Create user
            const newUser = await User.create({
                email,
                username,
                password,
                fullName,
                phone,
                role: 'owner'
            });
    
            return res.status(201).json({
                success: true,
                message: 'Owner registration successful',
                user: {
                    email: newUser.email,
                    username: newUser.username,
                    fullName: newUser.fullName,
                    role: newUser.role
                }
            });
    
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ 
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    handleSignupSeller: async (req, res) => {
        try {
            //Validate required fields
            const requiredFields = {
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                phoneNumber: req.body.phoneNumber,
                fullName: req.body.fullName,
                businessName: req.body.businessName,
                businessAddress: req.body.businessAddress
            };
    
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);
    
            if (missingFields.length > 0 || !req.file) {
                return res.status(400).json({
                    success: false,
                    message: "All fields including license file are required",
                    missing: [...missingFields, ...(!req.file ? ['license'] : [])]
                });
            }
    
            //Check for existing user
            const existingUser = await User.findOne({
                $or: [{ email: req.body.email }, { username: req.body.username }]
            });
    
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User with this email or username already exists"
                });
            }
    
            // Create new seller
            const newSeller = await Seller.create({
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                phone: req.body.phoneNumber,
                fullName: req.body.fullName,
                role: 'seller',
                businessName: req.body.businessName,
                businessAddress: req.body.businessAddress,
                taxId: req.body.taxId || undefined,
                license: {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                },
                isApproved: false
            });

            res.status(201).json({
                success: true,
                message: "Seller registration submitted for admin approval",
                user: {
                    id: newSeller._id,
                    email: newSeller.email,
                    businessName: newSeller.businessName
                }
            });
    
        } catch (error) {
            console.error("Seller signup error:", error);
            res.status(500).json({
                success: false,
                message: process.env.NODE_ENV === 'development' 
                    ? error.message 
                    : "Server error during registration"
            });
        }
    },
    handleSignupServiceProvider: async (req, res) => {
        try {
            // validate required fields
            const requiredFields = {
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                phoneNumber: req.body.phoneNumber,
                fullName: req.body.fullName,
                serviceType: req.body.serviceType,
                businessAddress: req.body.businessAddress
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0 || !req.file) {
                return res.status(400).json({
                    success: false,
                    message: "All fields including certificate file are required",
                    missing: [...missingFields, ...(!req.file ? ['certificate'] : [])]
                });
            }

            // check for existing user
            const existingUser = await User.findOne({
                $or: [{ email: req.body.email }, { username: req.body.username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User with this email or username already exists"
                });
            }

            // Create new service provider
            const newProvider = await ServiceProvider.create({
                email: req.body.email,
                username: req.body.username,
                password: req.body.password,
                phone: req.body.phoneNumber,
                fullName: req.body.fullName,
                role: 'service_provider',
                serviceType: req.body.serviceType,
                serviceAddress: req.body.businessAddress,
                certificate: {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                },
                isApproved: false
            });

            req.session.userId = newProvider._id;

            res.status(201).json({
                success: true,
                message: "Service provider registration submitted for approval",
                user: {
                    id: newProvider._id,
                    email: newProvider.email,
                    serviceType: newProvider.serviceType
                }
            });

        } catch (error) {
            console.error("Service provider signup error:", error);
            res.status(500).json({
                success: false,
                message: process.env.NODE_ENV === 'development' 
                    ? error.message 
                    : "Server error during registration"
            });
        }
    },

    saveAvailability: async (req, res) => {
        try {
            const { days } = req.body;
            const serviceProviderId = req.session.userId;
    
            if (!serviceProviderId) {
                return res.status(401).send('Unauthorized: No user session found.');
            }
    
            let existing = await Availability.findOne({ serviceProvider: serviceProviderId });
            const existingDaysMap = {};
    
            if (existing) {
                for (let d of existing.days) {
                    existingDaysMap[d.day] = {
                        isHoliday: d.isHoliday,
                        slots: d.slots
                    };
                }
            }
    
            for (let day in days) {
                const isHoliday = !!days[day].isHoliday;
                let slots = [];
    
                if (!isHoliday && days[day].slots) {
                    const slotArr = Object.values(days[day].slots);
                    slots = slotArr
                        .filter(slot => slot.start && slot.end)
                        .map(slot => ({
                            start: slot.start,
                            end: slot.end
                        }));
                }

                existingDaysMap[day] = {
                    isHoliday,
                    slots: isHoliday ? [] : slots
                };
            }
    
            const finalDays = Object.entries(existingDaysMap).map(([day, data]) => ({
                day,
                isHoliday: data.isHoliday,
                slots: data.slots
            }));
    
            await Availability.findOneAndUpdate(
                { serviceProvider: serviceProviderId },
                { $set: { days: finalDays } },
                { upsert: true, new: true, runValidators: true }
            );
    
            res.redirect('/dashboard'); 
        } catch (err) {
            console.error('Error saving availability:', err);
            res.status(500).send('Server error while saving availability');
        }
    }
};