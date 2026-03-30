const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get the current user's wishlist (pets and products)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wishlist data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     pets:
 *                       type: array
 *                       items:
 *                         type: object
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', wishlistController.getWishlist);

/**
 * @swagger
 * /api/wishlist/pet/{petId}/toggle:
 *   post:
 *     tags: [Wishlist]
 *     summary: Toggle a pet in/out of the user's wishlist
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the pet
 *     responses:
 *       200:
 *         description: Wishlist toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isWishlisted:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Pet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/pet/:petId/toggle', wishlistController.togglePetWishlist);

/**
 * @swagger
 * /api/wishlist/product/{productId}/toggle:
 *   post:
 *     tags: [Wishlist]
 *     summary: Toggle a product in/out of the user's wishlist
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product
 *     responses:
 *       200:
 *         description: Wishlist toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isWishlisted:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/product/:productId/toggle', wishlistController.toggleProductWishlist);

/**
 * @swagger
 * /api/wishlist/status/{type}/{id}:
 *   get:
 *     tags: [Wishlist]
 *     summary: Check if a specific item is in the user's wishlist
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pet, product]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the item
 *     responses:
 *       200:
 *         description: Wishlist status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isWishlisted:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/status/:type/:id', wishlistController.getWishlistStatus);

module.exports = router;