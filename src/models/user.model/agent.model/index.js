const Agenda = require('agenda')
const mongoose = require('mongoose')
const { toJSON, paginate } = require('../../plugins')
const BaseUser = require('../baseUser.model')
const { Message } = require('../..')
const pseudonymSchema = require('../schemas/pseudonym.schema')
const agentTypes = require('./agentTypes')
const config = require('../../../config/config')
const logger = require('../../../config/logger')
const { AgentMessageActions } = require('../../../types/agent.types')

const agenda = new Agenda({ db: { address: config.mongoose.url } })

const FAKE_AGENT_TOKEN = 'FAKE_AGENT_TOKEN'
const REQUIRED_AGENT_EVALUATION_PROPS = [
  'userMessage',
  'action',
  'agentContributionVisible',
  'userContributionVisible',
  'suggestion',
  'contribution'
]

const agentSchema = mongoose.Schema(
  {
    agentType: {
      type: String,
      trim: true,
      required: true,
      immutable: true
    },
    // agents have 1 and only one pseudonym
    pseudonyms: {
      type: [pseudonymSchema],
      required: true,
      immutable: true,
      min: 1,
      max: 1
    },
    thread: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Thread',
      required: true,
      private: false,
      index: true
    },
    lastActiveMessageCount: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    strict: true,
    timestamps: true,
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  }
)

// indexes
agentSchema.index({ name: 1 })

// add plugin that converts mongoose to json
agentSchema.plugin(toJSON)
agentSchema.plugin(paginate)

// virtuals
agentSchema.virtual('name').get(function () {
  return agentTypes[this.agentType].name
})

agentSchema.virtual('description').get(function () {
  return agentTypes[this.agentType].description
})

agentSchema.virtual('tokenLimit').get(function () {
  return agentTypes[this.agentType].tokenLimit
})

agentSchema.virtual('minNewMessages').get(function () {
  return agentTypes[this.agentType].minNewMessages
})

agentSchema.virtual('timerPeriod').get(function () {
  return agentTypes[this.agentType].timerPeriod
})

agentSchema.virtual('useNumLastMessages').get(function () {
  return agentTypes[this.agentType].useNumLastMessages
})

agentSchema.virtual('agendaJobName').get(function () {
  return `agent${this._id}`
})

// other helpers

function validAgentEvaluation(agentEvaluation) {
  for (const prop of REQUIRED_AGENT_EVALUATION_PROPS) {
    if (!Object.hasOwn(agentEvaluation, prop)) throw new Error(`Agent evaluation missing required property ${prop}`)
  }

  return agentEvaluation
}

// methods

agentSchema.method('initialize', async function () {
  if (!this._id) throw new Error('Cannot invoke initializeTimer without an _id')

  if (!this.populated('thread')) await this.populate('thread').execPopulate()

  if (!this.thread) {
    logger.warn(`No thread found for agent ${this._id}. Deleting this agent as outdated`)
    await mongoose.model('Agent').deleteOne({ _id: this._id })
    return
  }

  const agentType = agentTypes[this.agentType]

  if (!agentType) throw new Error(`No such agentType: ${this.agentType} for agent ${this._id}`)

  // see if this agent type has specific other initialization required
  await agentType.initialize.call(this)

  // also set up timers if needed
  if (agentType.timerPeriod === undefined) {
    logger.info(`No timer to set for ${this.agentType} ${this._id}`)
    return
  }

  await agenda.start()
  agenda.define(this.agendaJobName, async function (job) {
    const { agentId } = job.attrs.data
    logger.info(`Agenda activation ${agentId}`)
    const agent = await mongoose.model('Agent').findOne({ _id: agentId }).populate('thread').exec()

    if (!agent) {
      logger.warn(`Could not find agent ${agentId}`)
      return
    }
    await agent.thread.populate('messages').execPopulate()
    await agent.evaluate()
    await agent.respond()
  })

  await agenda.every(this.timerPeriod, this.agendaJobName, { agentId: this._id })
  logger.info(`Set timer for ${this.agentType} ${this._id} ${this.agendaJobName} ${this.timerPeriod}`)
})

agentSchema.method('isWithinTokenLimit', async function (promptText) {
  await agentTypes[this.agentType].isWithinTokenLimit.call(this, promptText)
})

agentSchema.method('resetTimer', async function () {
  await agenda.cancel({ name: this.agendaJobName })
  await agenda.every(this.timerPeriod, this.agendaJobName, { agentId: this._id })
})

// this method is the same for periodic invocation or for evaluating a new message from a user
// userMessage is optional current user message BEFORE it is added to the thread for evaluation
// it should always set this.agentEvaluation in all conditions
agentSchema.method('evaluate', async function (userMessage = null) {
  if (!this.populated('thread')) throw new Error(`Thread must be populated for agent ${this._id}`)
  if (!this.thread) throw new Error(`Missing thread for agent ${this._id}`)

  const humanMsgCount = this.thread.messages.reduce((count, msg) => count + (msg.fromAgent ? 0 : 1), 0)
  const messageCount = humanMsgCount + (userMessage ? 1 : 0)

  // do not process if no new messages
  if (messageCount === this.lastActiveMessageCount) {
    logger.info(`No new messages to respond to ${this.agentType} ${this._id}`)
    this.agentEvaluation = { action: AgentMessageActions.OK, userContributionVisible: true }
    return this.agentEvaluation
  }

  if (this.minNewMessages && messageCount - this.lastActiveMessageCount < this.minNewMessages) {
    logger.info('Not enough new messages for activation')
    this.agentEvaluation = { action: AgentMessageActions.OK, userContributionVisible: true }
    return this.agentEvaluation
  }

  this.userMessage = userMessage

  const agentEvaluation = validAgentEvaluation(await agentTypes[this.agentType].evaluate.call(this))
  // Only reset timer if processing in response to a new message, otherwise let it continue periodic checking
  // do after LLM processing, since it may take some time
  if (userMessage && this.timerPeriod) await this.resetTimer()

  // update last activation message count
  if (agentEvaluation.action !== AgentMessageActions.REJECT) {
    this.lastActiveMessageCount = messageCount
    await this.save()
  }

  this.agentEvaluation = agentEvaluation
  return agentEvaluation
})

agentSchema.method('respond', async function () {
  if (!this.agentEvaluation) throw new Error('Cannot respond without an agent evaluation being performed first')
  const { agentEvaluation } = this

  if (agentEvaluation.action === AgentMessageActions.CONTRIBUTE) {
    const agentMessage = new Message({
      fromAgent: true,
      visible: agentEvaluation.agentContributionVisible,
      body: agentEvaluation.contribution,
      thread: this.thread._id,
      pseudonym: this.name,
      pseudonymId: this.pseudonyms[0]._id,
      owner: this._id
    })

    agentMessage.save()
    this.thread.messages.push(agentMessage.toObject())
    await this.thread.save()

    return agentMessage
  }
})

// middleware
agentSchema.pre('validate', function () {
  if (!agentTypes[this.agentType]) throw new Error(`Unknown agent type ${this.agentType}`)

  // ensure 1 and only 1 pseudonym
  if (!this.pseudonyms.length) {
    this.pseudonyms.push({
      token: FAKE_AGENT_TOKEN,
      pseudonym: this.name,
      active: true,
      isDeleted: false
    })
    logger.info('Created default agent pseudonym')
  }

  if (this.pseudonyms.length > 1) {
    this.pseudonyms = this.pseudonyms.slice(0, 1)
  }
})

/**
 * @typedef Agent
 */
const Agent = BaseUser.discriminator('Agent', agentSchema)

module.exports = Agent
