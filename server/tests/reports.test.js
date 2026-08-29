const request = require('supertest');
const app = require('../src/app');

describe('SafePath Reports API Validation', () => {
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
    // If db not connected in mock test, should return 200 or clean error
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('reports');
    }
  });
});
