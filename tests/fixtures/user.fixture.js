const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');
const User = require('../../src/models/user.model');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  _id: mongoose.Types.ObjectId(),
  username: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
  isEmailVerified: false,
};

const userTwo = {
  _id: mongoose.Types.ObjectId(),
  username: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
  isEmailVerified: false,
};

const registeredUser = {
  _id: mongoose.Types.ObjectId(),
  username: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
  isEmailVerified: false,
  pseudonyms: [
    {
      _id: mongoose.Types.ObjectId(),
      token:
        '31c5d2b7d2b0f86b2b4b204ed4bf17938e4108a573b25db493a55c4639cc6cd3518a4c88787fe29cf9f273d61e3c5fd4eabb528e3e9b7398c1ed0944581ce51e53f6eae13328c4be05e7e14365063409',
      pseudonym: 'Boring Badger',
      active: 'true',
    },
  ],
};

const admin = {
  _id: mongoose.Types.ObjectId(),
  name: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
  isEmailVerified: false,
};

const insertUsers = async (users) => {
  const ret = await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
  return ret;
};

module.exports = {
  userOne,
  userTwo,
  registeredUser,
  admin,
  insertUsers,
};
