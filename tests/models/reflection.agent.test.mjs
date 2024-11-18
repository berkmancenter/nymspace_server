/**
 * Uses Pol.is openData to simulate messages for the reflection agent to process.
 * For now, this test must be run manually with the following commands:
 * export NODE_ENV=test
 * npx mocha --exit --timeout 120000 tests/models/reflection.agent.test.mjs
 *
 *
 */

/* eslint-disable jest/valid-expect */
import agenda from 'agenda'
import faker from 'faker'
import mongoose from 'mongoose'
import config from '../../src/config/config.js'
import socketIO from '../../src/websockets/socketIO.js'
const sinon = await import('sinon')
import { use, expect } from 'chai'
import chaiSubset from 'chai-subset'
const { Agent, Message, Thread, User, Topic } = await import('../../src/models/index.js')
const { insertUsers } = await import('../fixtures/user.fixture.js')
const { publicTopic } = await import('../fixtures/thread.fixture.js')
const { insertTopics } = await import('../fixtures/topic.fixture.js')
const { AgentMessageActions } = await import('../../src/types/agent.types.js')

use(chaiSubset)
sinon.stub(agenda.prototype, 'start')
sinon.stub(agenda.prototype, 'every')
sinon.stub(agenda.prototype, 'cancel')
const mockSocketInstance = {
  emit: sinon.stub()
}
sinon.stub(socketIO, 'connection').returns(mockSocketInstance)
const emitStub = mockSocketInstance.emit

