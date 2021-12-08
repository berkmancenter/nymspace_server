const mongoose = require('mongoose');
const faker = require('faker');
const Message = require('../../src/models/message.model');
const { userOne } = require('./user.fixture');
const { threadOne } = require('./thread.fixture');

const messageOne = {
    _id: mongoose.Types.ObjectId(),
    body: faker.lorem.words(10),
    thread: mongoose.Types.ObjectId(),
    owner: userOne._id,
};

const messageTwo = {
    body: faker.lorem.words(10),
    thread: threadOne._id,
};

const insertMessages = async (msgs) => {
  await Message.insertMany(msgs);
};

module.exports = {
  messageOne,
  messageTwo,
  insertMessages,
};
