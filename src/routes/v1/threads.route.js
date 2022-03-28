const express = require('express');
const threadsController = require('../../controllers/thread.controller');
const auth = require('../../middlewares/auth');
const threadValidation = require('../../validations/thread.validation');

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
 * /threads/topic/{topicId}:
 *   get:
 *     description: Returns all threads for supplied topic
 *     tags: [Thread]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the parent topic.
 *         schema:
 *           type: string
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

/**
 * @swagger
 * /threads:
 *   put:
 *     description: Update a thread
 *     tags: [Thread]
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Thread'
 *     responses:
 *       200:
 *         description: ok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Thread'
 *
 */
router.route('/').put(auth('updateThread'), validate(threadValidation.updateThread), threadsController.updateThread);

/**
 * @swagger
 * /thread/{threadId}:
 *   delete:
 *     description: Delete a thread
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the thread to delete.
 *         schema:
 *           type: string
 *     tags: [Thread]
 *     produces:
 *      - application/json
 *     responses:
 *       200:
 *         description: ok
 *
 */
router.route('/:threadId').delete(auth('deleteThread'), threadsController.deleteThread);

module.exports = router;
