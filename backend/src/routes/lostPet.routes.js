const express = require('express');
const router = express.Router();
const multer = require('multer');
const lostPetController = require('../controllers/lostPet.controller');
const foundClaimController = require('../controllers/foundClaim.controller');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Configure multer for claim images (up to 3 images)
const claimUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 3
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
    }
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId && req.user) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required',
        redirectPath: '/login'
    });
}

// Public routes
/**
 * @swagger
 * /api/lost-pets:
 *   get:
 *     tags: [LostPets]
 *     summary: Get all lost pet reports (public)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [lost, found, reunited]
 *         description: Filter by status
 *       - in: query
 *         name: petType
 *         schema:
 *           type: string
 *         description: Filter by pet type (dog, cat, etc.)
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: Array of lost pet listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', lostPetController.getAllLostPets);

/**
 * @swagger
 * /api/lost-pets/{id}:
 *   get:
 *     tags: [LostPets]
 *     summary: Get a single lost pet report by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lost pet report ObjectId
 *     responses:
 *       200:
 *         description: Lost pet report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lost pet report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:id', lostPetController.getLostPetById);

/**
 * @swagger
 * /api/lost-pets/image/{id}/{index}:
 *   get:
 *     tags: [LostPets]
 *     summary: Serve a lost pet report image binary by report ID and index
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lost pet report ObjectId
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Zero-based image index
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/image/:id/:index', lostPetController.getLostPetImage);

// Protected routes - Lost Pet Management
/**
 * @swagger
 * /api/lost-pets/create:
 *   post:
 *     tags: [LostPets]
 *     summary: Create a new lost pet report (requires authentication, up to 5 images)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [petName, petType, lastSeenLocation, contactPhone]
 *             properties:
 *               petName:
 *                 type: string
 *               petType:
 *                 type: string
 *                 example: dog
 *               breed:
 *                 type: string
 *               color:
 *                 type: string
 *               lastSeenLocation:
 *                 type: string
 *               lastSeenDate:
 *                 type: string
 *                 format: date
 *               contactPhone:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 images (max 5 MB each)
 *     responses:
 *       201:
 *         description: Lost pet report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/create', isAuthenticated, upload.array('images', 5), lostPetController.createLostPet);

/**
 * @swagger
 * /api/lost-pets/user/my-posts:
 *   get:
 *     tags: [LostPets]
 *     summary: Get all lost pet reports created by the logged-in user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's lost pet reports
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/user/my-posts', isAuthenticated, lostPetController.getUserLostPets);

/**
 * @swagger
 * /api/lost-pets/{id}:
 *   put:
 *     tags: [LostPets]
 *     summary: Update a lost pet report (owner only, up to 5 images)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               petName:
 *                 type: string
 *               description:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Not the owner of this report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put('/:id', isAuthenticated, upload.array('images', 5), lostPetController.updateLostPet);

/**
 * @swagger
 * /api/lost-pets/{id}/status:
 *   patch:
 *     tags: [LostPets]
 *     summary: Update the status of a lost pet report (lost / found / reunited)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [lost, found, reunited]
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Not the owner of this report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch('/:id/status', isAuthenticated, lostPetController.updateStatus);

/**
 * @swagger
 * /api/lost-pets/{id}/comment:
 *   post:
 *     tags: [LostPets]
 *     summary: Add a public comment to a lost pet report
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/:id/comment', isAuthenticated, lostPetController.addComment);

/**
 * @swagger
 * /api/lost-pets/{id}:
 *   delete:
 *     tags: [LostPets]
 *     summary: Delete a lost pet report (owner only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Not the owner of this report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete('/:id', isAuthenticated, lostPetController.deleteLostPet);

// Protected routes - Found Claims
/**
 * @swagger
 * /api/lost-pets/{lostPetId}/claim:
 *   post:
 *     tags: [LostPets]
 *     summary: Submit a "found" claim for a lost pet report (up to 3 supporting images)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lostPetId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [description, contactPhone]
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description of where/how the pet was found
 *               contactPhone:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 3 proof images (max 5 MB each)
 *     responses:
 *       201:
 *         description: Claim submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lost pet report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/:lostPetId/claim', isAuthenticated, claimUpload.array('images', 3), foundClaimController.submitFoundClaim);

/**
 * @swagger
 * /api/lost-pets/{lostPetId}/claims:
 *   get:
 *     tags: [LostPets]
 *     summary: Get all found claims for a specific lost pet report (visible to the reporter)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: lostPetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of claims
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Only the reporter can view claims
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:lostPetId/claims', isAuthenticated, foundClaimController.getClaimsForLostPet);

/**
 * @swagger
 * /api/lost-pets/claims/{claimId}/review:
 *   post:
 *     tags: [LostPets]
 *     summary: Approve or reject a found claim (only the pet reporter can review)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: Claim reviewed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Only the reporter can review claims
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/claims/:claimId/review', isAuthenticated, foundClaimController.reviewClaim);

/**
 * @swagger
 * /api/lost-pets/claims/{claimId}/contact:
 *   get:
 *     tags: [LostPets]
 *     summary: Get contact details of an approved found claim (only visible after approval)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact details of finder
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       403:
 *         description: Claim not approved or not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/claims/:claimId/contact', isAuthenticated, foundClaimController.getApprovedContact);

/**
 * @swagger
 * /api/lost-pets/claims/image/{claimId}/{index}:
 *   get:
 *     tags: [LostPets]
 *     summary: Serve a found-claim proof image binary
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Raw image binary
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Claim or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/claims/image/:claimId/:index', isAuthenticated, foundClaimController.getClaimImage);

/**
 * @swagger
 * /api/lost-pets/user/my-claims:
 *   get:
 *     tags: [LostPets]
 *     summary: Get all found claims submitted by the logged-in user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's claims
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/user/my-claims', isAuthenticated, foundClaimController.getUserClaims);

module.exports = router;
