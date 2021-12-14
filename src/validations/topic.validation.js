const Joi = require('joi');

const createTopic = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    voting: Joi.boolean().required(),
    private: Joi.boolean().required(),
    archive: Joi.boolean().required(),
  }),
};

const authenticate = {
  body: Joi.object().keys({
    passcode: Joi.number().required(),
    topicId: Joi.string().required(),
  }),
};

module.exports = {
  authenticate,
  createTopic,
};
