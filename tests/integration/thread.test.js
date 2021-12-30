const request = require('supertest');
const httpStatus = require('http-status');
const faker = require('faker');
const setupTestDB = require('../utils/setupTestDB');
const app = require('../../src/app');
const { insertUsers, userOne } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');
const { insertTopics } = require('../fixtures/topic.fixture');
const { threadOne, threadTwo, insertThreads, publicTopic, privateTopic } = require('../fixtures/thread.fixture');
const { messageOne, messageTwo, messageThree, insertMessages } = require('../fixtures/message.fixture');

setupTestDB();

describe('Thread routes', () => {
  beforeEach(async () => {
    await insertUsers([userOne]);
    await insertTopics([publicTopic, privateTopic]);
    await insertMessages([messageOne, messageTwo, messageThree]);
    threadOne.messages = [messageOne];
    threadTwo.messages = [messageTwo, messageThree];
    await insertThreads([threadOne, threadTwo]);
  });

  describe('POST /v1/threads/', () => {
    test('should return 200 and body should be all threads with message counts', async () => {
      const resp = await request(app)
        .get(`/v1/threads`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(resp.body.length).toEqual(2);

      const t1 = resp.body.find((x) => x.id === threadOne._id.toString());
      expect(t1.messageCount).toEqual(1);

      const t2 = resp.body.find((x) => x.id === threadTwo._id.toString());
      expect(t2.messageCount).toEqual(2);
    });
  });

  describe('POST /v1/threads/topic/:topicId', () => {
    test('should return 200 and body should be all threads for supplied topic', async () => {
      const resp = await request(app)
        .get(`/v1/threads/topic/${publicTopic._id.toString()}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(resp.body.length).toEqual(1);
      expect(resp.body[0].id).toEqual(threadOne._id.toString());
    });
  });

  describe('POST /v1/threads/userThreads', () => {
    test('should return 200 and body should be all topics for logged-in user', async () => {
      const resp = await request(app)
        .get(`/v1/threads/userThreads`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(resp.body.length).toEqual(2);
    });
  });
});
