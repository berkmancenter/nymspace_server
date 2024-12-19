/**
 * Uses Pol.is openData to simulate messages for the reflection agent to process.
 * NOTE: this test is ignored when running npm test because it takes about 30 sec
 * to execute due to actual LLM calls
 * To run this test:
 * node --experimental-vm-modules node_modules/jest/bin/jest.js -i --colors --verbose \
 * tests/models/agentTypes/reflection.agent.test.js
 */
const faker = require('faker')
const mongoose = require('mongoose')

jest.mock('agenda')
require('../../../src/agenda.js')
const setupIntTest = require('../../utils/setupIntTest.js')
const waitFor = require('../../utils/waitFor.js')
const config = require('../../../src/config/config')
const { Message, Thread } = require('../../../src/models/index')
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

const { connection } = require('../../../src/websockets/socketIO.js')

setupIntTest()
;(config.enableAgents ? describe : describe.skip)('reflection agent tests', () => {
  let agent
  let thread
  let footballThread
  let user1
  let user2
  // eslint-disable-next-line one-var
  let user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13, user14
  let Agent

  async function createUser(pseudonym) {
    return {
      _id: mongoose.Types.ObjectId(),
      username: faker.name.findName(),
      email: faker.internet.email().toLowerCase(),
      password: 'password1',
      role: 'user',
      isEmailVerified: false,
      pseudonyms: [
        {
          _id: mongoose.Types.ObjectId(),
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
      thread: footballThread._id,
      user: user.pseudonyms[0].pseudonym
    }
  }

  async function validateResponse(expectedMsgCount, expectedVisibleAgentMsgCount, expectedPause = 30) {
    // eslint-disable-next-line no-return-await
    const agentMsg = await waitFor(async () => {
      expect(connection).toHaveBeenCalled()
      const emitMock = connection.mock.results[0].value.emit
      expect(emitMock).toHaveBeenCalledWith(
        thread._id.toString(),
        'message:new',
        expect.objectContaining({ count: expectedMsgCount, pause: expectedPause })
      )
      const response = emitMock.mock.calls[0][2]
      // eslint-disable-next-line no-console
      console.log(response.body)
      return response.body
    }, 60000)
    const expectedMessage = {
      fromAgent: true,
      visible: true,
      body: agentMsg,
      thread: thread._id,
      pseudonym: agent.name,
      pseudonymId: agent.pseudonyms[0]._id,
      owner: agent._id
    }
    const agentMessages = thread.messages.filter((msg) => msg.fromAgent && msg.visible)
    expect(agentMessages.length).toBe(expectedVisibleAgentMsgCount)
    expect(agentMessages).toContainEqual(expect.objectContaining(expectedMessage))
  }

  async function checkOkResponseEvaluation(evaluation) {
    expect(evaluation).toEqual(expect.objectContaining({ action: AgentMessageActions.OK, userContributionVisible: true }))
  }

  async function checkResponseEvaluation(evaluation, msg) {
    expect(evaluation).toEqual({
      action: AgentMessageActions.CONTRIBUTE,
      userContributionVisible: true,
      suggestion: undefined,
      userMessage: msg
    })
  }

  async function addMessageToThread(msgObj, user) {
    const msg = new Message({
      _id: mongoose.Types.ObjectId(),
      body: msgObj.body,
      thread: msgObj.thread,
      owner: user._id,
      pseudonymId: user.pseudonyms[0]._id,
      pseudonym: user.pseudonyms[0].pseudonym
    })
    await msg.save()
    thread.messages.push(msg.toObject())
    await thread.save()
    await thread.populate('messages').execPopulate()
  }

  beforeAll(async () => {
    const module = await import('../../../src/models/user.model/agent.model/index.mjs')
    Agent = module.default
  })

  beforeEach(async () => {
    user1 = await createUser('Boring Badger')
    user2 = await createUser('Shady Lawyer')
    user3 = await createUser('Hungry Hippo')
    user4 = await createUser('Sad Llama')
    user5 = await createUser('Leaping Lemur')
    user6 = await createUser('Happy Ant')
    user7 = await createUser('Buzzing Bee')
    user8 = await createUser('Annoyed Avocado')
    user9 = await createUser('Fearless Frog')
    user10 = await createUser('Excited Panda')
    user11 = await createUser('Verbose Snake')
    user12 = await createUser('Chilly Penguin')
    user13 = await createUser('Fuzzy Bat')
    user14 = await createUser('Smooth Crocodile')

    await insertUsers([user1, user2, user3, user4, user5, user6, user7])
    await insertUsers([user8, user9, user10, user11, user12, user13, user14])
    await insertTopics([publicTopic])

    footballThread = {
      _id: mongoose.Types.ObjectId(),
      name: 'Is the concussion crisis and CTE the end of the NFL?',
      owner: user1._id,
      topic: publicTopic._id,
      enableAgents: true,
      agents: [],
      messages: []
    }
    thread = new Thread(footballThread)
    await thread.save()
    agent = new Agent({
      agentType: 'reflection',
      thread: thread._id
    })
    agent.thread = thread
    await agent.save()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should generate an intro message', async () => {
    await agent.initialize(true)
    const expectedMessage = {
      fromAgent: true,
      visible: true,
      body: agent.introMessage,
      thread: thread._id,
      pseudonym: agent.name,
      pseudonymId: agent.pseudonyms[0]._id,
      owner: agent._id
    }
    await thread.populate('messages').execPopulate()
    const agentMessages = thread.messages.filter((msg) => msg.fromAgent && msg.visible)
    expect(agentMessages.length).toBe(1)
    expect(agentMessages).toContainEqual(expect.objectContaining(expectedMessage))
  })

  it('should generate an AI response when min messages received', async () => {
    await agent.initialize()

    const msg1 = await createMessage(user1, 'test 123')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1))
    await addMessageToThread(msg1, user1)

    const msg2 = await createMessage(
      user2,
      'The monetary incentives of professional football will continue to attract players for a long time, particularly from low income populations.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg2))
    await addMessageToThread(msg2, user2)

    const msg3 = await createMessage(
      user3,
      "Gladwell calls football a \"moral abomination,\" but I think the real abomination is how he picks one sport without contextualizing the ENTIRE community health risk posed by ALL sports. Ex: so far I haven't heard him mention the rate of concussions of girls heading 70 mph soccer balls. The rules in college and pro football have changed to better protect QBs and receivers. I think Gladwell put down his crumpet to watch football for 1 second and didn't like what he saw. He's an atrocious sports fan."
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg3))
    await addMessageToThread(msg3, user3)

    const msg4 = await createMessage(
      user4,
      'Considering I\'ve read 4 of his books I\'m hesitant to say this, but I think Gladwell\'s commentaries on sports, and the "10,000 hour rule," have already unravelled. His "rule" has been utterly debunked, so you can imagine it doesn\'t apply to youth hockey as he tried to demonstrate in Outliers. From this video, he not only thinks boxing "disappeared," but he\'s also never heard of MMA apparently. Football and the lot have always been known as very dangerous sports.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg4))
    await addMessageToThread(msg4, user4)

    const msg5 = await createMessage(user5, 'testing fooo')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg5))
    await addMessageToThread(msg5, user5)

    const msg6 = await createMessage(
      user6,
      "I'm excited to watch the Seattle Seahawks in the superbowl, not too concerned about the injuries."
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg6))
    await addMessageToThread(msg6, user6)

    const msg7 = await createMessage(user7, 'asdjfkalsjdfkl')
    agent.thread = thread

    await checkResponseEvaluation(await agent.evaluate(msg7), msg7)
    await addMessageToThread(msg7, user7)

    await validateResponse(8, 1)

    jest.clearAllMocks()

    const msg8 = await createMessage(
      user8,
      'Guns are a part of our culture despite the frequent and horrific examples of their destruction. American Football will never fade because of its violent characteristics as long as we have guns.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg8))
    await addMessageToThread(msg8, user8)

    const msg9 = await createMessage(user9, 'Football is forever American.')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg9))
    await addMessageToThread(msg9, user9)

    const msg10 = await createMessage(user10, "RuPaul's Drag Race is defining mainstream gay culture.")
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg10))
    await addMessageToThread(msg10, user10)

    const msg11 = await createMessage(user11, 'Yellow color is associated with warmth.')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg11))
    await addMessageToThread(msg11, user11)

    const msg12 = await createMessage(
      user12,
      "Lots of professional sports cause long term injuries. Such as soccer, tennis, boxing ecetera. Isn't sport supposed to be healthy?"
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg12))
    await addMessageToThread(msg12, user12)

    const msg13 = await createMessage(user13, 'Football is amazing.')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg13))
    await addMessageToThread(msg13, user13)

    const msg14 = await createMessage(user14, 'Yes.')
    agent.thread = thread

    await checkResponseEvaluation(await agent.evaluate(msg14), msg14)
    await addMessageToThread(msg14, user14)

    await validateResponse(16, 2)
  })

  it('should respond when addressed by a participant about the discussion topic while keeping summarization count', async () => {
    await agent.initialize()

    const msg1 = await createMessage(user1, 'test 123')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1))
    await addMessageToThread(msg1, user1)

    const msg2 = await createMessage(
      user2,
      'The monetary incentives of professional football will continue to attract players for a long time, particularly from low income populations.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg2))
    await addMessageToThread(msg2, user2)

    const msg3 = await createMessage(
      user3,
      "Gladwell calls football a \"moral abomination,\" but I think the real abomination is how he picks one sport without contextualizing the ENTIRE community health risk posed by ALL sports. Ex: so far I haven't heard him mention the rate of concussions of girls heading 70 mph soccer balls. The rules in college and pro football have changed to better protect QBs and receivers. I think Gladwell put down his crumpet to watch football for 1 second and didn't like what he saw. He's an atrocious sports fan."
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg3))
    await addMessageToThread(msg3, user3)

    const msg4 = await createMessage(
      user4,
      'Considering I\'ve read 4 of his books I\'m hesitant to say this, but I think Gladwell\'s commentaries on sports, and the "10,000 hour rule," have already unravelled. His "rule" has been utterly debunked, so you can imagine it doesn\'t apply to youth hockey as he tried to demonstrate in Outliers. From this video, he not only thinks boxing "disappeared," but he\'s also never heard of MMA apparently. Football and the lot have always been known as very dangerous sports.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg4))
    await addMessageToThread(msg4, user4)

    // manual verification - response to topic question
    const msg5 = await createMessage(
      user5,
      'Hey @"Reflection Agent", I heard that over one hundred football players are diagnosed with CTE every year. Is that true?'
    )
    agent.thread = thread
    await checkResponseEvaluation(await agent.evaluate(msg5), msg5)
    await addMessageToThread(msg5, user5)

    await validateResponse(6, 1, 0)
    jest.clearAllMocks()

    const msg6 = await createMessage(
      user6,
      "You guys should all toughen up. Football is the great American sport and if you can't handle injury, get out of the game"
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg6))
    await addMessageToThread(msg6, user6)

    // This is message 7, should trigger summarization
    const msg7 = await createMessage(user7, 'asdjfkalsjdfkl')
    agent.thread = thread
    await checkResponseEvaluation(await agent.evaluate(msg7), msg7)
    await addMessageToThread(msg7, user7)

    await validateResponse(9, 2)
    jest.clearAllMocks()

    // This message should not
    const msg8 = await createMessage(
      user8,
      'Guns are a part of our culture despite the frequent and horrific examples of their destruction. American Football will never fade because of its violent characteristics as long as we have guns.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg8))
    await addMessageToThread(msg8, user8)
  })

  it('should summarize on the 8th message if 7th is a direct question', async () => {
    await agent.initialize()

    const msg1 = await createMessage(user1, 'test 123')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg1))
    await addMessageToThread(msg1, user1)

    const msg2 = await createMessage(
      user2,
      'The monetary incentives of professional football will continue to attract players for a long time, particularly from low income populations.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg2))
    await addMessageToThread(msg2, user2)

    const msg3 = await createMessage(
      user3,
      "Gladwell calls football a \"moral abomination,\" but I think the real abomination is how he picks one sport without contextualizing the ENTIRE community health risk posed by ALL sports. Ex: so far I haven't heard him mention the rate of concussions of girls heading 70 mph soccer balls. The rules in college and pro football have changed to better protect QBs and receivers. I think Gladwell put down his crumpet to watch football for 1 second and didn't like what he saw. He's an atrocious sports fan."
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg3))
    await addMessageToThread(msg3, user3)

    const msg4 = await createMessage(
      user4,
      'Considering I\'ve read 4 of his books I\'m hesitant to say this, but I think Gladwell\'s commentaries on sports, and the "10,000 hour rule," have already unravelled. His "rule" has been utterly debunked, so you can imagine it doesn\'t apply to youth hockey as he tried to demonstrate in Outliers. From this video, he not only thinks boxing "disappeared," but he\'s also never heard of MMA apparently. Football and the lot have always been known as very dangerous sports.'
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg4))
    await addMessageToThread(msg4, user4)

    const msg5 = await createMessage(user5, 'asdjfkalsjdfkl')
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg5))
    await addMessageToThread(msg5, user5)

    const msg6 = await createMessage(
      user6,
      "You guys should all toughen up. Football is the great American sport and if you can't handle injury, get out of the game"
    )
    agent.thread = thread
    await checkOkResponseEvaluation(await agent.evaluate(msg6))
    await addMessageToThread(msg6, user6)

    // manual verification - response to off-topic question
    const msg7 = await createMessage(user7, '@"Reflection Agent" what is your favorite beer?')
    await checkResponseEvaluation(await agent.evaluate(msg7), msg7)
    await addMessageToThread(msg7, user7)
    await validateResponse(8, 1, 0)
    jest.clearAllMocks()

    // This message should trigger summarization
    const msg8 = await createMessage(
      user8,
      'Guns are a part of our culture despite the frequent and horrific examples of their destruction. American Football will never fade because of its violent characteristics as long as we have guns.'
    )
    agent.thread = thread
    await checkResponseEvaluation(await agent.evaluate(msg8), msg8)
    await addMessageToThread(msg8, user8)
    await validateResponse(10, 2)
    jest.clearAllMocks()

    // manual verification - response to message about civil discourse
    const msg9 = await createMessage(
      user9,
      'Hey @"Reflection Agent", what is the appropriate way to respond to @Happy Ant\'s message? It is really offensive.'
    )
    await checkResponseEvaluation(await agent.evaluate(msg9), msg9)
    await addMessageToThread(msg9, user9)
    await validateResponse(12, 3, 0)
  })

  it('should respond on perodic invocation if at least four new messages', async () => {
    const msg1 = await createMessage(user1, 'test 123')
    agent.thread = thread
    await addMessageToThread(msg1, user1)

    // doesn't respond on first message
    await checkOkResponseEvaluation(await agent.evaluate())

    const msg2 = await createMessage(
      user2,
      'The monetary incentives of professional football will continue to attract players for a long time, particularly from low income populations.'
    )
    agent.thread = thread
    await addMessageToThread(msg2, user2)
    await checkOkResponseEvaluation(await agent.evaluate())

    const msg3 = await createMessage(
      user3,
      "Gladwell calls football a \"moral abomination,\" but I think the real abomination is how he picks one sport without contextualizing the ENTIRE community health risk posed by ALL sports. Ex: so far I haven't heard him mention the rate of concussions of girls heading 70 mph soccer balls. The rules in college and pro football have changed to better protect QBs and receivers. I think Gladwell put down his crumpet to watch football for 1 second and didn't like what he saw. He's an atrocious sports fan."
    )
    agent.thread = thread
    await addMessageToThread(msg3, user3)
    await checkOkResponseEvaluation(await agent.evaluate())

    const msg4 = await createMessage(
      user4,
      'Considering I\'ve read 4 of his books I\'m hesitant to say this, but I think Gladwell\'s commentaries on sports, and the "10,000 hour rule," have already unravelled. His "rule" has been utterly debunked, so you can imagine it doesn\'t apply to youth hockey as he tried to demonstrate in Outliers. From this video, he not only thinks boxing "disappeared," but he\'s also never heard of MMA apparently. Football and the lot have always been known as very dangerous sports.'
    )
    agent.thread = thread
    await addMessageToThread(msg4, user4)
    await checkResponseEvaluation(await agent.evaluate(), null)
    await validateResponse(5, 1)

    // no response because no new messages
    await checkOkResponseEvaluation(await agent.evaluate())
  })
})
