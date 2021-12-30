const setupTestDB = require('../utils/setupTestDB');
const { insertUsers, userOne } = require('../fixtures/user.fixture');
const { newPublicTopic, newPrivateTopic, insertTopics } = require('../fixtures/topic.fixture');
const { topicService, emailService } = require('../../src/services');
const Topic = require('../../src/models/topic.model');
const { Token } = require('../../src/models');
const { tokenTypes } = require('../../src/config/tokens');

setupTestDB();

let publicTopic;
let privateTopic;

beforeEach(() => {
    publicTopic = newPublicTopic();
    privateTopic = newPrivateTopic();
});

describe('Topic service methods', () => {
    describe('deleteOldTopics()', () => {
        // Set created date to 98 days ago
        let oldDate = "";
        beforeEach(() => {
            const d = new Date();
            d.setDate(d.getDate() - 98);
            oldDate = d.toISOString();
        });

        test('should delete topics older than 97 days', async () => {
            publicTopic.createdAt = oldDate;
            const d = new Date();
            d.setDate(d.getDate() - 96);
            privateTopic.createdAt = d.toISOString();
            await insertTopics([publicTopic, privateTopic]);

            const ret = await topicService.deleteOldTopics();
            expect(ret).toHaveLength(1);
            expect(ret[0]._id).toEqual(publicTopic._id);

            const dbPublicTopic = await Topic.findById(publicTopic._id);
            expect(dbPublicTopic.isDeleted).toBe(true);

            const dbPrivateTopic = await Topic.findById(privateTopic._id);
            expect(dbPrivateTopic.isDeleted).toBe(false);
        });

        test('should not delete topics marked as archived and deleted', async () => {
            publicTopic.createdAt = oldDate;
            privateTopic.createdAt = oldDate;
            publicTopic.archived = true;
            privateTopic.isDeleted = true;

            await insertTopics([publicTopic, privateTopic]);

            const ret = await topicService.deleteOldTopics();
            expect(ret).toHaveLength(0);

            const dbPublicTopic = await Topic.findById(publicTopic._id);
            expect(dbPublicTopic.isDeleted).toBe(false);
        });
    });

    describe('emailUsersToArchive()', () => {
        // Set created date to 98 days ago
        let oldDate = "";
        beforeEach(async() => {
            const d = new Date();
            d.setDate(d.getDate() - 91);
            oldDate = d.toISOString();

            await insertUsers([userOne]);
        });

        test('should generate token, email user, and mark as isArchiveNotified = true', async () => {
            jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
            const sendArchiveEmailSpy = jest.spyOn(emailService, 'sendArchiveTopicEmail');

            publicTopic.createdAt = oldDate;
            const d = new Date();
            d.setDate(d.getDate() - 88);
            privateTopic.createdAt = d.toISOString();
            await insertTopics([publicTopic, privateTopic]);

            const ret = await topicService.emailUsersToArchive();
            expect(ret).toHaveLength(1);
            expect(ret[0]._id).toEqual(publicTopic._id);

            expect(sendArchiveEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(Object), expect.any(String));
            const token = sendArchiveEmailSpy.mock.calls[0][3];
            const dbToken = await Token.findOne({ token: token });
            expect(dbToken).toBeDefined();

            const dbPublicTopic = await Topic.findById(publicTopic._id);
            expect(dbPublicTopic.isArchiveNotified).toBe(true);
        });

        test('should not send email if topic is not archivable', async () => {
            publicTopic.createdAt = oldDate;
            publicTopic.achivable = false;

            await insertTopics([publicTopic]);

            const ret = await topicService.deleteOldTopics();
            expect(ret).toHaveLength(0);

            const dbPublicTopic = await Topic.findById(publicTopic._id);
            expect(dbPublicTopic.isArchiveNotified).toBe(false);
        });

        test('should not send email if email is already sent', async () => {
            publicTopic.createdAt = oldDate;
            publicTopic.isArchiveNotified = true;

            await insertTopics([publicTopic]);

            const ret = await topicService.deleteOldTopics();
            expect(ret).toHaveLength(0);
        });

        test('should not send email if topic is deleted or archived', async () => {
            publicTopic.createdAt = oldDate;
            privateTopic.createdAt = oldDate;
            publicTopic.archived = true;
            privateTopic.isDeleted = true;

            await insertTopics([publicTopic, privateTopic]);

            const ret = await topicService.deleteOldTopics();
            expect(ret).toHaveLength(0);

            const dbPublicTopic = await Topic.findById(publicTopic._id);
            expect(dbPublicTopic.isArchiveNotified).toBe(false);

            const dbPrivateTopic = await Topic.findById(privateTopic._id);
            expect(dbPrivateTopic.isArchiveNotified).toBe(false);
        });
    });
});