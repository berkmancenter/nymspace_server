const express = require('express');
const threadsController = require('../../controllers/thread.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Thread
 *   description: Manage application Threads
 */

router.route('/').post(auth('createThread'), threadsController.createThread);

/**
 * @swagger
 * /threads:
 *   get:
 *     description: Returns all threads
 *     tags: [Thread]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Threads array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Thread'
 */
router.route('/').get(auth('publicThreads'), threadsController.allPublic);

/**
 * @swagger
 * /threads/userThreads:
 *   get:
 *     description: Returns all threads for a logged-in user
 *     tags: [Thread]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Threads array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Thread'
 */
router.route('/userThreads').get(auth('userThreads'), threadsController.userThreads);
router.route('/:threadId').get(auth('getThread'), threadsController.getThread);

/**
 * @swagger
 * /threads/topic/:topicId:
 *   get:
 *     description: Returns all threads for supplied topic
 *     tags: [Thread]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: Threads array
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 $ref: '#/components/schemas/Thread'
 */
router.route('/topic/:topicId').get(auth('topicThreads'), threadsController.getTopicThreads);
router.route('/follow').post(auth('followThread'), threadsController.follow);
router.route('/deleteThread/:threadId').delete(auth('deleteThread'), threadsController.deleteThread);

module.exports = router;
