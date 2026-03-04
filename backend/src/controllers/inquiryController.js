const Inquiry = require('../models/inquiry');
const Pet = require('../models/pets');

// Send a new inquiry message
exports.sendInquiry = async (req, res) => {
    try {
        const { petId, sellerId, message } = req.body;
        const customerId = req.user._id;

        // Validate required fields
        if (!petId || !sellerId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Pet ID, seller ID, and message are required'
            });
        }

        // Validate message length
        if (message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message cannot be empty'
            });
        }

        // Verify pet exists
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                error: 'Pet not found'
            });
        }

        // Check if an inquiry already exists between this customer and seller for this pet
        let inquiry = await Inquiry.findOne({
            petId,
            customer: customerId,
            seller: sellerId,
            status: 'active'
        });

        if (inquiry) {
            // Add message to existing inquiry
            inquiry.messages.push({
                sender: customerId,
                content: message.trim(),
                timestamp: new Date(),
                read: false
            });
            inquiry.lastMessage = new Date();
            await inquiry.save();
        } else {
            // Create new inquiry
            inquiry = await Inquiry.create({
                petId,
                customer: customerId,
                seller: sellerId,
                messages: [{
                    sender: customerId,
                    content: message.trim(),
                    timestamp: new Date(),
                    read: false
                }],
                lastMessage: new Date()
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            inquiryId: inquiry._id
        });

    } catch (error) {
        console.error('Error sending inquiry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send message. Please try again.'
        });
    }
};

// Get all inquiries for a user (customer or seller)
exports.getInquiries = async (req, res) => {
    try {
        const userId = req.user._id;
        const { role } = req.query; // 'customer' or 'seller'

        let query = {};
        if (role === 'seller') {
            query.seller = userId;
        } else {
            query.customer = userId;
        }

        const inquiries = await Inquiry.find(query)
            .populate('petId', 'name breed images price')
            .populate('customer', 'username email')
            .populate('seller', 'username email businessName')
            .sort({ lastMessage: -1 });

        res.status(200).json({
            success: true,
            inquiries
        });

    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inquiries'
        });
    }
};

// Get a specific inquiry with all messages
exports.getInquiryById = async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const userId = req.user._id;

        const inquiry = await Inquiry.findById(inquiryId)
            .populate('petId', 'name breed images price')
            .populate('customer', 'username email')
            .populate('seller', 'username email businessName')
            .populate('messages.sender', 'username');

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                error: 'Inquiry not found'
            });
        }

        // Verify user is part of this inquiry
        if (!inquiry.customer._id.equals(userId) && !inquiry.seller._id.equals(userId)) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this inquiry'
            });
        }

        // Mark messages as read if user is the seller
        if (inquiry.seller._id.equals(userId)) {
            inquiry.messages.forEach(msg => {
                if (!msg.sender.equals(userId)) {
                    msg.read = true;
                }
            });
            await inquiry.save();
        }

        res.status(200).json({
            success: true,
            inquiry
        });

    } catch (error) {
        console.error('Error fetching inquiry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inquiry details'
        });
    }
};

// Reply to an inquiry
exports.replyToInquiry = async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const { message } = req.body;
        const userId = req.user._id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message cannot be empty'
            });
        }

        const inquiry = await Inquiry.findById(inquiryId);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                error: 'Inquiry not found'
            });
        }

        // Verify user is part of this inquiry
        if (!inquiry.customer.equals(userId) && !inquiry.seller.equals(userId)) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this inquiry'
            });
        }

        // Add message
        inquiry.messages.push({
            sender: userId,
            content: message.trim(),
            timestamp: new Date(),
            read: false
        });
        inquiry.lastMessage = new Date();
        await inquiry.save();

        res.status(200).json({
            success: true,
            message: 'Reply sent successfully'
        });

    } catch (error) {
        console.error('Error replying to inquiry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send reply'
        });
    }
};

// Close an inquiry
exports.closeInquiry = async (req, res) => {
    try {
        const { inquiryId } = req.params;
        const userId = req.user._id;

        const inquiry = await Inquiry.findById(inquiryId);

        if (!inquiry) {
            return res.status(404).json({
                success: false,
                error: 'Inquiry not found'
            });
        }

        // Verify user is part of this inquiry
        if (!inquiry.customer.equals(userId) && !inquiry.seller.equals(userId)) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this inquiry'
            });
        }

        inquiry.status = 'closed';
        await inquiry.save();

        res.status(200).json({
            success: true,
            message: 'Inquiry closed successfully'
        });

    } catch (error) {
        console.error('Error closing inquiry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to close inquiry'
        });
    }
};
