const Agenda = require('agenda')
const faker = require('faker')
const mongoose = require('mongoose')
const setupTestDB = require('../utils/setupTestDB')
const { Agent, Message, Thread } = require('../../src/models/index')
const { registeredUser, insertUsers } = require('../fixtures/user.fixture')
const { publicTopic, threadAgentsEnabled } = require('../fixtures/thread.fixture')
const { insertTopics } = require('../fixtures/topic.fixture')
const { AgentMessageActions } = require('../../src/types/agent.types')
const formatConvHistory = require('../../src/models/user.model/agent.model/helpers/formatConvHistory')

jest.mock('agenda')
setupTestDB()
describe('periodic agent', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('should generate an AI response once min messages received', async () => {
    await insertUsers([registeredUser])
    await insertTopics([publicTopic])
    const thread = new Thread(threadAgentsEnabled)
    thread.save()

    const msg1 = new Message({
      _id: mongoose.Types.ObjectId(),
      body: faker.lorem.words(10),
      thread: threadAgentsEnabled._id,
      owner: registeredUser._id,
      pseudonymId: registeredUser.pseudonyms[0]._id,
      pseudonym: registeredUser.pseudonyms[0].pseudonym
    })

    const msg2 = new Message({
      _id: mongoose.Types.ObjectId(),
      body: faker.lorem.words(10),
      thread: threadAgentsEnabled._id,
      owner: registeredUser._id,
      pseudonymId: registeredUser.pseudonyms[0]._id,
      pseudonym: registeredUser.pseudonyms[0].pseudonym
    })

    const agent = new Agent({
      agentType: 'playfulPeriodic',
      thread: thread._id
    })

    await agent.save()

    const mockResponse = jest.fn()
    const mockTokenLimit = jest.fn()

    jest.unstable_mockModule('../../src/models/user.model/agent.model/helpers/chatAI.js', () => ({
      getResponse: mockResponse,
      isInTokenLimit: mockTokenLimit
    }))

    // eslint-disable-next-line import/extensions
    await import('../../src/models/user.model/agent.model/helpers/chatAI.js')

    mockResponse.mockResolvedValue('A response')
    const everySpy = jest.spyOn(Agenda.prototype, 'every')
    const startSpy = jest.spyOn(Agenda.prototype, 'start')

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

    const convHistory = formatConvHistory([msg1], agent.useNumLastMessages, msg2)
    expect(mockResponse).toHaveBeenCalledWith(agent.template, convHistory, thread.name)
  })
})
