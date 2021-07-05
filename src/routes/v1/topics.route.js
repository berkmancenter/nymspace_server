const express = require('express');
const topicController = require('../../controllers/topic.controller');

const router = express.Router();

router.route('/').post(topicController.createTopic);

module.exports = router;
