const mongoose = require('mongoose')
const config = require('../../src/config/config')
const agenda = require('../../src/agenda')
const { initializeAgents } = require('../../src/services/agent.service')

const setupIntTest = () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options)
    initializeAgents()
  })

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()))
  })

  afterAll(async () => {
    await agenda.stop()
    await agenda.close()
    await mongoose.disconnect()
  })
}

module.exports = setupIntTest
