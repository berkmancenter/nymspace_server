const mongoose = require('mongoose')
const Follower = require('../../src/models/follower.model')
const { userOne } = require('./user.fixture')
const { threadThree } = require('./thread.fixture')

const threadFollow = {
  _id: new mongoose.Types.ObjectId(),
  user: userOne._id,
  thread: threadThree._id
}

const insertFollowers = async (followers) => {
  const ret = await Follower.insertMany(followers)
  return ret
}

module.exports = {
  threadFollow,
  insertFollowers
}
