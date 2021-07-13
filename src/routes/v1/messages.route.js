const express = require('express');
const messageController = require('../../controllers/message.controller');
const messageValidation = require('../../validations/message.validation');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/', auth('createMessage'), validate(messageValidation.createMessage), messageController.createMessage);
router.route('/:threadId').get(messageController.threadMessages);

module.exports = router;
