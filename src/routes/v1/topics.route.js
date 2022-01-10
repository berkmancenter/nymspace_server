const express = require('express');
const topicController = require('../../controllers/topic.controller');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const topicValidation = require('../../validations/topic.validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Topic
 *   description: Manage application Topics
 */

/**
 * @swagger
 * /topics:
 *   post:
 *     description: Create a topic
 *     tags: [Topic]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               votingAllowed:
 *                 type: boolean
 *               private:
 *                 type: boolean
 *               archivable:
 *                 type: boolean
 *               archiveEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Topic'
 *
 */
router.route('/').post(auth('createTopic'), validate(topicValidation.createTopic), topicController.createTopic);

/**
 * @swagger
 * /topics:
 *   put:
 *     description: Update a topic
 *     tags: [Topic]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Topic'
 *     responses:
 *       200:
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Topic'
 *
 */
 router.route('/').put(auth('updateTopic'), validate(topicValidation.updateTopic), topicController.updateTopic);

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
 *       private:
 *         type: boolean
 *       votingAllowed:
 *         type: boolean
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

/**
 * @swagger
 * /topics/{topicId}:
 *   delete:
 *     description: Delete a topic
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the topic to delete.
 *         schema:
 *           type: string
 *     tags: [Topic]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: ok
 *
 */
router.route('/:topicId').delete(auth('deleteTopic'),topicController.deleteTopic);

/**
 * @swagger
 * /topics/auth:
 *   post:
 *     description: Verify a private topic passcode
 *     tags: [Topic]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topicId:
 *                 type: string
 *               passcode:
 *                 type: string
 *     responses:
 *       200:
 *         description: ok
 *
 */
router.route('/auth').post(validate(topicValidation.authenticate), topicController.authenticate);

/**
 * @swagger
 * /topics/archive:
 *   post:
 *     description: Archive a topic, preventing it from being soft deleted
 *     tags: [Topic]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topicId:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: ok
 *
 */
router.route('/archive').post(validate(topicValidation.archiveTopic), topicController.archiveTopic);

router.route('/follow').post(auth('followTopic'), topicController.follow);

module.exports = router;
