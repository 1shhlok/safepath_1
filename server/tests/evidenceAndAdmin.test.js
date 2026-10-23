const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const User = require('../src/models/User');
const Area = require('../src/models/Area');
const Report = require('../src/models/Report');
const AuditLog = require('../src/models/AuditLog');
const MLService = require('../src/services/mlService');

describe('SafePath Evidence Upload & Admin Moderation Suite', () => {
  let adminUser, standardUser, otherUser;
  let adminToken, userToken, otherToken;
  let testArea;

  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89
  ]);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    // Setup test users
    adminUser = await User.findOneAndUpdate(
      { email: 'test_admin@safepath.nagpur' },
      { name: 'Test Admin', email: 'test_admin@safepath.nagpur', role: 'admin', password: 'Password123!' },
      { upsert: true, new: true }
    );

    standardUser = await User.findOneAndUpdate(
      { email: 'test_user1@safepath.nagpur' },
      { name: 'Test User One', email: 'test_user1@safepath.nagpur', role: 'user', password: 'Password123!' },
      { upsert: true, new: true }
    );

    otherUser = await User.findOneAndUpdate(
      { email: 'test_user2@safepath.nagpur' },
      { name: 'Test User Two', email: 'test_user2@safepath.nagpur', role: 'user', password: 'Password123!' },
      { upsert: true, new: true }
    );

    testArea = await Area.findOneAndUpdate(
      { name: 'Sitabuldi Police Station' },
      {
        name: 'Sitabuldi Police Station',
        center: { latitude: 21.1466, longitude: 79.0833 },
        riskScore: 25,
        riskLevel: 'Low',
        historicalBaseline: { year: 2024, reportedCrimes: 500, baselineRisk: 25 }
      },
      { upsert: true, new: true }
    );

    adminToken = jwt.sign({ userId: adminUser._id }, config.jwtSecret, { expiresIn: '1h' });
    userToken = jwt.sign({ userId: standardUser._id }, config.jwtSecret, { expiresIn: '1h' });
    otherToken = jwt.sign({ userId: otherUser._id }, config.jwtSecret, { expiresIn: '1h' });

    // Mock ML classification to decouple integration test from running Python service
    jest.spyOn(MLService, 'classifyIncident').mockResolvedValue({
      incidentType: 'Assault',
      confidence: 0.95,
      isLowConfidence: false,
      probabilities: { Assault: 0.95 }
    });
  });

  afterAll(async () => {
    // Cleanup test records
    await Report.deleteMany({ description: /Integration Test Evidence/ });
    await AuditLog.deleteMany({ 'details.testTag': 'evidence-admin-test' });
    await mongoose.disconnect();
  });

  test('POST /api/reports - rejects submission when evidence image is missing', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .field('description', 'Integration Test Evidence - purse snatched')
      .field('areaId', testArea._id.toString());

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('At least one evidence image is required');
  });

  test('POST /api/reports - rejects submission with invalid binary file signature', async () => {
    const fakeBuffer = Buffer.from('Plain text fake image content that fails magic bytes check');

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .field('description', 'Integration Test Evidence - suspicious activity')
      .field('areaId', testArea._id.toString())
      .attach('evidence', fakeBuffer, 'fake.png');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('failed security signature check');
  });

  test('POST /api/reports - creates report in pending_review state with evidence, without changing area risk', async () => {
    const initialArea = await Area.findById(testArea._id);
    const initialScore = initialArea.riskScore;

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .field('description', 'Integration Test Evidence - assault near intersection')
      .field('areaId', testArea._id.toString())
      .attach('evidence', validPngBuffer, 'valid_evidence.png');

    expect(res.statusCode).toBe(201);
    expect(res.body.report.status).toBe('pending_review');
    expect(res.body.report.evidenceImages.length).toBe(1);
    expect(res.body.report.evidenceImages[0].fileName).toBe('valid_evidence.png');

    // Confirm Area risk was NOT changed by pending report
    const areaAfter = await Area.findById(testArea._id);
    expect(areaAfter.riskScore).toBe(initialScore);
  });

  test('PATCH /api/reports/:id/review - rejects request with 401 when token is missing', async () => {
    const report = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - robbery check missing token',
      incidentType: 'Robbery',
      confidence: 0.9,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report.save();

    const res = await request(app)
      .patch(`/api/reports/${report._id}/review`)
      .send({ decision: 'accepted' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toContain('Authentication token missing or invalid');
  });

  test('PATCH /api/reports/:id/review - rejects request with 401 when token is invalid', async () => {
    const report = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - robbery check invalid token',
      incidentType: 'Robbery',
      confidence: 0.9,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report.save();

    const res = await request(app)
      .patch(`/api/reports/${report._id}/review`)
      .set('Authorization', 'Bearer invalid.jwt.signature')
      .send({ decision: 'accepted' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toContain('Invalid authentication token');
  });

  test('PATCH /api/reports/:id/review - denies non-admin users from reviewing reports', async () => {
    // Create a pending report
    const report = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - robbery',
      incidentType: 'Robbery',
      confidence: 0.9,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report.save();

    const res = await request(app)
      .patch(`/api/reports/${report._id}/review`)
      .set('Authorization', `Bearer ${userToken}`) // Standard user
      .send({ decision: 'accepted' });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('Requires admin role privileges');
  });

  test('PATCH /api/reports/:id/review - requires mandatory rejection reason on rejection', async () => {
    const report = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - vague incident',
      incidentType: 'Other',
      confidence: 0.5,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report.save();

    const res = await request(app)
      .patch(`/api/reports/${report._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'rejected' }); // Missing rejectionReason

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('rejection reason is mandatory');
  });

  test('PATCH /api/reports/:id/review - admin rejection updates status to rejected with audit log', async () => {
    const report = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - unverified claim',
      incidentType: 'Other',
      confidence: 0.5,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report.save();

    const res = await request(app)
      .patch(`/api/reports/${report._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'rejected',
        rejectionReason: 'Image does not clearly show incident location or event',
        reviewNotes: 'Inspected by admin.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.report.status).toBe('rejected');
    expect(res.body.report.review.rejectionReason).toContain('does not clearly show');

    // Confirm audit log created
    const audit = await AuditLog.findOne({ reportId: report._id, action: 'REPORT_REVIEW_REJECTED' });
    expect(audit).not.toBeNull();
    expect(audit.actorRole).toBe('admin');
  });

  test('PATCH /api/reports/:id/review - admin acceptance updates status and recalculates risk once', async () => {
    const report = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - confirmed assault',
      incidentType: 'Assault',
      confidence: 0.95,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report.save();

    const res = await request(app)
      .patch(`/api/reports/${report._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'accepted',
        reviewNotes: 'Verified via attached photo.'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.report.status).toBe('accepted');
    expect(res.body.report.riskImpactApplied).toBe(true);
    expect(res.body.area).toBeDefined();

    // Confirm audit log
    const audit = await AuditLog.findOne({ reportId: report._id, action: 'REPORT_REVIEW_ACCEPTED' });
    expect(audit).not.toBeNull();
  });

  test('PATCH /api/reports/:id/review - accepts admin review with lowercase bearer or x-access-token', async () => {
    const report1 = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - test lowercase bearer',
      incidentType: 'Theft',
      confidence: 0.85,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report1.save();

    // Test with lowercase 'bearer <token>'
    const res1 = await request(app)
      .patch(`/api/reports/${report1._id}/review`)
      .set('Authorization', `bearer ${adminToken}`)
      .send({ decision: 'accepted' });

    expect(res1.statusCode).toBe(200);
    expect(res1.body.report.status).toBe('accepted');

    const report2 = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - test custom header x-access-token',
      incidentType: 'Theft',
      confidence: 0.85,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await report2.save();

    // Test with 'x-access-token'
    const res2 = await request(app)
      .patch(`/api/reports/${report2._id}/review`)
      .set('x-access-token', adminToken)
      .send({ decision: 'accepted' });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.report.status).toBe('accepted');
  });

  test('GET /api/reports/:id - prevents third-party users from viewing private pending reports', async () => {
    const privateReport = new Report({
      userId: standardUser._id,
      latitude: testArea.center.latitude,
      longitude: testArea.center.longitude,
      areaId: testArea._id,
      description: 'Integration Test Evidence - sensitive pending complaint',
      incidentType: 'Harassment',
      confidence: 0.8,
      status: 'pending_review',
      evidenceImages: [{ url: '/fake/url', fileName: 'proof.png' }]
    });
    await privateReport.save();

    // otherUser tries to view standardUser's pending report -> 403 Forbidden
    const deniedRes = await request(app)
      .get(`/api/reports/${privateReport._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(deniedRes.statusCode).toBe(403);
    expect(deniedRes.body.error).toContain('Access denied');

    // standardUser (owner) can view their own report -> 200 OK
    const ownerRes = await request(app)
      .get(`/api/reports/${privateReport._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(ownerRes.statusCode).toBe(200);

    // Admin can view any pending report -> 200 OK
    const adminRes = await request(app)
      .get(`/api/reports/${privateReport._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.statusCode).toBe(200);
  });

  test('GET /api/reports/evidence/:filename - serves evidence image when authenticated via query token', async () => {
    // 1. Without token -> 401
    const noTokenRes = await request(app).get('/api/reports/evidence/sample_evidence.png');
    expect(noTokenRes.statusCode).toBe(401);
    expect(noTokenRes.body.error).toContain('Authentication token missing or invalid');

    // 2. With invalid token -> 401
    const badTokenRes = await request(app).get('/api/reports/evidence/sample_evidence.png?token=invalid.jwt.token');
    expect(badTokenRes.statusCode).toBe(401);
    expect(badTokenRes.body.error).toContain('Invalid authentication token');

    // 3. With admin query token -> 200 OK
    const adminQueryRes = await request(app).get(`/api/reports/evidence/sample_evidence.png?token=${adminToken}`);
    expect(adminQueryRes.statusCode).toBe(200);
    expect(adminQueryRes.headers['content-type']).toContain('image/png');
  });
});