describe('reflection agent tests', () => {
  let agent
  let thread
  let footballThread
  let user1
  let user2
  let user3, user4, user5, user6, user7, user8, user9, user10, user11, user12, user13, user14

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
    return new Message({
      _id: mongoose.Types.ObjectId(),
      body,
      thread: footballThread._id,
      owner: user._id,
      pseudonymId: user.pseudonyms[0]._id,
      pseudonym: user.pseudonyms[0].pseudonym
    })
  }

  async function validateResponse(expectedMsgCount) {
    await new Promise((resolve) => {
      const intervalId = setInterval(() => {
        if (emitStub.called) {
          clearInterval(intervalId)
          resolve()
        }
      }, 10) // Check every 10ms
    })
    expect(emitStub.calledOnce).to.be.true
    const calledWithChannel = emitStub.firstCall.args[0]
    const calledWithEventName = emitStub.firstCall.args[1]
    const calledWithData = emitStub.firstCall.args[2]

    expect(calledWithChannel).to.equal(thread._id.toString())
    expect(calledWithEventName).to.equal('message:new')
    expect(calledWithData).to.have.property('count', expectedMsgCount)
    expect(calledWithData.body).to.not.be.undefined
    // See agent response
    console.log(calledWithData.body)
    emitStub.resetHistory()
    return calledWithData.body
  }

  async function checkNoResponseEvaluation(evaluation) {
    expect(evaluation).to.deep.equal({ action: AgentMessageActions.OK, userContributionVisible: true })
  }

  async function checkResponseEvaluation(evaluation, msg) {
    expect(evaluation).to.deep.equal({
      action: AgentMessageActions.CONTRIBUTE,
      userContributionVisible: true,
      suggestion: undefined,
      userMessage: msg
    })
  }

  async function addMessageToThread(msg) {
    await msg.save()
    thread.messages.push(msg.toObject())
    await thread.save()
    await thread.populate('messages').execPopulate()
  }

  before(async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options)
  })

  after(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()))

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
    await agent.save()
  })

  afterEach(async () => {
    await sinon.restore()
  })

  it('should generate an AI response when min messages received', async () => {
    await agent.initialize()

    const msg1 = await createMessage(user1, 'test 123')
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg1))
    await addMessageToThread(msg1)

    const msg2 = await createMessage(
      user2,
      'The monetary incentives of professional football will continue to attract players for a long time, particularly from low income populations.'
    )
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg2))
    await addMessageToThread(msg2)

    const msg3 = await createMessage(
      user3,
      "Gladwell calls football a \"moral abomination,\" but I think the real abomination is how he picks one sport without contextualizing the ENTIRE community health risk posed by ALL sports. Ex: so far I haven't heard him mention the rate of concussions of girls heading 70 mph soccer balls. The rules in college and pro football have changed to better protect QBs and receivers. I think Gladwell put down his crumpet to watch football for 1 second and didn't like what he saw. He's an atrocious sports fan."
    )
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg3))
    await addMessageToThread(msg3)

    const msg4 = await createMessage(
      user4,
      'Considering I\'ve read 4 of his books I\'m hesitant to say this, but I think Gladwell\'s commentaries on sports, and the "10,000 hour rule," have already unravelled. His "rule" has been utterly debunked, so you can imagine it doesn\'t apply to youth hockey as he tried to demonstrate in Outliers. From this video, he not only thinks boxing "disappeared," but he\'s also never heard of MMA apparently. Football and the lot have always been known as very dangerous sports.'
    )
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg4))
    await addMessageToThread(msg4)

    const msg5 = await createMessage(user5, 'testing fooo')
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg5))
    await addMessageToThread(msg5)

    const msg6 = await createMessage(
      user6,
      "I'm excited to watch the Seattle Seahawks in the superbowl, not too concerned about the injuries."
    )
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg6))
    await addMessageToThread(msg6)

    const msg7 = await createMessage(user7, 'asdjfkalsjdfkl')
    agent.thread = thread

    await checkResponseEvaluation(await agent.evaluate(msg7), msg7)
    await addMessageToThread(msg7)

    // We are currently including invisible messages in message count, so agent should add 2
    const response = await validateResponse(9)
    const expectedMessage = {
      fromAgent: true,
      visible: true,
      body: response,
      thread: thread._id,
      pseudonym: agent.name,
      pseudonymId: agent.pseudonyms[0]._id,
      owner: agent._id
    }
    const agentMessages = thread.messages.filter((msg) => msg.fromAgent && msg.visible)
    expect(agentMessages.length).to.equal(1)
    expect(agentMessages[0]).to.deep.include(expectedMessage)

    const msg8 = await createMessage(
      user8,
      'Guns are a part of our culture despite the frequent and horrific examples of their destruction. American Football will never fade because of its violent characteristics as long as we have guns.'
    )
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg8))
    await addMessageToThread(msg8)

    const msg9 = await createMessage(user9, 'Football is forever American.')
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg9))
    await addMessageToThread(msg9)

    const msg10 = await createMessage(user10, "RuPaul's Drag Race is defining mainstream gay culture.")
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg10))
    await addMessageToThread(msg10)

    const msg11 = await createMessage(user11, 'Yellow color is associated with warmth.')
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg11))
    await addMessageToThread(msg11)

    const msg12 = await createMessage(
      user12,
      "Lots of professional sports cause long term injuries. Such as soccer, tennis, boxing ecetera. Isn't sport supposed to be healthy?"
    )
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg12))
    await addMessageToThread(msg12)

    const msg13 = await createMessage(user13, 'Football is amazing.')
    agent.thread = thread
    await checkNoResponseEvaluation(await agent.evaluate(msg13))
    await addMessageToThread(msg13)

    const msg14 = await createMessage(user14, 'Yes.')
    agent.thread = thread

    await checkResponseEvaluation(await agent.evaluate(msg14), msg14)
    await addMessageToThread(msg14)

    const response2 = await validateResponse(18)
    const expectedMessage2 = {
      fromAgent: true,
      visible: true,
      body: response2,
      thread: thread._id,
      pseudonym: agent.name,
      pseudonymId: agent.pseudonyms[0]._id,
      owner: agent._id
    }
    const agentMessages2 = thread.messages.filter((msg) => msg.fromAgent && msg.visible)
    expect(agentMessages2.length).to.equal(2)
    expect(agentMessages2[1]).to.deep.include(expectedMessage2)
  })
})
