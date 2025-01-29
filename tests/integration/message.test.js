const request = require('supertest')
const httpStatus = require('http-status')
const setupIntTest = require('../utils/setupIntTest')
const { messageOne, insertMessages, messagePost, messagePostTooLong } = require('../fixtures/message.fixture')
const app = require('../../src/app')
const { insertUsers, registeredUser, userOne } = require('../fixtures/user.fixture')
const { registeredUserAccessToken, userOneAccessToken } = require('../fixtures/token.fixture')
const Message = require('../../src/models/message.model')
const { insertTopics, newPublicTopic } = require('../fixtures/topic.fixture')
const { threadOne, insertThreads } = require('../fixtures/thread.fixture')

setupIntTest()
const publicTopic = newPublicTopic()

describe('Message routes', () => {
  describe('POST /v1/messages/:threadId/vote', () => {
    test('should return 200 and increment upVote count for message', async () => {
      await insertUsers([registeredUser, userOne])
      await insertMessages([messageOne])
      const ret = await request(app)
        .post(`/v1/messages/${messageOne._id}/vote`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ status: true, direction: 'up' })
        .expect(httpStatus.OK)

      expect(ret.body.upVotes).toHaveLength(1)
      expect(ret.body.downVotes).toBeDefined()

      const msg = await Message.findById(messageOne._id)
      expect(msg.upVotes).toHaveLength(1)
    })

    test('should return 400 because user cannot vote for their own message', async () => {
      await insertUsers([registeredUser])
      await insertMessages([messageOne])
      await request(app)
        .post(`/v1/messages/${messageOne._id}/vote`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({ status: true, direction: 'up' })
        .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 400 because user cant downvote after upvoting', async () => {
      await insertUsers([registeredUser, userOne])
      await insertMessages([messageOne])
      await request(app)
        .post(`/v1/messages/${messageOne._id}/vote`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ status: true, direction: 'up' })
        .expect(httpStatus.OK)

      await request(app)
        .post(`/v1/messages/${messageOne._id}/vote`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ status: true, direction: 'down' })
        .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 400 because user has already upvoted for message', async () => {
      await insertUsers([registeredUser, userOne])
      await insertMessages([messageOne])
      await request(app)
        .post(`/v1/messages/${messageOne._id}/vote`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ status: true, direction: 'up' })
        .expect(httpStatus.OK)

      await request(app)
        .post(`/v1/messages/${messageOne._id}/vote`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ status: true, direction: 'up' })
        .expect(httpStatus.BAD_REQUEST)
    })
  })

  describe('POST /v1/messages', () => {
    test('a message that is too long should return 400 and not create message', async () => {
      await insertUsers([registeredUser])
      await insertTopics([publicTopic])
      await insertThreads([threadOne])
      await request(app)
        .post(`/v1/messages/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(messagePostTooLong)
        .expect(httpStatus.BAD_REQUEST)

      const msgs = await Message.find({ body: messagePostTooLong.body })
      expect(msgs.length).toBe(0)
    })

    test('should return 201 and create message', async () => {
      await insertUsers([registeredUser])
      await insertTopics([publicTopic])
      await insertThreads([threadOne])
      const res = await request(app)
        .post(`/v1/messages/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(messagePost)
        .expect(httpStatus.CREATED)

      const msgs = await Message.find({ id: res.id })
      expect(msgs.length).toBe(1)

      const msgsFromBody = await Message.find({ body: messagePost.body })
      expect(msgsFromBody.length).toBe(1)
    })

    test('should create message, and message should have current active pseudonym', async () => {
      const userRet = await insertUsers([registeredUser])
      await insertTopics([publicTopic])
      await insertThreads([threadOne])
      const res = await request(app)
        .post(`/v1/messages/`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(messagePost)
        .expect(httpStatus.CREATED)

      const msgs = await Message.find({ id: res.id })
      expect(msgs[0].pseudonymId).toEqual(userRet[0].pseudonyms[0]._id)
    })
  })
})
