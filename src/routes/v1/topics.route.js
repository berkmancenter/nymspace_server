const express = require('express');
const topicController = require('../../controllers/topic.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/').post(auth('createTopic'), topicController.createTopic);
router.route('/userTopics').get(auth('userTopics'), topicController.userTopics);

module.exports = router;
