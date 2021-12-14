const setupTestDB = require('../utils/setupTestDB');
const app = require('../../src/app');
const request = require('supertest');
const { insertUsers, registeredUser } = require('../fixtures/user.fixture');
const { registeredUserAccessToken } = require('../fixtures/token.fixture');
const httpStatus = require('http-status');
const { topicPost, privateTopic, insertTopics, getRandomInt } = require('../fixtures/topic.fixture');
const faker = require('faker');

setupTestDB();

describe('Topic routes', () => {
    describe('POST /v1/topics/', () => {
        test('should return 201 and create a topic', async () => {
            await insertUsers([registeredUser]);
            await request(app)
                .post(`/v1/topics`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send(topicPost)
                .expect(httpStatus.CREATED);
        });

        test('should return 400 if missing a required field', async () => {
            await insertUsers([registeredUser]);
            const badPost = topicPost;
            badPost.private = undefined;
            await request(app)
                .post(`/v1/topics`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send(topicPost)
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('POST /v1/topics/auth', () => {
        test('should return 200 if passcode is correct', async () => {
            await insertUsers([registeredUser]);
            await insertTopics([privateTopic]);
            await request(app)
                .post(`/v1/topics/auth`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send({
                    topicId: privateTopic._id,
                    passcode: privateTopic.passcode
                })
                .expect(httpStatus.OK);
        });

        test('should return 401 if passcode is invalid', async () => {
            await insertUsers([registeredUser]);
            await insertTopics([privateTopic]);
            // Note: once in a blue moon, this could produce a false positive
            const badPasscode = getRandomInt(1000000, 9999999);
            await request(app)
                .post(`/v1/topics/auth`)
                .set('Authorization', `Bearer ${registeredUserAccessToken}`)
                .send({
                    topicId: privateTopic._id,
                    passcode: badPasscode
                })
                .expect(httpStatus.UNAUTHORIZED);
        });
    });
});