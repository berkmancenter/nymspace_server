const mongoose = require('mongoose');
const faker = require('faker');
const Topic = require('../../src/models/topic.model');
const { userOne } = require('./user.fixture');

const nameSlug = faker.lorem.word().toLowerCase();

const topicOne = {
    _id: mongoose.Types.ObjectId(),
    name: nameSlug,
    slug: nameSlug,
    owner: userOne._id,
};

const insertTopics = async (topics) => {
  await Topic.insertMany(topics);
};

module.exports = {
  topicOne,
  insertTopics,
};