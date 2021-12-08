const mongoose = require('mongoose');
const faker = require('faker');
const Thread = require('../../src/models/thread.model');
const { userOne } = require('./user.fixture');
const { topicOne } = require('./topic.fixture');


const nameSlug = faker.lorem.word().toLowerCase();

const threadOne = {
    _id: mongoose.Types.ObjectId(),
    name: nameSlug,
    slug: nameSlug,
    owner: userOne._id,
    topic: topicOne._id,
};

const insertThreads = async (threads) => {
  await Thread.insertMany(threads);
};

module.exports = {
  threadOne,
  insertThreads,
};