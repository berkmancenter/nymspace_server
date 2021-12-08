const setupTestDB = require('../utils/setupTestDB');
const { messageOne, insertMessages, messageTwo } = require('../fixtures/message.fixture');
const app = require('../../src/app');
const request = require('supertest');
const { insertUsers, userOne } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');
const httpStatus = require('http-status');
const Message = require('../../src/models/message.model');
const { insertTopics, topicOne } = require('../fixtures/topic.fixture');
const { threadOne, insertThreads } = require('../fixtures/thread.fixture');

setupTestDB();

describe('Message routes', () => {
    describe('POST /v1/messages/:threadId/upVote', () => {
        test('should return 200 and increment upVote count for message', async () => {
            await insertUsers([userOne]);
            const messageId = messageOne._id;
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageId}/upVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            const msg = await Message.findById(messageId);
            expect(msg.upVotes).toBe(1);
        });
    });

    describe('POST /v1/messages/:threadId/downVote', () => {
        test('should return 200 and increment downVote count for message', async () => {
            await insertUsers([userOne]);
            const messageId = messageOne._id;
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageId}/downVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            const msg = await Message.findById(messageId);
            expect(msg.downVotes).toBe(1);
        });
    });

    describe('POST /v1/messages', () => {
        test('should return 201 and create message', async () => {
            await insertUsers([userOne]);
            await insertTopics([topicOne]);
            await insertThreads([threadOne]);
            const res =  await request(app)
                .post(`/v1/messages/`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(messageTwo)
                .expect(httpStatus.CREATED);

            const msgs = await Message.find({ id: res.id });
            expect(msgs.length).toBe(1);
        });
    });
});