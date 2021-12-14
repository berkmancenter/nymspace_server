const setupTestDB = require('../utils/setupTestDB');
const { messageOne, insertMessages, messagePost } = require('../fixtures/message.fixture');
const app = require('../../src/app');
const request = require('supertest');
const { insertUsers, registeredUser } = require('../fixtures/user.fixture');
const { registeredUserAccessToken } = require('../fixtures/token.fixture');
const httpStatus = require('http-status');
const Message = require('../../src/models/message.model');
const { insertTopics, publicTopic } = require('../fixtures/topic.fixture');
const { threadOne, insertThreads } = require('../fixtures/thread.fixture');

setupTestDB();

describe('Message routes', () => {
    describe('POST /v1/messages/:threadId/upVote', () => {
        test('should return 200 and increment upVote count for message', async () => {
            const userRet = await insertUsers([registeredUser]);
            messageOne.pseudonymId = userRet[0].pseudonyms[0]._id;
            messageOne.pseudonym = userRet[0].pseudonyms[0].pseudonym;
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/upVote`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            const msg = await Message.findById(messageOne._id);
            expect(msg.upVotes).toBe(1);
        });
    });

    describe('POST /v1/messages/:threadId/downVote', () => {
        test('should return 200 and increment downVote count for message', async () => {
            const userRet = await insertUsers([registeredUser]);
            messageOne.pseudonymId = userRet[0].pseudonyms[0]._id;
            messageOne.pseudonym = userRet[0].pseudonyms[0].pseudonym;
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/downVote`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            const msg = await Message.findById(messageOne._id);
            expect(msg.downVotes).toBe(1);
        });
    });

    describe('POST /v1/messages', () => {
        test('should return 201 and create message', async () => {
            await insertUsers([registeredUser]);
            await insertTopics([publicTopic]);
            await insertThreads([threadOne]);
            const res =  await request(app)
                .post(`/v1/messages/`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send(messagePost)
                .expect(httpStatus.CREATED);

            const msgs = await Message.find({ id: res.id });
            expect(msgs.length).toBe(1);
        });

        test('should create message, and message should have current active pseudonym', async () => {
            const userRet = await insertUsers([registeredUser]);
            await insertTopics([publicTopic]);
            await insertThreads([threadOne]);
            const res =  await request(app)
                .post(`/v1/messages/`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send(messagePost)
                .expect(httpStatus.CREATED);

            const msgs = await Message.find({ id: res.id });
            expect(msgs[0].pseudonymId).toEqual(userRet[0].pseudonyms[0]._id);
        });
    });
});