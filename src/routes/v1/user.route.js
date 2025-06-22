const express = require('express')
const userController = require('../../controllers/user.controller')
const userValidation = require('../../validations/user.validation')
const validate = require('../../middlewares/validate')
const { auth } = require('../../middlewares/auth')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     description: Retrieve a User
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the User
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/User'
 */
router.route('/user/:userId').get(auth('getUser'), userController.getUser)

// Removing this route, since user creation is handled by the auth register route
// router.post('/', validate(userValidation.createUser), userController.createUser);

/**
 * @swagger
 * /users:
 *   put:
 *     description: Update a user
 *     tags: [User]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 required: true
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
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
router.put('/', auth('manageAccount'), validate(userValidation.updateUser), userController.updateUser)

/**
 * @swagger
 * /pseudonyms:
 *   get:
 *     description: Returns a user's pseudonyms
 *     tags: [User]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Pseudonym array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Pseudonym'
 *
 */
router.route('/pseudonyms').get(auth('managePseudonym'), userController.getPseudonyms)

/**
 * @swagger
 * /users/pseudonyms:
 *   post:
 *     description: Add a pseudonym for user and set to active
 *     tags: [User]
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
 *               pseudonym:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pseudonym array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Pseudonym'
 */
router.route('/pseudonyms').post(auth('managePseudonym'), userController.addPseudonym)

/**
 * @swagger
 * /users/pseudonyms/activate:
 *   put:
 *     description: Set a pseudonym to active
 *     tags: [User]
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
 *     responses:
 *       201:
 *         description: Pseudonym array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Pseudonym'
 */
router.route('/pseudonyms/activate').put(auth('managePseudonym'), userController.activatePseudonym)

/**
 * @swagger
 * /pseudonyms:
 *   get:
 *     description: Returns a user's pseudonyms
 *     tags: [User]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Pseudonym array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/User'
 *
 */
router.route('/pseudonyms/:pseudonymId').delete(auth('managePseudonym'), userController.deletePseudonym)

/**
 * @swagger
 * /users/{userId}/preferences/export:
 *   put:
 *     description: Update user's data export opt-out preference
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optOut:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated preference
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dataExportOptOut:
 *                   type: boolean
 */
router.route('/user/:userId/preferences/export').put(auth('manageAccount'), userController.updateDataExportPreference)

/**
 * @swagger
 * /users/{userId}/preferences/export:
 *   get:
 *     description: Get user's data export opt-out preference
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Current preference
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dataExportOptOut:
 *                   type: boolean
 */
router.route('/user/:userId/preferences/export').get(auth('manageAccount'), userController.getDataExportPreference)

/**
 * @swagger
 * /users/{userId}/exports:
 *   get:
 *     description: Get export audit log for user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Export audit log
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 audits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       threadName:
 *                         type: string
 *                       exporterUsername:
 *                         type: string
 *                       format:
 *                         type: string
 *                       exportDate:
 *                         type: string
 *                       messageCount:
 *                         type: number
 */
router.route('/user/:userId/exports').get(auth('manageAccount'), userController.getExportAuditLog)

module.exports = router
