const express = require('express')
const validate = require('../../middlewares/validate')
const authValidation = require('../../validations/auth.validation')
const authController = require('../../controllers/auth.controller')
const auth = require('../../middlewares/auth')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication management
 */

/**
 * @swagger
 * /auth/newPseudonym:
 *   get:
 *     description: Returns a random pseudonym and token
 *     tags: [Auth]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: pseudonym and token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 pseudonym:
 *                   type: string
 */
router.route('/newPseudonym').get(authController.newPseudonym)

/**
 * @swagger
 * /auth/register:
 *   post:
 *     description: Register a new user
 *     tags: [Auth]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               token:
 *                 type: string
 *               pseudonym:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/User'
 */
router.post('/register', validate(authValidation.register), authController.register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     description: Login to the application
 *     tags: [Auth]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/User'
 */
router.post('/login', validate(authValidation.login), authController.login)
router.post('/logout', validate(authValidation.logout), authController.logout)
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens)
router.route('/ping').get(auth('ping'), authController.ping)

/**
 * @swagger
 * /auth/forgotPassword:
 *   post:
 *     description: Sends an email to a user, allowing them to change their password
 *     tags: [Auth]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       204:
 *         description: no content
 */
router.post('/forgotPassword', validate(authValidation.sendPasswordReset), authController.sendPasswordReset)

/**
 * @swagger
 * /auth/resetPassword:
 *   post:
 *     description: Resets a users password
 *     tags: [Auth]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       204:
 *         description: no content
 */
router.post('/resetPassword', validate(authValidation.resetPassword), authController.resetPassword)

module.exports = router
