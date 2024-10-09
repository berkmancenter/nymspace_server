const express = require('express')
const auth = require('../../../middlewares/auth')
const pollsController = require('../../../controllers/poll.controller')
// const pollValidation = require('../../validations/poll.validation')
// const validate = require('../../middlewares/validate')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Poll
 *   description: Manage application Polls
 */

// TODO Swagger details needs to be updated
// TODO Add in validations

/**
 * @swagger
 * /polls:
 *   put:
 *     description: Create a poll
 *     tags: [Poll]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Poll'
 *     responses:
 *       200:
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Poll'
 *
 */
router.route('/').post(auth('createPoll'), pollsController.createPoll)

/**
 * @swagger
 * /polls:
 *   put:
 *     description: Vote on a poll
 *     tags: [Poll]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Poll'
 *     responses:
 *       200:
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Poll'
 *
 */
router.route('/').post(auth('votePoll'), pollsController.votePoll)

/**
 * @swagger
 * /polls:
 *   get:
 *     description: Returns all polls
 *     tags: [Poll]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Polls array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Poll'
 */
router.route('/').get(auth('listPolls'), pollsController.listPolls)

/**
 * @swagger
 * /polls/{pollId}:
 *   get:
 *     description: Returns all polls
 *     tags: [Poll]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Polls array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Poll'
 */
router.route('/:pollId').get(auth('inspectPoll'), pollsController.inspectPoll)

/**
 * @swagger
 * /polls/{pollId}/responses:
 *   get:
 *     description: Returns all polls
 *     tags: [Poll]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Polls array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Poll'
 */
router.route('/:pollId/responss').get(auth('getPollResponses'), pollsController.getPollResponses)

module.exports = router
