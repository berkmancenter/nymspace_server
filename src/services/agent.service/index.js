const Agenda = require('agenda')
const { default: PQueue } = require('p-queue')
const config = require('../../config/config')
const logger = require('../../config/logger')
const { Agent } = require('../../models')
const sleep = require('../../utils/sleep')

const agenda = new Agenda({ db: { address: config.mongoose.url } })

const MAX_CONCURRENCY = 20

// initialize all agent to set up their timers as needed
const initializeAgents = async () => {
  // stop to clear locks
  await agenda.stop()
  const queue = new PQueue({ concurrency: MAX_CONCURRENCY })
  const cursor = await Agent.find().cursor()

  let count = 0
  // eslint-disable-next-line
  for (let agent = await cursor.next(); agent; agent = await cursor.next()) {
    // eslint-disable-next-line
    await queue.add(() => agent.initialize())
    count++
  }

  await sleep(1000)
  await queue.onEmpty()
  logger.info(`Agents initialized: ${count}`)
}

module.exports = {
  initializeAgents
}
