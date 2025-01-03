const request = require('supertest')
const httpStatus = require('http-status')
const setupIntTest = require('../utils/setupIntTest')
const app = require('../../src/app')
const config = require('../../src/config/config')

setupIntTest()

describe('Auth routes', () => {
  describe('GET /v1/docs', () => {
    test('should return 404 when running in production', async () => {
      config.env = 'production'
      await request(app).get('/v1/docs').expect(httpStatus.NOT_FOUND)
      config.env = process.env.NODE_ENV
    })
  })
})
