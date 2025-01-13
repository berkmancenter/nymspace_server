const faker = require('faker')
const mongoose = require('mongoose')

jest.mock('agenda')
require('../../../src/agenda.js')
const setupIntTest = require('../../utils/setupIntTest.js')
const config = require('../../../src/config/config')
const { Thread } = require('../../../src/models/index')
const { insertUsers } = require('../../fixtures/user.fixture.js')
const { publicTopic } = require('../../fixtures/thread.fixture.js')
const { insertTopics } = require('../../fixtures/topic.fixture.js')
const { AgentMessageActions } = require('../../../src/types/agent.types.js')

jest.setTimeout(120000)

jest.mock('../../../src/websockets/socketIO', () => ({
  connection: jest.fn(() => ({
    emit: jest.fn()
  }))
}))

setupIntTest()
;(config.enableAgents ? describe : describe.skip)('civility agent tests', () => {
  let agent
  let thread
  let threadData
  let user1
  let Agent

  async function createUser(pseudonym) {
    return {
      _id: new mongoose.Types.ObjectId(),
      username: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password: 'password1',
      role: 'user',
      isEmailVerified: false,
      pseudonyms: [
        {
          _id: new mongoose.Types.ObjectId(),
          token:
            '31c5d2b7d2b0f86b2b4b204ed4bf17938e4108a573b25db493a55c4639cc6cd3518a4c88787fe29cf9f273d61e3c5fd4eabb528e3e9b7398c1ed0944581ce51e53f6eae13328c4be05e7e14365063409',
          pseudonym,
          active: 'true'
        }
      ]
    }
  }

  async function createMessage(user, body) {
    return {
      body,
      user: user.pseudonyms[0].pseudonym
    }
  }

  async function checkOkResponseEvaluation(evaluation) {
    expect(evaluation).toEqual(expect.objectContaining({ action: AgentMessageActions.OK, userContributionVisible: true }))
  }

  async function checkRejectResponseEvaluation(evaluation, msg) {
    expect(evaluation).toEqual(
      expect.objectContaining({
        action: AgentMessageActions.REJECT,
        userContributionVisible: true,
        suggestion: expect.stringMatching(/^@Strange Fellow:\s.+/),
        contribution: undefined,
        userMessage: msg
      })
    )
  }

  beforeAll(async () => {
    const module = await import('../../../src/models/user.model/agent.model/index.mjs')
    Agent = module.default
  })

  beforeEach(async () => {
    user1 = await createUser('Strange Fellow')

    await insertUsers([user1])
    await insertTopics([publicTopic])

    threadData = {
      _id: new mongoose.Types.ObjectId(),
      name: 'What are you thinking about today?',
      owner: user1._id,
      topic: publicTopic._id,
      enableAgents: true,
      agents: [],
      messages: []
    }
    thread = new Thread(threadData)
    await thread.save()
    agent = new Agent({
      agentType: 'civilityPerMessage',
      thread: thread._id
    })
    await agent.save()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should allow civil messages', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, "How are y'all doing?")
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent profanity', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Asshole')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent profanity with missing characters', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'F you')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent profanity with placeholder characters', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'A$$hole')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent personal attacks', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'John is stupid')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent religious based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Christians are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent sexuality based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Gay people are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent gender based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Men are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent age based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Old people are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent race based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'White people are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent disability based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Disabled people are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent citizenship based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Americans are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent marital status based harassment', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'Single people are always causing problems')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent speaking for others', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'I know John agrees with me')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent group attacks', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'You are all so dumb')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should prevent unspecific emotional outbursts', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'I am so angry!')
    agent.thread = thread
    await checkRejectResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow specific expression of emotion: frustration', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'I am frustrated because no one has acknowledged the point I was making about the connection between immigration and the impact on social services'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow specific expression of emotion :upset', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'This conversation is making me upset because none of your responses address what I have stated I consider to be the central topic: gender-based inequalities. Can you please comment on that?'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow specific expression of emotion :sadness', async () => {
    await agent.initialize()
    const msg1 = await createMessage(user1, 'I am saddened when I hear that the group has opposed my proposal')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow I statements: variant 1', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'I feel upset when I hear about people who do not pay taxes being able to receive social benefits'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow I statements: variant 2', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'When I hear about people who do not pay taxes being able to receive social benefits I feel upset'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow nuanced reference to protected groups: A', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'As a young person, I would like to know if people over 60 understand how they are perceived by younger people'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow nuanced reference to protected groups: B', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'As a young person, I can tell you that many young people are frustrated by what appears to be a lack of concern for the experiences of young people like me'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })

  it('should allow nuanced statements on complex topics', async () => {
    await agent.initialize()
    const msg1 = await createMessage(
      user1,
      'I am concerned about unfettered immigration because of the load it could create on social services'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1), msg1)
  })
})
