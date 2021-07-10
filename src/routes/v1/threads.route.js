const express = require('express');
const threadsController = require('../../controllers/thread.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/').post(auth('createThread'), threadsController.createThread);

module.exports = router;
