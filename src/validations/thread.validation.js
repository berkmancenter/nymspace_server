const Joi = require('joi');

const updateThread = {
  body: Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string(),
    locked: Joi.boolean(),
  }),
};

module.exports = {
  updateThread,
};
