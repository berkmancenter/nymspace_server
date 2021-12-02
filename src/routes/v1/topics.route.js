const express = require('express');
const topicController = require('../../controllers/topic.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/').post(auth('createTopic'), topicController.createTopic);

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
 *     description: Returns all public topics
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
router.route('/').get(auth('publicTopics'), topicController.allPublic);
router.route('/:topicId').get(topicController.getTopic);

module.exports = router;
