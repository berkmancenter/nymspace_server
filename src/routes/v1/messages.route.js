const express = require('express')
const messageController = require('../../controllers/message.controller')
const messageValidation = require('../../validations/message.validation')
const validate = require('../../middlewares/validate')
const { auth, optionalAuth } = require('../../middlewares/auth')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Message
 *   description: Manage application Messages
 */

router.post('/', auth('createMessage'), validate(messageValidation.createMessage), messageController.createMessage)

/**
 * @swagger
 * /messages:
 *   get:
 *     description: Returns all thread messages
 *     tags: [Message]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Message array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Message'
 */
router.route('/:threadId').get(optionalAuth, messageController.threadMessages)

/**
 * @swagger
 * /messages/{messageId}/replies:
 *   get:
 *     description: Returns all replies to a message
 *     tags: [Message]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         description: Id of message to get replies for
 *         schema:
 *           type: string
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Reply message array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Message'
 */
router.route('/:messageId/replies').get(optionalAuth, messageController.messageReplies)

/**
 * @swagger
 * /messages/{messageId}/vote:
 *   post:
 *     description: Vote on a message
 *     tags: [Message]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         description: Id of message to apply vote to.
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
 *               status:
 *                 type: boolean
 *               direction:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Message'
 *
 */
router.route('/:messageId/vote').post(auth('vote'), messageController.vote)

module.exports = router
