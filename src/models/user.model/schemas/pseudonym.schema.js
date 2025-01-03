const mongoose = require('mongoose')

const pseudonymSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  pseudonym: {
    type: String,
    required: true,
    index: true
  },
  active: {
    type: Boolean,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  threads: {
    type: [String],
    default: []
  }
})

module.exports = pseudonymSchema
