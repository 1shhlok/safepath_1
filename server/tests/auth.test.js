const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

// Mock User model methods for unit testing routes without live MongoDB
jest.mock('../src/models/User');

describe('SafePath Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/signup - returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@nagpur.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Name, email, and password are required');
  });

  test('POST /api/auth/signup - returns 400 for short passwords', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'User', email: 'test@nagpur.com', password: '123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Password must be at least 6 characters');
  });

  test('POST /api/auth/login - returns 400 if email or password missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Email and password are required');
  });

  test('GET /api/health - returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services.api).toBe('online');
  });
});
