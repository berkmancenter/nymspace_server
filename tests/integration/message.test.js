const setupTestDB = require('../utils/setupTestDB');
const { messageOne, insertMessages, messagePost } = require('../fixtures/message.fixture');
const app = require('../../src/app');
const request = require('supertest');
const { insertUsers, registeredUser, userOne } = require('../fixtures/user.fixture');
const { registeredUserAccessToken, userOneAccessToken } = require('../fixtures/token.fixture');
const httpStatus = require('http-status');
const Message = require('../../src/models/message.model');
const { insertTopics, publicTopic } = require('../fixtures/topic.fixture');
const { threadOne, insertThreads } = require('../fixtures/thread.fixture');

setupTestDB();

describe('Message routes', () => {
    describe('POST /v1/messages/:threadId/upVote', () => {
        test('should return 200 and increment upVote count for message', async () => {
            await insertUsers([registeredUser, userOne]);
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/upVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            const msg = await Message.findById(messageOne._id);
            expect(msg.upVotes).toHaveLength(1);
        });

        test('should return 400 because user cannot vote for their own message', async () => {
            await insertUsers([registeredUser]);
            await insertMessages([messageOne]);
            console.log(messageOne._id);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/upVote`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });


        test('should return 400 because user has already voted for message', async () => {
            await insertUsers([registeredUser, userOne]);
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/upVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            await request(app)
                .post(`/v1/messages/${messageOne._id}/upVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('POST /v1/messages/:threadId/downVote', () => {
        test('should return 200 and increment downVote count for message', async () => {
            await insertUsers([registeredUser, userOne]);
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/downVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            const msg = await Message.findById(messageOne._id);
            expect(msg.downVotes).toHaveLength(1);
        });

        test('should return 400 because user cannot vote for their own message', async () => {
            await insertUsers([registeredUser]);
            await insertMessages([messageOne]);
            console.log(messageOne._id);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/downVote`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
        });

        test('should return 400 because user has already voted for message', async () => {
            await insertUsers([registeredUser, userOne]);
            await insertMessages([messageOne]);
            await request(app)
                .post(`/v1/messages/${messageOne._id}/downVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.OK);

            await request(app)
                .post(`/v1/messages/${messageOne._id}/downVote`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(httpStatus.BAD_REQUEST);
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