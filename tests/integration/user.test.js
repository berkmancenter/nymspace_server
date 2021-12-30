const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User } = require('../../src/models');
const { insertUsers, registeredUser, userOne } = require('../fixtures/user.fixture');
const { registeredUserAccessToken, userOneAccessToken } = require('../fixtures/token.fixture');
const { insertMessages, messageOne } = require('../fixtures/message.fixture');
const userService = require('../../src/services/user.service');

const createPseudo = () => {
  return {
    _id: mongoose.Types.ObjectId(),
    token: faker.datatype.uuid(),
    pseudonym: faker.name.findName(),
    active: false,
    isDeleted: false,
  };
};

const createVote = () => {
  return {
    _id: mongoose.Types.ObjectId(),
    owner: mongoose.Types.ObjectId(),
  };
};

setupTestDB();

describe('User routes', () => {
  describe('POST v1/users/pseudonyms', () => {
    let newPseudo;
    beforeEach(async () => {
      newPseudo = {
        token: userService.newToken(),
        pseudonym: await userService.newPseudonym(),
      };
    });

    test('should return 201 and successfully create pseudonym', async () => {
      await insertUsers([registeredUser]);
      const ret = await request(app)
        .post('/v1/users/pseudonyms')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(newPseudo)
        .expect(httpStatus.CREATED);

      const activePseudo = ret.body.find((x) => x.active);
      expect(activePseudo.token).toBe(newPseudo.token);
    });

    test('should return 200 and activate pseudonym', async () => {
      await insertUsers([registeredUser]);
      await request(app)
        .post('/v1/users/pseudonyms')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send(newPseudo);

      const ret = await request(app)
        .put('/v1/users/pseudonyms/activate')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({
          token: registeredUser.pseudonyms[0].token,
        })
        .expect(httpStatus.OK);

      expect(ret.body).toHaveLength(2);
      const activePseudo = ret.body.find((x) => x.active);
      expect(activePseudo.token).toBe(registeredUser.pseudonyms[0].token);
    });

    test('should return 500 if user already has 5 pseudonyms', async () => {
      userOne.pseudonyms = [];
      for (let x = 0; x < 5; x++) {
        userOne.pseudonyms.push(createPseudo());
      }

      await insertUsers([userOne]);
      await request(app)
        .post('/v1/users/pseudonyms')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newPseudo)
        .expect(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('GET v1/users/pseudonyms', () => {
    test('should return 200 and with pseudonyms as body', async () => {
      await insertUsers([registeredUser]);
      const ret = await request(app)
        .get('/v1/users/pseudonyms')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(ret.body).toHaveLength(1);
    });
  });

  describe('DELETE v1/users/pseudonyms/:pseudonymId', () => {
    test('should return 200 and hard delete Pseudonym without messages', async () => {
      await insertUsers([registeredUser]);
      const pseudoId = registeredUser.pseudonyms[0]._id;
      await request(app)
        .delete(`/v1/users/pseudonyms/${pseudoId}`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      const user = await User.findById(registeredUser._id);
      expect(user.pseudonyms).toHaveLength(0);
    });

    test('should return 200 and soft delete Pseudonym with messages', async () => {
      await insertUsers([registeredUser]);
      const pseudoId = registeredUser.pseudonyms[0]._id;
      await insertMessages([messageOne]);
      await request(app)
        .delete(`/v1/users/pseudonyms/${pseudoId}`)
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      const user = await User.findById(registeredUser._id);
      expect(user.pseudonyms).toHaveLength(1);
      expect(user.pseudonyms[0].isDeleted).toBe(true);
    });
  });

  describe('PUT v1/users/', () => {
    let email;
    let username;
    let password;
    beforeEach(async () => {
      email = faker.internet.email().toLowerCase();
      username = faker.internet.userName();
      password = faker.internet.password();
      await insertUsers([registeredUser]);
    });

    test('should return 200 and successfully update the user', async () => {
      await request(app)
        .put('/v1/users')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({
          userId: registeredUser._id,
          email,
          username,
          password,
        })
        .expect(httpStatus.OK);

      const user = await User.findById(registeredUser._id);
      expect(user.email).toEqual(email);
      expect(user.username).toEqual(username);
      expect(user.password).toEqual(password);
    });

    test('should return 400 if userId is not sent in request body', async () => {
      await request(app)
        .put('/v1/users')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({
          email,
          username,
          password,
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if userId is not found in db', async () => {
      await request(app)
        .put('/v1/users')
        .set('Authorization', `Bearer ${registeredUserAccessToken}`)
        .send({
          userId: mongoose.Types.ObjectId(),
          email,
          username,
          password,
        })
        .expect(httpStatus.NOT_FOUND);
    });
  });
});

describe('User service', () => {
  describe('goodReputation()', () => {
    beforeEach(() => {
      // Add five upvotes
      messageOne.upVotes = [];
      for (let x = 0; x < 5; x++) {
        messageOne.upVotes.push(createVote());
      }
    });

    test('should return true if user vote score < -5 and account is more than 1 week old', async () => {
      // Set created date to > week ago
      const d = new Date();
      d.setDate(d.getDate() - 8);
      registeredUser.createdAt = d.toISOString();
      await insertUsers([registeredUser]);
      await insertMessages([messageOne]);

      registeredUser.id = registeredUser._id;
      const goodReputation = await userService.goodReputation(registeredUser);
      expect(goodReputation).toBe(true);
    });

    test('should return false if user vote score < -5', async () => {
      // Set created date to > week ago
      const d = new Date();
      d.setDate(d.getDate() - 8);
      registeredUser.createdAt = d.toISOString();
      await insertUsers([registeredUser]);
      messageOne.downVotes = [];
      // Add eleven downvotes
      for (let x = 0; x < 11; x++) {
        messageOne.downVotes.push(createVote());
      }
      await insertMessages([messageOne]);
      registeredUser.id = registeredUser._id;

      const goodReputation = await userService.goodReputation(registeredUser);
      expect(goodReputation).toBe(false);
    });

    test('should return false if user account is less than one week old', async () => {
      // Set created date to > week ago
      const d = new Date();
      registeredUser.createdAt = d.toISOString();
      await insertUsers([registeredUser]);
      await insertMessages([messageOne]);
      registeredUser.id = registeredUser._id;

      const goodReputation = await userService.goodReputation(registeredUser);
      expect(goodReputation).toBe(false);
    });

    test('should return false if user account is less than one week old user vote score < -5', async () => {
      // Set created date to > week ago
      const d = new Date();
      registeredUser.createdAt = d.toISOString();
      await insertUsers([registeredUser]);
      messageOne.downVotes = [];
      // Add eleven downvotes
      for (let x = 0; x < 11; x++) {
        messageOne.downVotes.push(createVote());
      }
      await insertMessages([messageOne]);
      registeredUser.id = registeredUser._id;

      const goodReputation = await userService.goodReputation(registeredUser);
      expect(goodReputation).toBe(false);
    });
  });
});

// Todo: fix/refactor these tests from previous version

// describe('User routes', () => {
//   describe('POST /v1/users', () => {
//     let newUser;

//     beforeEach(() => {
//       newUser = {
//         name: faker.name.findName(),
//         email: faker.internet.email().toLowerCase(),
//         password: 'password1',
//         role: 'user',
//       };
//     });

//     test('should return 201 and successfully create new user if data is ok', async () => {
//       await insertUsers([admin]);

//       const res = await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.CREATED);

//       expect(res.body).not.toHaveProperty('password');
//       expect(res.body).toEqual({
//         id: expect.anything(),
//         name: newUser.name,
//         email: newUser.email,
//         role: newUser.role,
//         isEmailVerified: false,
//       });

//       const dbUser = await User.findById(res.body.id);
//       expect(dbUser).toBeDefined();
//       expect(dbUser.password).not.toBe(newUser.password);
//       expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: newUser.role, isEmailVerified: false });
//     });

//     test('should be able to create an admin as well', async () => {
//       await insertUsers([admin]);
//       newUser.role = 'admin';

//       const res = await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.CREATED);

//       expect(res.body.role).toBe('admin');

//       const dbUser = await User.findById(res.body.id);
//       expect(dbUser.role).toBe('admin');
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await request(app).post('/v1/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 error if logged in user is not admin', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 400 error if email is invalid', async () => {
//       await insertUsers([admin]);
//       newUser.email = 'invalidEmail';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if email is already used', async () => {
//       await insertUsers([admin, userOne]);
//       newUser.email = userOne.email;

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if password length is less than 8 characters', async () => {
//       await insertUsers([admin]);
//       newUser.password = 'passwo1';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if password does not contain both letters and numbers', async () => {
//       await insertUsers([admin]);
//       newUser.password = 'password';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);

//       newUser.password = '1111111';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if role is neither user nor admin', async () => {
//       await insertUsers([admin]);
//       newUser.role = 'invalid';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });

//   describe('GET /v1/users', () => {
//     test('should return 200 and apply the default query options', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(3);
//       expect(res.body.results[0]).toEqual({
//         id: userOne._id.toHexString(),
//         name: userOne.name,
//         email: userOne.email,
//         role: userOne.role,
//         isEmailVerified: userOne.isEmailVerified,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       await request(app).get('/v1/users').send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 if a non-admin is trying to access all users', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should correctly apply filter on name field', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ name: userOne.name })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 1,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].id).toBe(userOne._id.toHexString());
//     });

//     test('should correctly apply filter on role field', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ role: 'user' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 2,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].id).toBe(userOne._id.toHexString());
//       expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
//     });

//     test('should correctly sort the returned array if descending sort param is specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ sortBy: 'role:desc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(3);
//       expect(res.body.results[0].id).toBe(userOne._id.toHexString());
//       expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
//       expect(res.body.results[2].id).toBe(admin._id.toHexString());
//     });

//     test('should correctly sort the returned array if ascending sort param is specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ sortBy: 'role:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(3);
//       expect(res.body.results[0].id).toBe(admin._id.toHexString());
//       expect(res.body.results[1].id).toBe(userOne._id.toHexString());
//       expect(res.body.results[2].id).toBe(userTwo._id.toHexString());
//     });

//     test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ sortBy: 'role:desc,name:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(3);

//       const expectedOrder = [userOne, userTwo, admin].sort((a, b) => {
//         if (a.role < b.role) {
//           return 1;
//         }
//         if (a.role > b.role) {
//           return -1;
//         }
//         return a.name < b.name ? -1 : 1;
//       });

//       expectedOrder.forEach((user, index) => {
//         expect(res.body.results[index].id).toBe(user._id.toHexString());
//       });
//     });

//     test('should limit returned array if limit param is specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 1,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(2);
//       expect(res.body.results[0].id).toBe(userOne._id.toHexString());
//       expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
//     });

//     test('should return the correct page if page and limit params are specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ page: 2, limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toEqual({
//         results: expect.any(Array),
//         page: 2,
//         limit: 2,
//         totalPages: 2,
//         totalResults: 3,
//       });
//       expect(res.body.results).toHaveLength(1);
//       expect(res.body.results[0].id).toBe(admin._id.toHexString());
//     });
//   });

//   describe('GET /v1/users/:userId', () => {
//     test('should return 200 and the user object if data is ok', async () => {
//       await insertUsers([userOne]);

//       const res = await request(app)
//         .get(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).not.toHaveProperty('password');
//       expect(res.body).toEqual({
//         id: userOne._id.toHexString(),
//         email: userOne.email,
//         name: userOne.name,
//         role: userOne.role,
//         isEmailVerified: userOne.isEmailVerified,
//       });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);

//       await request(app).get(`/v1/users/${userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 error if user is trying to get another user', async () => {
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get(`/v1/users/${userTwo._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 200 and the user object if admin is trying to get another user', async () => {
//       await insertUsers([userOne, admin]);

//       await request(app)
//         .get(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);
//     });

//     test('should return 400 error if userId is not a valid mongo id', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .get('/v1/users/invalidId')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if user is not found', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .get(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('DELETE /v1/users/:userId', () => {
//     test('should return 204 if data is ok', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .delete(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NO_CONTENT);

//       const dbUser = await User.findById(userOne._id);
//       expect(dbUser).toBeNull();
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);

//       await request(app).delete(`/v1/users/${userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 error if user is trying to delete another user', async () => {
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .delete(`/v1/users/${userTwo._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 204 if admin is trying to delete another user', async () => {
//       await insertUsers([userOne, admin]);

//       await request(app)
//         .delete(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.NO_CONTENT);
//     });

//     test('should return 400 error if userId is not a valid mongo id', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .delete('/v1/users/invalidId')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if user already is not found', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .delete(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('PATCH /v1/users/:userId', () => {
//     test('should return 200 and successfully update user if data is ok', async () => {
//       await insertUsers([userOne]);
//       const updateBody = {
//         name: faker.name.findName(),
//         email: faker.internet.email().toLowerCase(),
//         password: 'newPassword1',
//       };

//       const res = await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);

//       expect(res.body).not.toHaveProperty('password');
//       expect(res.body).toEqual({
//         id: userOne._id.toHexString(),
//         name: updateBody.name,
//         email: updateBody.email,
//         role: 'user',
//         isEmailVerified: false,
//       });

//       const dbUser = await User.findById(userOne._id);
//       expect(dbUser).toBeDefined();
//       expect(dbUser.password).not.toBe(updateBody.password);
//       expect(dbUser).toMatchObject({ name: updateBody.name, email: updateBody.email, role: 'user' });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app).patch(`/v1/users/${userOne._id}`).send(updateBody).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 if user is updating another user', async () => {
//       await insertUsers([userOne, userTwo]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/${userTwo._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 200 and successfully update user if admin is updating another user', async () => {
//       await insertUsers([userOne, admin]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);
//     });

//     test('should return 404 if admin is updating another user that is not found', async () => {
//       await insertUsers([admin]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should return 400 error if userId is not a valid mongo id', async () => {
//       await insertUsers([admin]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/invalidId`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 if email is invalid', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { email: 'invalidEmail' };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 if email is already taken', async () => {
//       await insertUsers([userOne, userTwo]);
//       const updateBody = { email: userTwo.email };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should not return 400 if email is my email', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { email: userOne.email };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);
//     });

//     test('should return 400 if password length is less than 8 characters', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { password: 'passwo1' };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 if password does not contain both letters and numbers', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { password: 'password' };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);

//       updateBody.password = '11111111';

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });
// });
