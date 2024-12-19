const request = require('supertest')
const httpStatus = require('http-status')
const faker = require('faker')
const slugify = require('slugify')
const mongoose = require('mongoose')
const setupIntTest = require('../utils/setupIntTest')
const app = require('../../src/app')
const { insertUsers, registeredUser, userOne } = require('../fixtures/user.fixture')
const { registeredUserAccessToken, userOneAccessToken } = require('../fixtures/token.fixture')
const { topicPost, newPublicTopic, newPrivateTopic, insertTopics, getRandomInt } = require('../fixtures/topic.fixture')
const { tokenService } = require('../../src/services')
const Topic = require('../../src/models/topic.model')
const { tokenTypes } = require('../../src/config/tokens')
const Token = require('../../src/models/token.model')
const { insertFollowers } = require('../fixtures/follower.fixture')
const { threadThree, insertThreads } = require('../fixtures/thread.fixture')
const { messageFour, invisibleMessage, insertMessages } = require('../fixtures/message.fixture')

setupIntTest()

const publicTopic = newPublicTopic()
const privateTopic = newPrivateTopic()

describe('Topic routes', () => {
  describe('POST /v1/topics/', () => {
    test('should return 201 and create a topic', async () => {
      await insertUsers([registeredUser])
      await request(app)
        .post(`/v1/topics`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(topicPost)
        .expect(httpStatus.CREATED)
    })

    test('should return 400 if missing a required field', async () => {
      await insertUsers([registeredUser])
      const badPost = topicPost
      badPost.private = undefined
      await request(app)
        .post(`/v1/topics`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(topicPost)
        .expect(httpStatus.BAD_REQUEST)
    })
  })

  describe('DELETE /v1/topics/:topicId', () => {
    test('should return 200 and soft delete a topic', async () => {
      await insertUsers([registeredUser])
      await insertTopics([publicTopic, privateTopic])
      await request(app)
        .delete(`/v1/topics/${privateTopic._id}`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send()
        .expect(httpStatus.OK)

      const topicDoc = await Topic.findOne({ _id: privateTopic._id })
      expect(topicDoc.isDeleted).toBe(true)
    })

    test('should return 400 if missing topic id', async () => {
      await request(app)
        .delete(`/v1/topics/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND)
    })

    test('should return 404 if topic is not found', async () => {
      await insertUsers([registeredUser])
      await request(app)
        .delete(`/v1/topics/${privateTopic._id}`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND)
    })
  })

  describe('PUT /v1/topics/', () => {
    test('should return 200 and update topic using merge strategy', async () => {
      await insertUsers([registeredUser])
      await insertTopics([publicTopic])
      const topicBody = {}
      topicBody.id = publicTopic._id
      topicBody.name = 'favorite dogs'
      topicBody.archivable = true
      await request(app)
        .put(`/v1/topics/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(topicBody)
        .expect(httpStatus.OK)

      const topicDoc = await Topic.findOne({ _id: publicTopic._id })
      // Check that properties sent in request are updated
      expect(topicDoc.name).toEqual(topicBody.name)
      expect(topicDoc.slug).toEqual(slugify(topicBody.name))
      expect(topicDoc.archivable).toEqual(topicBody.archivable)
      // Check that property that was not sent in request is not missing or updated
      expect(topicDoc.votingAllowed).toBeDefined()
      expect(topicDoc.votingAllowed).toEqual(publicTopic.votingAllowed)
      expect(topicDoc.threadCreationAllowed).toBeDefined()
      expect(topicDoc.threadCreationAllowed).toEqual(publicTopic.threadCreationAllowed)
    })

    test('should return 400 if missing topic id', async () => {
      await insertUsers([registeredUser])
      const topicBody = { name: 'favorite dogs' }
      await request(app)
        .put(`/v1/topics/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(topicBody)
        .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 400 if a private unallowed property is sent', async () => {
      await insertTopics([publicTopic])
      await insertUsers([registeredUser])
      const topicBody = {}
      topicBody.id = publicTopic._id
      topicBody.name = 'favorite dogs'
      topicBody.isArchiveNotified = true
      await request(app)
        .put(`/v1/topics/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(topicBody)
        .expect(httpStatus.BAD_REQUEST)
    })
  })

  describe('POST /v1/topics/auth', () => {
    test('should return 200 if passcode is correct', async () => {
      await insertUsers([registeredUser])
      await insertTopics([privateTopic])
      await request(app)
        .post(`/v1/topics/auth`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({
          topicId: privateTopic._id,
          passcode: privateTopic.passcode
        })
        .expect(httpStatus.OK)
    })

    test('should return 401 if passcode is invalid', async () => {
      await insertUsers([registeredUser])
      await insertTopics([privateTopic])
      // Note: once in a blue moon, this could produce a false positive
      const badPasscode = getRandomInt(1000000, 9999999)
      await request(app)
        .post(`/v1/topics/auth`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({
          topicId: privateTopic._id,
          passcode: badPasscode
        })
        .expect(httpStatus.UNAUTHORIZED)
    })
  })

  describe('POST /v1/topics/archive', () => {
    let archiveToken
    beforeEach(async () => {
      await insertUsers([userOne])
      await insertTopics([publicTopic])
      userOne.id = userOne._id
      archiveToken = await tokenService.generateArchiveTopicToken(userOne)
    })

    test('should return 200 and archive topic', async () => {
      await request(app)
        .post(`/v1/topics/archive`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          topicId: publicTopic._id,
          token: archiveToken
        })
        .expect(httpStatus.OK)

      const dbTopic = await Topic.findById(publicTopic._id)
      expect(dbTopic.archived).toBe(true)

      const dbTokenCount = await Token.countDocuments({ user: userOne._id, type: tokenTypes.ARCHIVE_TOPIC })
      expect(dbTokenCount).toBe(0)
    })

    test('should return 400 if missing a required field', async () => {
      await request(app)
        .post(`/v1/topics/archive`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          topicId: null,
          token: archiveToken
        })
        .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 500 if token is invalid', async () => {
      await request(app)
        .post(`/v1/topics/archive`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          topicId: publicTopic._id,
          token: faker.datatype.uuid()
        })
        .expect(httpStatus.INTERNAL_SERVER_ERROR)
    })
  })

  describe('POST /v1/topics/userTopics', () => {
    test('should return 200 and body should be all topics for logged-in user', async () => {
      await insertUsers([userOne])
      await insertTopics([publicTopic, privateTopic])
      const resp = await request(app)
        .get(`/v1/topics/userTopics`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK)

      expect(resp.body.length).toEqual(2)
    })

    test('should return 200 and threads should include followed', async () => {
      const newTopic = newPublicTopic()
      newTopic.owner = mongoose.Types.ObjectId()
      await insertUsers([userOne])
      await insertTopics([publicTopic, privateTopic, newTopic])
      const topicFollow = {
        _id: mongoose.Types.ObjectId(),
        user: userOne._id,
        topic: newTopic._id
      }
      await insertFollowers([topicFollow])
      const resp = await request(app)
        .get(`/v1/topics/userTopics`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK)

      expect(resp.body.length).toEqual(3)
    })

    test('should return 200 and include count of visible messages in threads', async () => {
      const newTopic = newPublicTopic()
      await insertUsers([userOne])
      privateTopic.threads.push(threadThree)
      await insertTopics([publicTopic, privateTopic, newTopic])
      await insertMessages([messageFour, invisibleMessage])

      threadThree.messages = [messageFour, invisibleMessage]
      threadThree.topic = privateTopic._id
      await insertThreads([threadThree])

      const resp = await request(app)
        .get(`/v1/topics/userTopics`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK)

      expect(resp.body.length).toEqual(3)
      const pt = resp.body.find((x) => x.id === privateTopic._id.toString())
      expect(pt.messageCount).toEqual(1)
    })
  })
})
