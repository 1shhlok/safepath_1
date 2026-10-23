const mongoose = require('mongoose');
const User = require('../models/User');
const Area = require('../models/Area');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const importWorkbookData = require('./importWorkbookData');
const RiskEngine = require('../services/riskEngine');

// Initial seed incident complaints for demonstration and testing review states
const sampleIncidents = [
  {
    stationName: "Sitabuldi Police Station",
    type: "Theft",
    confidence: 0.88,
    desc: "Backpack unzipped and wallet taken near the busy market crossing.",
    daysAgo: 4,
    status: 'accepted'
  },
  {
    stationName: "Sitabuldi Police Station",
    type: "Harassment",
    confidence: 0.82,
    desc: "Verbal altercation and aggressive catcalling near the transit gate.",
    daysAgo: 10,
    status: 'accepted'
  },
  {
    stationName: "Sadar Police Station",
    type: "Theft",
    confidence: 0.85,
    desc: "Motorcycle helmet and jacket taken from parking outside commercial complex.",
    daysAgo: 7,
    status: 'accepted'
  },
  {
    stationName: "Kotwali Police Station",
    type: "Robbery",
    confidence: 0.91,
    desc: "Gold chain snatched from walking commuter during evening hours.",
    daysAgo: 5,
    status: 'accepted'
  },
  {
    stationName: "Ajni Police Station",
    type: "Suspicious Activity",
    confidence: 0.74,
    desc: "Individuals checking car handles along residential alley around 2 AM.",
    daysAgo: 2,
    status: 'pending_review' // Awaiting admin review!
  },
  {
    stationName: "Dhantoli Police Station",
    type: "Harassment",
    confidence: 0.79,
    desc: "Group passing inappropriate remarks near public park entrance.",
    daysAgo: 1,
    status: 'pending_review' // Awaiting admin review!
  }
];

const seedDatabase = async () => {
  console.log('--- Starting SafePath Nagpur Database Seed (Harness v4) ---');

  // 1. Clear existing collections
  await User.deleteMany({});
  await Area.deleteMany({});
  await Report.deleteMany({});
  await AuditLog.deleteMany({});
  console.log('Cleared existing User, Area, Report, and AuditLog collections.');

  // 2. Create Default Admin & User
  const adminUser = new User({
    name: 'SafePath Admin',
    email: 'admin@safepath.nagpur',
    password: 'Admin@12345',
    role: 'admin'
  });
  await adminUser.save();

  const standardUser = new User({
    name: 'SafePath Nagpur User',
    email: 'user@safepath.nagpur',
    password: 'User@12345',
    role: 'user'
  });
  await standardUser.save();

  console.log('Created default accounts:');
  console.log('  Admin : admin@safepath.nagpur / Admin@12345');
  console.log('  User  : user@safepath.nagpur  / User@12345');

  // 3. Import Authoritative Crime Workbook Data (35 Station Areas, 10 Zones, 92 Categories)
  console.log('Importing authoritative crime statistics and synchronizing 35 station catchments...');
  const importSummary = await importWorkbookData({ dryRun: false });
  console.log(`Seeded ${importSummary.areasSynchronized} police station catchment areas.`);

  // 4. Insert Sample Reports (Accepted & Pending Review)
  const now = new Date();
  const createdReports = [];

  for (const inc of sampleIncidents) {
    const area = await Area.findOne({ name: inc.stationName });
    if (!area) continue;

    const reportDate = new Date(now.getTime() - inc.daysAgo * 24 * 60 * 60 * 1000);
    const latJitter = (Math.random() - 0.5) * 0.003;
    const lngJitter = (Math.random() - 0.5) * 0.003;

    const report = new Report({
      userId: standardUser._id,
      latitude: area.center.latitude + latJitter,
      longitude: area.center.longitude + lngJitter,
      areaId: area._id,
      description: inc.desc,
      incidentType: inc.type,
      confidence: inc.confidence,
      timestamp: reportDate,
      status: inc.status,
      evidenceImages: [
        {
          publicId: `seed_evidence_${Date.now()}`,
          url: '/api/reports/evidence/sample_evidence.png',
          fileName: 'seed_photo.png',
          fileSize: 1024 * 150,
          mimeType: 'image/png',
          storageType: 'local_secure'
        }
      ],
      review: inc.status === 'accepted' ? {
        reviewedBy: adminUser._id,
        reviewedAt: reportDate,
        decision: 'accepted',
        reviewNotes: 'Verified during database initialization.'
      } : {
        reviewedBy: null,
        reviewedAt: null,
        decision: null,
        rejectionReason: null,
        reviewNotes: ''
      },
      riskImpactApplied: inc.status === 'accepted'
    });

    await report.save();
    createdReports.push(report);

    // Create Audit Log
    await AuditLog.create({
      action: inc.status === 'accepted' ? 'REPORT_REVIEW_ACCEPTED' : 'REPORT_SUBMITTED',
      reportId: report._id,
      actorId: inc.status === 'accepted' ? adminUser._id : standardUser._id,
      actorRole: inc.status === 'accepted' ? 'admin' : 'user',
      timestamp: reportDate,
      details: {
        areaName: area.name,
        incidentType: inc.type,
        status: inc.status
      }
    });
  }

  console.log(`Seeded ${createdReports.length} demonstration incident reports with evidence.`);

  // 5. Authoritatively update risk scores for all 35 catchment areas
  const allAreas = await Area.find();
  for (const area of allAreas) {
    const areaAcceptedReports = await Report.find({ areaId: area._id, status: 'accepted' });
    const calculatedRisk = RiskEngine.calculateAreaRisk(areaAcceptedReports, area.historicalBaseline);

    await Area.findByIdAndUpdate(area._id, {
      riskScore: calculatedRisk.riskScore,
      riskLevel: calculatedRisk.riskLevel,
      updatedAt: new Date()
    });
  }

  console.log('Calculated authoritative dynamic risk scores for all 35 Nagpur station catchments.');
  console.log('--- Database Seeding Complete ---');
};

module.exports = seedDatabase;
