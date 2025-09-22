const request = require('supertest');
const mongoose = require('mongoose');

const DSAUser = require('../models/dsa/DSAUser');

const BASE_URL = process.env.DSA_API_BASE_URL || 'http://localhost:5001';

process.env.NODE_ENV = 'test';

describe('DSA API (read-only and submissions)', () => {
  let createdUserId;
  let problemId;

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://pawar:pawar@cluster0.hinu2hy.mongodb.net/collabquest?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (createdUserId) {
      await DSAUser.deleteOne({ _id: createdUserId });
    }
    await mongoose.connection.close();
  });

  test('GET /api/dsa/problems returns list with items array', async () => {
    const res = await request(BASE_URL).get('/api/dsa/problems').expect(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('total');
    if (res.body.items.length > 0) {
      problemId = res.body.items[0]._id;
    }
  });

  test('GET /api/dsa/problems/:id returns problem details when exists', async () => {
    if (!problemId) {
      return; // Skip if no problems seeded
    }
    const res = await request(BASE_URL).get(`/api/dsa/problems/${problemId}`).expect(200);
    expect(res.body).toHaveProperty('_id', problemId);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('difficulty');
  });

  test('POST /api/dsa/submissions creates a submission (happy path)', async () => {
    if (!problemId) {
      return; // Skip if no problems seeded
    }
    // Create a temporary DSA user
    const tempUser = await DSAUser.create({
      username: `apitester_${Date.now()}`,
      email: `apitester_${Date.now()}@example.com`,
      hashed_password: 'temporary_hash_value_min_length_20'
    });
    createdUserId = tempUser._id.toString();

    const res = await request(BASE_URL)
      .post('/api/dsa/submissions')
      .send({
        user_id: createdUserId,
        problem_id: problemId,
        code: 'print(42)',
        language: 'python'
      })
      .set('Content-Type', 'application/json')
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('status');
    expect(res.body.user_id).toBe(createdUserId);
    expect(res.body.problem_id).toBe(problemId);
  });

  test('GET /api/dsa/users/:userId/submissions returns submissions for user', async () => {
    if (!createdUserId) {
      return; // Skip if user could not be created
    }
    const res = await request(BASE_URL)
      .get(`/api/dsa/users/${createdUserId}/submissions`)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('POST /api/dsa/submissions validates inputs', async () => {
    const res = await request(BASE_URL)
      .post('/api/dsa/submissions')
      .send({})
      .set('Content-Type', 'application/json')
      .expect(400);
    expect(res.body).toHaveProperty('message');
  });
});


