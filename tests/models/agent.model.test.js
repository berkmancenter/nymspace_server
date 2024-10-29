const Agenda = require('agenda')
const faker = require('faker')
const mongoose = require('mongoose')
const setupTestDB = require('../utils/setupTestDB')
const { Agent, Message, Thread, User, Topic } = require('../../src/models/index')
const { registeredUser, insertUsers } = require('../fixtures/user.fixture')
const { publicTopic, threadAgentsEnabled } = require('../fixtures/thread.fixture')
const { insertTopics } = require('../fixtures/topic.fixture')
const { AgentMessageActions } = require('../../src/types/agent.types')
const formatConvHistory = require('../../src/models/user.model/agent.model/helpers/formatConvHistory')

// This has to be mocked here rather than setup or test method because mock should be in place before the test
// requires Agent from /src/models/index
jest.mock('agenda')
setupTestDB()

let everySpy
let startSpy
let cancelSpy
let agent
let thread
let msg1
let msg2
let msg3

describe('agent tests', () => {
  beforeEach(async () => {
    everySpy = jest.spyOn(Agenda.prototype, 'every')
    startSpy = jest.spyOn(Agenda.prototype, 'start')
    cancelSpy = jest.spyOn(Agenda.prototype, 'cancel')
    await insertUsers([registeredUser])
    await insertTopics([publicTopic])
    thread = new Thread(threadAgentsEnabled)
    thread.save()
    msg1 = new Message({
      _id: mongoose.Types.ObjectId(),
      body: faker.lorem.words(10),
      thread: threadAgentsEnabled._id,
      owner: registeredUser._id,
      pseudonymId: registeredUser.pseudonyms[0]._id,
      pseudonym: registeredUser.pseudonyms[0].pseudonym
    })
    msg2 = new Message({
      _id: mongoose.Types.ObjectId(),
      body: faker.lorem.words(10),
      thread: threadAgentsEnabled._id,
      owner: registeredUser._id,
      pseudonymId: registeredUser.pseudonyms[0]._id,
      pseudonym: registeredUser.pseudonyms[0].pseudonym
    })
    msg3 = new Message({
      _id: mongoose.Types.ObjectId(),
      body: faker.lorem.words(10),
      thread: threadAgentsEnabled._id,
      owner: registeredUser._id,
      pseudonymId: registeredUser.pseudonyms[0]._id,
      pseudonym: registeredUser.pseudonyms[0].pseudonym
    })
  })
  afterEach(async () => {
    await Topic.deleteOne({ _id: publicTopic._id })
    await Thread.deleteOne({ _id: thread._id })
    await User.deleteOne({ _id: registeredUser._id })
    if (agent) await Agent.deleteOne({ _id: agent._id })
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('periodic agent', () => {
    beforeEach(async () => {
      agent = new Agent({
        agentType: 'playfulPeriodic',
        thread: thread._id
      })
      await agent.save()
    })

    test('should generate an AI response when min messages received', async () => {
      const mockResponse = jest.fn()
      const mockTokenLimit = jest.fn()

      jest.unstable_mockModule('../../src/models/user.model/agent.model/helpers/chatAI.js', () => ({
        getResponse: mockResponse,
        isInTokenLimit: mockTokenLimit
      }))

      // eslint-disable-next-line import/extensions
      await import('../../src/models/user.model/agent.model/helpers/chatAI.js')

      mockResponse.mockResolvedValue('A response')

      await agent.initialize()
      expect(startSpy).toHaveBeenCalled()
      expect(everySpy).toHaveBeenCalledWith(agent.timerPeriod, agent.agendaJobName, { agentId: agent._id })

      agent.thread = thread
      const evaluation = await agent.evaluate(msg1)

      expect(evaluation).toEqual({ action: AgentMessageActions.OK })
      const response = await agent.respond()
      expect(response).toBe(undefined)

      // User message is persisted after agent is called and gives the OK
      await msg1.save()
      thread.messages.push(msg1.toObject())
      await thread.save()
      await thread.populate('messages').execPopulate()

      agent.thread = thread
      const evaluation2 = await agent.evaluate(msg2)
      expect(evaluation2).toEqual({
        userMessage: msg2,
        action: AgentMessageActions.CONTRIBUTE,
        agentContributionVisible: true,
        userContributionVisible: true,
        suggestion: undefined,
        contribution: 'A response'
      })

      const llmResponse = await agent.respond()
      expect(llmResponse).toMatchObject({
        fromAgent: true,
        visible: true,
        body: 'A response',
        thread: thread._id,
        pseudonym: agent.name,
        pseudonymId: agent.pseudonyms[0]._id,
        owner: agent._id
      })

      // verify timer was reset since agent processed messages
      expect(cancelSpy).toHaveBeenCalledWith({ name: agent.agendaJobName })
      expect(everySpy).toHaveBeenCalledTimes(2)

      await msg2.save()
      thread.messages.push(msg2.toObject())
      await thread.save()
      await thread.populate('messages').execPopulate()

      // 2 user messages and one agent message processed at this point, but agent message should not count in calculation
      agent.thread = thread
      const evaluation3 = await agent.evaluate(msg3)
      expect(evaluation3).toEqual({ action: AgentMessageActions.OK })
      const response3 = await agent.respond()
      expect(response3).toBe(undefined)
      expect(agent.lastActiveMessageCount).toEqual(2)

      const convHistory = formatConvHistory([msg1], agent.useNumLastMessages, msg2)
      expect(mockResponse).toHaveBeenCalledWith(agent.template, convHistory, thread.name)
    })

    test('should generate an AI response when min messages received since last periodic check', async () => {
      const mockResponse = jest.fn()
      const mockTokenLimit = jest.fn()

      jest.unstable_mockModule('../../src/models/user.model/agent.model/helpers/chatAI.js', () => ({
        getResponse: mockResponse,
        isInTokenLimit: mockTokenLimit
      }))

      // eslint-disable-next-line import/extensions
      await import('../../src/models/user.model/agent.model/helpers/chatAI.js')

      mockResponse.mockResolvedValue('A response')

      await agent.initialize()
      expect(startSpy).toHaveBeenCalled()
      expect(everySpy).toHaveBeenCalledWith(agent.timerPeriod, agent.agendaJobName, { agentId: agent._id })

      await msg1.save()
      thread.messages.push(msg1.toObject())
      await thread.save()
      await thread.populate('messages').execPopulate()

      // period check with one message
      agent.thread = thread
      const evaluation = await agent.evaluate()
      expect(evaluation).toEqual({ action: AgentMessageActions.OK })
      const response = await agent.respond()
      expect(response).toBe(undefined)

      await msg2.save()
      thread.messages.push(msg2.toObject())
      await thread.save()
      await thread.populate('messages').execPopulate()

      // periodic check with 2 - should trigger processing
      agent.thread = thread
      const evaluation2 = await agent.evaluate()
      expect(evaluation2).toEqual({
        userMessage: null,
        action: AgentMessageActions.CONTRIBUTE,
        agentContributionVisible: true,
        userContributionVisible: true,
        suggestion: undefined,
        contribution: 'A response'
      })

      const llmResponse = await agent.respond()
      expect(llmResponse).toMatchObject({
        fromAgent: true,
        visible: true,
        body: 'A response',
        thread: thread._id,
        pseudonym: agent.name,
        pseudonymId: agent.pseudonyms[0]._id,
        owner: agent._id
      })

      // verify timer was not reset
      expect(everySpy).toHaveBeenCalledTimes(1)

      // 2 user messages and one agent message processed at this point, but agent message should not count in calculation
      agent.thread = thread
      const evaluation3 = await agent.evaluate()
      expect(evaluation3).toEqual({ action: AgentMessageActions.OK })
      const response3 = await agent.respond()
      expect(response3).toBe(undefined)
      expect(agent.lastActiveMessageCount).toEqual(2)

      const convHistory = formatConvHistory([msg1, msg2], agent.useNumLastMessages)
      expect(mockResponse).toHaveBeenCalledWith(agent.template, convHistory, thread.name)
      expect(mockResponse).toHaveBeenCalledTimes(1)
    })
  })
  describe('per message agent', () => {
    beforeEach(async () => {
      agent = new Agent({
        agentType: 'playfulPerMessage',
        thread: thread._id
      })
      await agent.save()
    })

    test('should generate an AI response when each messages is received', async () => {
      const mockResponse = jest.fn()
      const mockTokenLimit = jest.fn()

      jest.unstable_mockModule('../../src/models/user.model/agent.model/helpers/chatAI.js', () => ({
        getResponse: mockResponse,
        isInTokenLimit: mockTokenLimit
      }))

      // eslint-disable-next-line import/extensions
      await import('../../src/models/user.model/agent.model/helpers/chatAI.js')

      mockResponse.mockResolvedValue('A response')

      await agent.initialize()

      agent.thread = thread
      const evaluation = await agent.evaluate(msg1)

      expect(evaluation).toEqual({
        userMessage: msg1,
        action: AgentMessageActions.CONTRIBUTE,
        agentContributionVisible: true,
        userContributionVisible: true,
        suggestion: undefined,
        contribution: 'A response'
      })

      const convHistory1 = formatConvHistory([], agent.useNumLastMessages, msg1)
      expect(mockResponse).toHaveBeenCalledWith(agent.template, convHistory1, thread.name)

      const response = await agent.respond()
      expect(response).toMatchObject({
        fromAgent: true,
        visible: true,
        body: 'A response',
        thread: thread._id,
        pseudonym: agent.name,
        pseudonymId: agent.pseudonyms[0]._id,
        owner: agent._id
      })

      // User message is persisted after agent is called and gives the OK
      await msg1.save()
      thread.messages.push(msg1.toObject())
      await thread.save()
      await thread.populate('messages').execPopulate()

      agent.thread = thread
      const evaluation2 = await agent.evaluate(msg2)
      expect(evaluation2).toEqual({
        userMessage: msg2,
        action: AgentMessageActions.CONTRIBUTE,
        agentContributionVisible: true,
        userContributionVisible: true,
        suggestion: undefined,
        contribution: 'A response'
      })

      // conversation history should include agent message
      const convHistory2 = formatConvHistory(
        [new Message({ body: 'A response', fromAgent: true }), msg1],
        agent.useNumLastMessages,
        msg2
      )
      expect(mockResponse).toHaveBeenCalledWith(agent.template, convHistory2, thread.name)

      const llmResponse = await agent.respond()
      expect(llmResponse).toMatchObject({
        fromAgent: true,
        visible: true,
        body: 'A response',
        thread: thread._id,
        pseudonym: agent.name,
        pseudonymId: agent.pseudonyms[0]._id,
        owner: agent._id
      })

      await msg2.save()
      thread.messages.push(msg2.toObject())
      await thread.save()
      await thread.populate('messages').execPopulate()

      // 2 user messages and 2 agent messages processed at this point, but agent message should not count in calculation
      expect(agent.lastActiveMessageCount).toEqual(2)

      // verify no scheduling for per message agent
      expect(startSpy).toHaveBeenCalledTimes(0)
      expect(everySpy).toHaveBeenCalledTimes(0)
    })
  })
})
