const Agenda = require('agenda')
const config = require('./config/config')
const logger = require('./config/logger')

const agenda = new Agenda({ db: { address: config.mongoose.url } })

agenda.on('fail', (err, job) => {
  logger.error(`[AGENDA] Job ${job.attrs.name} failed:`, {
    error: err.message,
    jobData: job.attrs,
    pid: process.pid
  })
})

agenda.on('error', (error) => {
  logger.error('[AGENDA] Global error:', error)
})

module.exports = agenda
