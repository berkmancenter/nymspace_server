const mongoose = require('mongoose')
const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const { insertUsers, userOne, userTwo, admin, registeredUser } = require('../../fixtures/user.fixture')
const {
  userOneAccessToken,
  userTwoAccessToken,
  adminAccessToken,
  registeredUserAccessToken
} = require('../../fixtures/token.fixture')
const { insertTopics } = require('../../fixtures/topic.fixture')
const { pollTwoBody, privateTopic, getPollChoices } = require('../../fixtures/poll.fixture')
const config = require('../../../src/config/config')

// allow more time
jest.setTimeout(10000)

const BASE_API = '/v1/polls'

const CHOICE1_TEXT = 'Choice 1'
const CHOICE2_TEXT = 'Choice 2'

describe(`Poll API - Variant 2: ${pollTwoBody.title}`, () => {
  // we keep our database between tests and perform a sequence of tests that should be evaluated in order
  beforeAll(async () => {
    // TODO: Why is the single test file being run multiple times? This is messing with our DB state
    // Remove this hack to preserve DB state by making DB name unique when that issue is resolved
    const uuidStr = new mongoose.Types.ObjectId().toString()
    const dbUrlForFile = `${config.mongoose.url}-${uuidStr}`
    await mongoose.connect(dbUrlForFile, config.mongoose.options)
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()))
    await insertUsers([userOne, userTwo, admin, registeredUser])
    await insertTopics([privateTopic])
  })

  afterAll(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()))
    await mongoose.disconnect()
  })

  let pollId
  let pollData

  test('Create a poll', async () => {
    const body = { ...pollTwoBody }
    const resp = await request(app)
      .post(BASE_API)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send(body)
      .expect(httpStatus.CREATED)

    // used in other tests
    pollId = resp.body.id

    pollData = { ...body }
    delete pollData.topicId
    delete pollData.owner
    delete pollData.choices

    expect(resp.body).toMatchObject(pollData)
    expect(resp.body.topic.id).toMatch(pollTwoBody.topicId)
    expect(resp.body.owner).toMatch(userOne._id.toString())
  })

  test('User 1 responds to poll with unavailable choice', async () => {
    const body = {
      choice: {
        text: 'NEW CHOICE NOT ALREADY AVAILABLE'
      }
    }

    const resp = await request(app)
      .post(`${BASE_API}/${pollId}/respond`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send(body)
      .expect(httpStatus.BAD_REQUEST)

    expect(resp.body.message.includes('Error: Only existing poll choices are allowed')).toBe(true)
  })

  test('User 1 checks responses before participating', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}/responses`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .expect(httpStatus.FORBIDDEN)

    expect(resp.body.message.includes('Error: You have not participated in this poll')).toBe(true)
  })

  test('User 1 responds to poll choice 1', async () => {
    const body = {
      choice: {
        text: CHOICE1_TEXT
      }
    }

    const resp = await request(app)
      .post(`${BASE_API}/${pollId}/respond`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send(body)
      .expect(httpStatus.OK)

    const pollChoices = await getPollChoices(pollId)
    const pollChoice1 = pollChoices.find((c) => c.text === CHOICE1_TEXT)

    const expectedResp = {
      poll: pollId,
      choice: pollChoice1._id.toString(),
      owner: userOne._id.toString()
    }

    expect(resp.body).toMatchObject(expectedResp)
  })

  test('User 1 inspects poll', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .expect(httpStatus.OK)

    expect(resp.body).toMatchObject(pollData)
    expect(resp.body.choices.length).toBe(3)
    expect(resp.body.choices[0].text).toBe(CHOICE1_TEXT)
    expect(resp.body.choices[1].text).toBe(CHOICE2_TEXT)
  })

  test('User 2 responds to poll choice 2', async () => {
    const body = {
      choice: {
        text: CHOICE2_TEXT
      }
    }

    const resp = await request(app)
      .post(`${BASE_API}/${pollId}/respond`)
      .set('Authorization', `Bearer ${userTwoAccessToken}`)
      .send(body)
      .expect(httpStatus.OK)

    const pollChoices = await getPollChoices(pollId)
    const pollChoice = pollChoices.find((c) => c.text === CHOICE2_TEXT)

    const expectedResp = {
      poll: pollId,
      choice: pollChoice._id.toString(),
      owner: userTwo._id.toString()
    }

    expect(resp.body).toMatchObject(expectedResp)
  })

  test('User 2 checks responses before threshold has been reached', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}/responses`)
      .set('Authorization', `Bearer ${userTwoAccessToken}`)
      .expect(httpStatus.FORBIDDEN)

    expect(resp.body.message.includes('Error: Threshold has not been reached')).toBe(true)
  })

  test('User 1 responds to poll choice 2', async () => {
    const body = {
      choice: {
        text: CHOICE2_TEXT
      }
    }

    const resp = await request(app)
      .post(`${BASE_API}/${pollId}/respond`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .send(body)
      .expect(httpStatus.BAD_REQUEST)

    expect(resp.body.message.includes('Error: Only one response is allowed for this poll')).toBe(true)
  })

  test('Admin responds to poll choice 1', async () => {
    const body = {
      choice: {
        text: CHOICE1_TEXT
      }
    }

    const resp = await request(app)
      .post(`${BASE_API}/${pollId}/respond`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(body)
      .expect(httpStatus.OK)

    const pollChoices = await getPollChoices(pollId)
    const pollChoice = pollChoices.find((c) => c.text === CHOICE1_TEXT)

    const expectedResp = {
      poll: pollId,
      choice: pollChoice._id.toString(),
      owner: admin._id.toString()
    }

    expect(resp.body).toMatchObject(expectedResp)
  })

  test('User 1 checks responses after poll threshold is reached', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}/responses`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .expect(httpStatus.OK)

    expect(resp.body.length).toBe(2)
    expect(resp.body[0].owner).toBe(userOne.username)
    expect(resp.body[0].choice).toBe(CHOICE1_TEXT)
    expect(resp.body[1].owner).toBe(admin.username)
    expect(resp.body[1].choice).toBe(CHOICE1_TEXT)
  })

  test('User 2 checks responses after threshold is reached', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}/responses`)
      .set('Authorization', `Bearer ${userTwoAccessToken}`)
      .expect(httpStatus.OK)

    expect(resp.body.length).toBe(2)
    expect(resp.body[0].owner).toBe(userOne.username)
    expect(resp.body[0].choice).toBe(CHOICE1_TEXT)
    expect(resp.body[1].owner).toBe(admin.username)
    expect(resp.body[1].choice).toBe(CHOICE1_TEXT)
  })

  test('User 2 inspects poll', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}`)
      .set('Authorization', `Bearer ${userTwoAccessToken}`)
      .expect(httpStatus.OK)

    expect(resp.body).toMatchObject(pollData)
  })

  test('User 1 checks response counts after poll is closed', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}/responseCounts`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .expect(httpStatus.FORBIDDEN)

    expect(resp.body.message.includes('Error: Response counts are not visible for this poll')).toBe(true)
  })

  test('Non-participating user checks responses after poll is closed', async () => {
    const resp = await request(app)
      .get(`${BASE_API}/${pollId}/responses`)
      .set('Authorization', `Bearer ${registeredUserAccessToken}`)
      .expect(httpStatus.FORBIDDEN)

    expect(resp.body.message.includes('Error: You have not participated in this poll')).toBe(true)
  })
})
