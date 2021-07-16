const express = require('express');
const topicController = require('../../controllers/topic.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/').post(auth('createTopic'), topicController.createTopic);
router.route('/userTopics').get(auth('userTopics'), topicController.userTopics);
router.route('/').get(auth('publicTopics'), topicController.allPublic);
router.route('/:topicId').get(topicController.getTopic);

module.exports = router;
