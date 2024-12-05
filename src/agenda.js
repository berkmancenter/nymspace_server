const Agenda = require('agenda')
const config = require('./config/config')

const agenda = new Agenda({ db: { address: config.mongoose.url } })

module.exports = agenda
