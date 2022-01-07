const mongoose = require('mongoose');
const faker = require('faker');
const Thread = require('../../src/models/thread.model');
const { userOne, userTwo } = require('./user.fixture');
const { newPublicTopic, newPrivateTopic } = require('./topic.fixture');

const publicTopic = newPublicTopic();
const privateTopic = newPrivateTopic();

const nameSlug1 = faker.lorem.word().toLowerCase();
const nameSlug2 = faker.lorem.word().toLowerCase();
const nameSlug3 = faker.lorem.word().toLowerCase();

const threadOne = {
  _id: mongoose.Types.ObjectId(),
  name: nameSlug1,
  slug: nameSlug1,
  owner: userOne._id,
  topic: publicTopic._id,
};

const threadTwo = {
  _id: mongoose.Types.ObjectId(),
  name: nameSlug2,
  slug: nameSlug2,
  owner: userOne._id,
  topic: privateTopic._id,
};

const threadThree = {
  _id: mongoose.Types.ObjectId(),
  name: nameSlug3,
  slug: nameSlug3,
  owner: userTwo._id,
  topic: privateTopic._id,
};

const insertThreads = async (threads) => {
  await Thread.insertMany(threads);
};

module.exports = {
  threadOne,
  threadTwo,
  threadThree,
  insertThreads,
  publicTopic,
  privateTopic,
};
