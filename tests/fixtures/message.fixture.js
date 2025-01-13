const mongoose = require('mongoose')
const faker = require('faker')
const Message = require('../../src/models/message.model')
const { registeredUser } = require('./user.fixture')
const { threadOne, threadTwo, threadThree } = require('./thread.fixture')

const messageOne = {
  _id: new mongoose.Types.ObjectId(),
  body: faker.lorem.words(10),
  thread: threadOne._id,
  owner: registeredUser._id,
  pseudonymId: registeredUser.pseudonyms[0]._id,
  pseudonym: registeredUser.pseudonyms[0].pseudonym
}

const messageTwo = {
  _id: new mongoose.Types.ObjectId(),
  body: faker.lorem.words(10),
  thread: threadTwo._id,
  owner: registeredUser._id,
  pseudonymId: registeredUser.pseudonyms[0]._id,
  pseudonym: registeredUser.pseudonyms[0].pseudonym
}

const messageThree = {
  _id: new mongoose.Types.ObjectId(),
  body: faker.lorem.words(10),
  thread: threadTwo._id,
  owner: registeredUser._id,
  pseudonymId: registeredUser.pseudonyms[0]._id,
  pseudonym: registeredUser.pseudonyms[0].pseudonym
}

const messageFour = {
  _id: mongoose.Types.ObjectId(),
  body: faker.lorem.words(10),
  thread: threadThree._id,
  owner: registeredUser._id,
  pseudonymId: registeredUser.pseudonyms[0]._id,
  pseudonym: registeredUser.pseudonyms[0].pseudonym
}

const invisibleMessage = {
  _id: mongoose.Types.ObjectId(),
  body: faker.lorem.words(10),
  thread: threadThree._id,
  owner: registeredUser._id,
  pseudonymId: registeredUser.pseudonyms[0]._id,
  pseudonym: registeredUser.pseudonyms[0].pseudonym,
  visible: false
}

const messagePost = {
  body: faker.lorem.words(10),
  thread: threadOne._id
}

const insertMessages = async (msgs) => {
  await Message.insertMany(msgs)
}

module.exports = {
  messageOne,
  messageTwo,
  messageThree,
  messageFour,
  invisibleMessage,
  messagePost,
  insertMessages
}
