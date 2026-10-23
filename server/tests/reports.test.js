const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const config = require('../src/config');

describe('SafePath Reports API Validation', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('POST /api/reports - rejects unauthenticated submission with 401', async () => {
    const res = await request(app)
      .post('/api/reports')
      .send({
        description: 'Someone snatched my purse',
        location: 'Sitabuldi'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toContain('Authentication token missing or invalid');
  });

  test('GET /api/reports - returns report list structure', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reports');
    expect(Array.isArray(res.body.reports)).toBe(true);
  });
});
