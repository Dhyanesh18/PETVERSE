const FoundClaim = require('../models/foundClaim');
const LostPet = require('../models/lostPet');

// Submit a found claim
exports.submitFoundClaim = async (req, res) => {
    try {
        const { lostPetId } = req.params;
        
        // Validate images
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You must upload at least one clear image of the found pet for verification'
            });
        }

        // Check if lost pet exists
        const lostPet = await LostPet.findById(lostPetId);
        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        // Check if pet is still lost
        if (lostPet.status !== 'lost') {
            return res.status(400).json({
                success: false,
                message: 'This pet is no longer listed as lost'
            });
        }

        // Prevent owner from claiming their own pet
        if (lostPet.postedBy.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot claim your own lost pet'
            });
        }

        // Check for duplicate claims
        const existingClaim = await FoundClaim.findOne({
            lostPetPost: lostPetId,
            claimedBy: req.user._id,
            status: { $in: ['pending', 'approved'] }
        });

        if (existingClaim) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a claim for this pet'
            });
        }

        // Build verification question answers (if required by owner)
        const verificationAnswers = [];
        if (lostPet.verificationQuestions && lostPet.verificationQuestions.length > 0) {
            lostPet.verificationQuestions.forEach((vq, index) => {
                const userAnswer = req.body[`answer_${index}`];
                verificationAnswers.push({
                    question: vq.question,
                    answer: userAnswer || ''
                });
            });
        }

        // Create found claim
        const foundClaimData = {
            lostPetPost: lostPetId,
            claimedBy: req.user._id,
            claimerName: req.body.claimerName || req.user.fullName,
            claimerPhone: req.body.claimerPhone,
            claimerEmail: req.body.claimerEmail || req.user.email,
            foundLocation: {
                address: req.body.foundAddress,
                city: req.body.foundCity,
                state: req.body.foundState,
                coordinates: {
                    latitude: parseFloat(req.body.foundLatitude) || null,
                    longitude: parseFloat(req.body.foundLongitude) || null
                }
            },
            foundDate: req.body.foundDate,
            description: req.body.description,
            images: req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            })),
            verificationQuestions: verificationAnswers
        };

        const newClaim = await FoundClaim.create(foundClaimData);

        // Update lost pet with claim reference and increment pending count
        lostPet.foundClaims.push(newClaim._id);
        lostPet.pendingClaimsCount = (lostPet.pendingClaimsCount || 0) + 1;
        await lostPet.save();

        res.status(201).json({
            success: true,
            message: 'Your claim has been submitted. The owner will review it and contact you if verified.',
            data: newClaim
        });
    } catch (err) {
        console.error('Submit found claim error:', err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get all claims for a lost pet (owner only)
exports.getClaimsForLostPet = async (req, res) => {
    try {
        const { lostPetId } = req.params;

        const lostPet = await LostPet.findById(lostPetId);
        
        if (!lostPet) {
            return res.status(404).json({
                success: false,
                message: 'Lost pet post not found'
            });
        }

        // Only owner can view claims
        if (lostPet.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view claims for this post'
            });
        }

        const claims = await FoundClaim.find({
            lostPetPost: lostPetId
        })
        .populate('claimedBy', 'fullName username')
        .sort({ createdAt: -1 })
        .lean();

        res.json({
            success: true,
            data: claims
        });
    } catch (err) {
        console.error('Get claims error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get claim image
exports.getClaimImage = async (req, res) => {
    try {
        const { claimId, index } = req.params;
        const imageIndex = parseInt(index);

        const claim = await FoundClaim.findById(claimId);
        
        if (!claim || !claim.images || !claim.images[imageIndex]) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }

        // Get the associated lost pet to check permissions
        const lostPet = await LostPet.findById(claim.lostPetPost);
        
        // Only owner can view claim images
        if (!req.user || lostPet.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this image'
            });
        }

        const image = claim.images[imageIndex];
        
        if (image.data && image.contentType) {
            res.set('Content-Type', image.contentType);
            return res.send(image.data);
        }
        
        res.status(404).json({
            success: false,
            error: 'Image data not available'
        });
    } catch (error) {
        console.error('Error fetching claim image:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch image'
        });
    }
};

// Review and approve/reject claim
exports.reviewClaim = async (req, res) => {
    try {
        const { claimId } = req.params;
        const { action, rejectionReason, ownerNotes } = req.body; // action: 'approve' or 'reject'

        const claim = await FoundClaim.findById(claimId);
        
        if (!claim) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        const lostPet = await LostPet.findById(claim.lostPetPost);
        
        // Only owner can review claims
        if (lostPet.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to review this claim'
            });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This claim has already been reviewed'
            });
        }

        // Verify answers if verification questions were set
        if (lostPet.verificationQuestions && lostPet.verificationQuestions.length > 0) {
            lostPet.verificationQuestions.forEach((vq, index) => {
                if (claim.verificationQuestions[index]) {
                    const claimAnswer = claim.verificationQuestions[index].answer.toLowerCase().trim();
                    const correctAnswer = vq.answer.toLowerCase().trim();
                    claim.verificationQuestions[index].isCorrect = claimAnswer === correctAnswer;
                }
            });
        }

        if (action === 'approve') {
            claim.status = 'approved';
            claim.ownerNotes = ownerNotes;
            
            // Update lost pet status
            lostPet.status = 'found';
            lostPet.pendingClaimsCount = Math.max(0, (lostPet.pendingClaimsCount || 0) - 1);
            
            // Reject all other pending claims for this pet
            await FoundClaim.updateMany(
                {
                    lostPetPost: lostPet._id,
                    _id: { $ne: claimId },
                    status: 'pending'
                },
                {
                    status: 'rejected',
                    rejectionReason: 'Pet was already claimed by another user'
                }
            );
            
            await lostPet.save();
            await claim.save();

            res.json({
                success: true,
                message: 'Claim approved. Contact information has been shared with the finder.',
                data: {
                    claim,
                    ownerContact: lostPet.contactInfo
                }
            });
        } else if (action === 'reject') {
            claim.status = 'rejected';
            claim.rejectionReason = rejectionReason || 'Verification failed';
            lostPet.pendingClaimsCount = Math.max(0, (lostPet.pendingClaimsCount || 0) - 1);
            
            await lostPet.save();
            await claim.save();

            res.json({
                success: true,
                message: 'Claim has been rejected',
                data: claim
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"'
            });
        }
    } catch (err) {
        console.error('Review claim error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get user's submitted claims
exports.getUserClaims = async (req, res) => {
    try {
        const claims = await FoundClaim.find({ claimedBy: req.user._id })
            .populate('lostPetPost', 'petName petType breed images')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: claims
        });
    } catch (err) {
        console.error('Get user claims error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Get approved contact info after claim approval
exports.getApprovedContact = async (req, res) => {
    try {
        const { claimId } = req.params;

        const claim = await FoundClaim.findById(claimId);
        
        if (!claim) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        // Only the claimer can view contact after approval
        if (claim.claimedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (claim.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'This claim has not been approved yet'
            });
        }

        const lostPet = await LostPet.findById(claim.lostPetPost);
        
        res.json({
            success: true,
            data: {
                contactInfo: lostPet.contactInfo,
                ownerNotes: claim.ownerNotes
            }
        });
    } catch (err) {
        console.error('Get approved contact error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};
