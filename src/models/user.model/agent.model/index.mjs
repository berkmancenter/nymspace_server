// NOTE! Our agent model is in ESM to support using esm module imports that we need
import mongoose from 'mongoose'
import socketIO from '../../../websockets/socketIO.js'
import { toJSON, paginate } from '../../plugins/index.js'
import BaseUser from '../baseUser.model.js'
import Message from '../../message.model.js'
import pseudonymSchema from '../schemas/pseudonym.schema.js'
import agentTypes from './agentTypes/index.mjs'
import logger from '../../../config/logger.js'
import agenda from '../../../agenda.js'
import { AgentMessageActions } from '../../../types/agent.types.js'

const FAKE_AGENT_TOKEN = 'FAKE_AGENT_TOKEN'
const REQUIRED_AGENT_EVALUATION_PROPS = ['userMessage', 'action', 'userContributionVisible', 'suggestion']
const REQUIRED_AGENT_RESPONSE_PROPS = ['visible', 'message']

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

agentSchema.virtual('priority').get(function () {
  return agentTypes[this.agentType].priority
})

// other helpers

function validAgentEvaluation(agentEvaluation) {
  for (const prop of REQUIRED_AGENT_EVALUATION_PROPS) {
    if (!Object.hasOwn(agentEvaluation, prop)) throw new Error(`Agent evaluation missing required property ${prop}`)
  }

  return agentEvaluation
}

function validAgentResponse(agentResponse) {
  for (const prop of REQUIRED_AGENT_RESPONSE_PROPS) {
    if (!Object.hasOwn(agentResponse, prop)) throw new Error(`Agent response missing required property ${prop}`)
  }

  return agentResponse
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
    logger.debug(`No timer to set for ${this.agentType} ${this._id}`)
    return
  }

  await agenda.start()
  agenda.define(this.agendaJobName, async function (job) {
    const { agentId } = job.attrs.data
    logger.debug(`Agenda activation ${agentId}`)
    const agent = await mongoose.model('Agent').findOne({ _id: agentId }).populate('thread').exec()

    if (!agent) {
      logger.warn(`Could not find agent ${agentId}`)
      return
    }
    await agent.thread.populate('messages').execPopulate()
    await agent.evaluate()
  })

  await agenda.every(this.timerPeriod, this.agendaJobName, { agentId: this._id })
  logger.debug(`Set timer for ${this.agentType} ${this._id} ${this.agendaJobName} ${this.timerPeriod}`)
})

agentSchema.method('isWithinTokenLimit', async function (promptText) {
  // eslint-disable-next-line no-return-await
  return await agentTypes[this.agentType].isWithinTokenLimit.call(this, promptText)
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

  // do not process if no new messages, unless minNewMessages is undefined
  if (this.minNewMessages && messageCount === this.lastActiveMessageCount) {
    logger.debug(`No new messages to respond to ${this.agentType} ${this._id}`)
    return { action: AgentMessageActions.OK, userContributionVisible: true }
  }

  if (userMessage && this.minNewMessages && messageCount - this.lastActiveMessageCount < this.minNewMessages) {
    logger.debug('Not enough new messages for activation')
    return { action: AgentMessageActions.OK, userContributionVisible: true }
  }
  const agentEvaluation = validAgentEvaluation(await agentTypes[this.agentType].evaluate.call(this, userMessage))
  // Only reset timer if contributing in response to a new message, otherwise let it continue periodic checking
  // do after LLM processing, since it may take some time
  if (userMessage && agentEvaluation.action === AgentMessageActions.CONTRIBUTE && this.timerPeriod) await this.resetTimer()

  if (agentEvaluation.action === AgentMessageActions.CONTRIBUTE) {
    // get agent responses async to free user to continue entering messages
    setTimeout(
      function () {
        agentTypes[this.agentType].respond
          .call(this, userMessage)
          .then(async (responses) => {
            for (const agentResponse of responses) {
              const response = validAgentResponse(agentResponse)
              const agentMessage = new Message({
                fromAgent: true,
                visible: response.visible,
                body: response.message,
                thread: this.thread._id,
                pseudonym: this.name,
                pseudonymId: this.pseudonyms[0]._id,
                owner: this._id
              })

              agentMessage.save()
              this.thread.messages.push(agentMessage.toObject())
              await this.thread.save()
              agentMessage.count = this.thread.messages.length
              const io = socketIO.connection()
              io.emit(agentMessage.thread._id.toString(), 'message:new', {
                ...agentMessage.toJSON(),
                count: agentMessage.count
              })
            }
          })
          .catch((err) => {
            logger.error(`Error processing agent response: ${err}`)
          })
      }.bind(this),
      100
    )
  }

  // update last activation message count
  if (agentEvaluation.action !== AgentMessageActions.REJECT) {
    this.lastActiveMessageCount = messageCount
    await this.save()
  }

  logger.debug(`Evaluated agent ${this.name} ${this.thread._id} ${AgentMessageActions[agentEvaluation.action]}`)
  return agentEvaluation
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
    logger.debug('Created default agent pseudonym')
  }

  if (this.pseudonyms.length > 1) {
    this.pseudonyms = this.pseudonyms.slice(0, 1)
  }
})

/**
 * @typedef Agent
 */
const Agent = BaseUser.discriminator('Agent', agentSchema)

export default Agent
