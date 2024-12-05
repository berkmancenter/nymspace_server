const { default: PQueue } = require('p-queue')
const logger = require('../../config/logger')
const sleep = require('../../utils/sleep')
const agenda = require('../../agenda')

const MAX_CONCURRENCY = 20

// initialize all agent to set up their timers as needed
async function initializeAgents() {
  const { default: Agent } = await import('../../models/user.model/agent.model/index.mjs')

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
