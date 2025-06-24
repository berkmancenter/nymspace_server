const Joi = require('joi')

const createMessage = {
  body: Joi.object().keys({
    body: Joi.string().required(),
    thread: Joi.string().required(),
    parentMessage: Joi.string().optional()
  })
}

module.exports = {
  createMessage
}
