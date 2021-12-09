const express = require('express');
const userController = require('../../controllers/user.controller');
const userValidation = require('../../validations/user.validation');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management
 */

router.post('/', validate(userValidation.createUser), userController.createUser);

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
router.route('/pseudonyms').post(auth('managePseudonym'), userController.addPseudonym);

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
router.route('/pseudonyms/activate').put(auth('managePseudonym'), userController.activatePseudonym);

module.exports = router;
