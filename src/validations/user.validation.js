const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    username: Joi.string(),
    password: Joi.string().custom(password),
    pseudonym: Joi.string().required(),
    token: Joi.string().required(),
  }),
};

const updateUser = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    username: Joi.string(),
    password: Joi.string().custom(password),
    email: Joi.string(),
  }),
};

const addPseudonym = {
  body: Joi.object().keys({
    pseudonym: Joi.string().required(),
    token: Joi.string().required(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUser,
  updateUser,
  getUsers,
  getUser,
  deleteUser,
  addPseudonym,
};
