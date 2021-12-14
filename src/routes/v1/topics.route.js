const express = require('express');
const topicController = require('../../controllers/topic.controller');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const topicValidation = require('../../validations/topic.validation');

const router = express.Router();

router.route('/').post(auth('createTopic'), validate(topicValidation.createTopic), topicController.createTopic);

/**
 * @swagger
 * tags:
 *   name: Topic
 *   description: Manage application Topics
 */

/**
 * @swagger
 * definitions:
 *   Topic:
 *     properties:
 *       name:
 *         type: string
 *       slug:
 *         type: string
 *       id:
 *         type: string
 *       latestMessageCreatedAt:
 *         type: string
 *       messageCount:
 *         type: number
 *       threadCount:
 *         type: number
 *       follows:
 *         type: number
 *       defaultSortAverage:
 *         type: number
 */

/**
 * @swagger
 * /topics/userTopics:
 *   get:
 *     description: Returns all topics for current user
 *     tags: [Topic]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: topic array
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/Topic'
 *                      
 */
router.route('/userTopics').get(auth('userTopics'), topicController.userTopics);

/**
 * @swagger
 * /topics:
 *   get:
 *     description: Returns top 10 topics (without authentication)
 *     tags: [Topic]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: topic array
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/Topic'
 *                      
 */
router.route('/public/:token').get(topicController.publicTopics);

/**
 * @swagger
 * /topics:
 *   get:
 *     description: Returns all topics
 *     tags: [Topic]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: topic array
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/definitions/Topic'
 *                      
 */
router.route('/').get(auth('allTopics'), topicController.allTopics);
router.route('/:topicId').get(topicController.getTopic);

router.route('/auth').post(validate(topicValidation.authenticate), topicController.authenticate);

module.exports = router;
