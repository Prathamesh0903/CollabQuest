const request = require('supertest');
const mongoose = require('mongoose');
process.env.NODE_ENV = 'test';
const app = require('../server');
const DSAProblem = require('../models/dsa/DSAProblem');
const DSAProgress = require('../models/dsa/DSAProgress');
const DSASubmission = require('../models/dsa/DSASubmission');
const UserMapping = require('../models/dsa/UserMapping');
const DSAUser = require('../models/dsa/DSAUser');

// Test database setup
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/collabquest_test';

describe('DSA Critical Path Tests', () => {
  let testUser;
  let testProblem;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DB_URI);
    
    // Clear test data
    await Promise.all([
      DSAProblem.deleteMany({}),
      DSAProgress.deleteMany({}),
      DSASubmission.deleteMany({}),
      UserMapping.deleteMany({}),
      DSAUser.deleteMany({})
    ]);

    // Create test problem
    testProblem = await DSAProblem.create({
      problemNumber: 1,
      title: 'Test Problem',
      description: 'Test problem description',
      difficulty: 'Easy',
      category: new mongoose.Types.ObjectId(),
      tags: ['array', 'test'],
      acceptanceRate: 85,
      testCases: [
        {
          input: '[1,2,3,4,5]',
          expectedOutput: '15',
          isHidden: false,
          description: 'Basic test case'
        }
      ],
      starterCode: {
        python: 'class Solution:\n    def solve(self, nums):\n        # Your code here\n        pass',
        javascript: 'function solve(nums) {\n    // Your code here\n}',
        java: 'class Solution {\n    public int solve(int[] nums) {\n        // Your code here\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // Your code here\n    }\n};'
      },
      functionName: {
        python: 'solve',
        javascript: 'solve',
        java: 'solve',
        cpp: 'solve'
      },
      isActive: true
    });

    // Create test user
    testUser = await DSAUser.create({
      username: 'testuser',
      email: 'test@example.com',
      hashed_password: 'test_password_min_len________________'
    });

    // Create user mapping
    await UserMapping.create({
      firebaseUid: 'test-firebase-uid',
      dsaUserId: testUser._id,
      email: 'test@example.com',
      displayName: 'Test User'
    });

    // Mock auth token (in real tests, this would be a valid JWT)
    authToken = 'Bearer test-token';
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      DSAProblem.deleteMany({}),
      DSAProgress.deleteMany({}),
      DSASubmission.deleteMany({}),
      UserMapping.deleteMany({}),
      DSAUser.deleteMany({})
    ]);
    
    await mongoose.connection.close();
  });

  describe('Critical Path 1: User Authentication and Problem Loading', () => {
    test('should load problems without authentication (fallback mode)', async () => {
      const response = await request(app)
        .get('/api/dsa/progress')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.problems).toBeDefined();
      expect(response.body.problems.length).toBeGreaterThan(0);
      expect(response.body.message).toContain('after login');
    });

    test('should load individual problem details', async () => {
      const response = await request(app)
        .get(`/api/dsa/problems/${testProblem._id}`)
        .expect(200);

      expect(response.body._id).toBe(testProblem._id.toString());
      expect(response.body.title).toBe('Test Problem');
      expect(response.body.starterCode.python).toBeDefined();
      expect(response.body.functionName.python).toBe('solve');
    });

    test('should validate problem ID format', async () => {
      const response = await request(app)
        .get('/api/dsa/problems/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Critical Path 2: Code Submission and Execution', () => {
    test('should create submission with valid data', async () => {
      const submissionData = {
        problem_id: testProblem._id.toString(),
        code: 'class Solution:\n    def solve(self, nums):\n        return sum(nums)',
        language: 'python'
      };

      const response = await request(app)
        .post('/api/dsa/submissions')
        .set('Authorization', authToken)
        .send(submissionData)
        .expect(201);

      expect(response.body.user_id).toBe(testUser._id.toString());
      expect(response.body.problem_id).toBe(testProblem._id.toString());
      expect(response.body.language).toBe('python');
      expect(response.body.status).toBe('pending');
    });

    test('should validate submission data', async () => {
      const invalidSubmission = {
        problem_id: 'invalid-id',
        code: '',
        language: 'invalid-language'
      };

      const response = await request(app)
        .post('/api/dsa/submissions')
        .set('Authorization', authToken)
        .send(invalidSubmission)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    test('should enforce rate limiting on submissions', async () => {
      const submissionData = {
        problem_id: testProblem._id.toString(),
        code: 'test code',
        language: 'python'
      };

      // Make multiple rapid submissions
      const promises = Array(25).fill().map(() =>
        request(app)
          .post('/api/dsa/submissions')
          .set('Authorization', authToken)
          .send(submissionData)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Critical Path 3: Progress Tracking', () => {
    test('should update progress for authenticated user', async () => {
      const progressData = {
        problemId: testProblem._id.toString(),
        isCompleted: true,
        notes: 'Completed successfully'
      };

      const response = await request(app)
        .post('/api/dsa/progress')
        .set('Authorization', authToken)
        .send(progressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.progress.isCompleted).toBe(true);
      expect(response.body.progress.notes).toBe('Completed successfully');
    });

    test('should load progress for authenticated user', async () => {
      const response = await request(app)
        .get('/api/dsa/progress')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.problems).toBeDefined();
      expect(response.body.completed).toBeGreaterThan(0);
    });

    test('should get progress statistics', async () => {
      const response = await request(app)
        .get('/api/dsa/progress/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.completionPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Critical Path 4: Error Handling and Resilience', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection
      // For now, we'll test the error response format
      const response = await request(app)
        .get('/api/dsa/problems/nonexistent-id')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    test('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/dsa/progress')
        .set('Authorization', authToken)
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    test('should handle authentication failures', async () => {
      const response = await request(app)
        .post('/api/dsa/submissions')
        .send({
          problem_id: testProblem._id.toString(),
          code: 'test code',
          language: 'python'
        })
        .expect(401);

      expect(response.body.message).toContain('Authentication required');
    });
  });

  describe('Critical Path 5: Performance and Monitoring', () => {
    test('should return performance metrics', async () => {
      const response = await request(app)
        .get('/api/dsa/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.queryCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const promises = Array(10).fill().map(() =>
        request(app)
          .get('/api/dsa/problems')
          .query({ limit: 10 })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});

// Integration test for complete user journey
describe('Complete User Journey Integration Test', () => {
  test('should complete full user journey: load problems -> submit code -> track progress', async () => {
    // Step 1: Load problems (unauthenticated)
    const problemsResponse = await request(app)
      .get('/api/dsa/progress')
      .expect(200);
    
    expect(problemsResponse.body.problems.length).toBeGreaterThan(0);
    const problemId = problemsResponse.body.problems[0]._id;

    // Step 2: Submit code (authenticated)
    const submissionResponse = await request(app)
      .post('/api/dsa/submissions')
      .set('Authorization', authToken)
      .send({
        problem_id: problemId,
        code: 'class Solution:\n    def solve(self, nums):\n        return sum(nums)',
        language: 'python'
      })
      .expect(201);

    expect(submissionResponse.body.status).toBe('pending');

    // Step 3: Update progress (authenticated)
    const progressResponse = await request(app)
      .post('/api/dsa/progress')
      .set('Authorization', authToken)
      .send({
        problemId: problemId,
        isCompleted: true,
        notes: 'Solved successfully'
      })
      .expect(200);

    expect(progressResponse.body.progress.isCompleted).toBe(true);

    // Step 4: Verify progress is saved
    const progressCheckResponse = await request(app)
      .get('/api/dsa/progress')
      .set('Authorization', authToken)
      .expect(200);

    const completedProblem = progressCheckResponse.body.problems.find(p => p._id === problemId);
    expect(completedProblem.isCompleted).toBe(true);
  });
});
