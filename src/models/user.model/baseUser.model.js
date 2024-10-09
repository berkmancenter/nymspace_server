const mongoose = require('mongoose')

// empty base schema to subclass off/discriminate on for agents
const baseUserSchema = mongoose.Schema({}, { timestamps: true })
const BaseUser = mongoose.model('BaseUser', baseUserSchema)

module.exports = BaseUser
