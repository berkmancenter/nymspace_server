const express = require('express');
const messageController = require('../../controllers/message.controller');

const router = express.Router();

router.route('/').post(messageController.createMessage);

module.exports = router;
