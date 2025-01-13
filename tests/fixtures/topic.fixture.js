const mongoose = require('mongoose')
const faker = require('faker')
const Topic = require('../../src/models/topic.model')
const { userOne } = require('./user.fixture')

const nameSlug = faker.lorem.word().toLowerCase()
const getRandomInt = (origMin, origMax) => {
  const min = Math.ceil(origMin)
  const max = Math.floor(origMax)
  return Math.floor(Math.random() * (max - min) + min)
}

const topicPost = {
  name: nameSlug,
  votingAllowed: true,
  threadCreationAllowed: true,
  private: false,
  archivable: true,
  archiveEmail: faker.internet.email()
}

const newPublicTopic = () => {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: nameSlug,
    slug: nameSlug,
    votingAllowed: true,
    threadCreationAllowed: true,
    private: false,
    archivable: true,
    archived: false,
    owner: userOne._id,
    isDeleted: false,
    isArchiveNotified: false,
    threads: []
  }
}

const newPrivateTopic = () => {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: nameSlug,
    slug: nameSlug,
    votingAllowed: false,
    threadCreationAllowed: false,
    private: true,
    passcode: getRandomInt(1000000, 9999999),
    archivable: true,
    archived: false,
    owner: userOne._id,
    isDeleted: false,
    isArchiveNotified: false,
    threads: []
  }
}

const insertTopics = async (topics) => {
  await Topic.insertMany(topics)
}

module.exports = {
  newPublicTopic,
  newPrivateTopic,
  topicPost,
  insertTopics,
  getRandomInt
}
