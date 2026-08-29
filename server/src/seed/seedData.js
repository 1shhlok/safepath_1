const mongoose = require('mongoose');
const User = require('../models/User');
const Area = require('../models/Area');
const Report = require('../models/Report');
const nagpurZones = require('./nagpurZones');
const RiskEngine = require('../services/riskEngine');

// Synthetic seed incidents for demonstration and initial risk benchmarking
const syntheticIncidents = [
  // High incident concentration in Itwari
  { zoneName: "Itwari", type: "Robbery", confidence: 0.92, desc: "Cash and phone snatched at knifepoint near the old market alley.", daysAgo: 4 },
  { zoneName: "Itwari", type: "Theft", confidence: 0.88, desc: "Backpack unzipped and wallet stolen in crowded wholesale lane.", daysAgo: 12 },
  { zoneName: "Itwari", type: "Assault", confidence: 0.90, desc: "Physical altercation between shopkeepers resulting in brawl.", daysAgo: 18 },
  { zoneName: "Itwari", type: "Suspicious Activity", confidence: 0.75, desc: "Unknown individuals checking closed shop shutters at 3 AM.", daysAgo: 22 },

  // Moderate incident concentration in Mahal
  { zoneName: "Mahal", type: "Harassment", confidence: 0.85, desc: "Group passing vulgar comments and following pedestrians near temple.", daysAgo: 6 },
  { zoneName: "Mahal", type: "Theft", confidence: 0.80, desc: "Bicycle stolen from residential driveway during evening hours.", daysAgo: 15 },
  { zoneName: "Mahal", type: "Suspicious Activity", confidence: 0.72, desc: "Two men lurking near ATM looking at users entering pins.", daysAgo: 25 },

  // Low/Moderate in Sitabuldi
  { zoneName: "Sitabuldi", type: "Theft", confidence: 0.86, desc: "Mobile phone pickpocketed near metro entrance during rush hour.", daysAgo: 8 },
  { zoneName: "Sitabuldi", type: "Harassment", confidence: 0.78, desc: "Verbal altercation and aggressive catcalling near interchange.", daysAgo: 20 },

  // Low incident concentration in Civil Lines (High Safety Zone)
  { zoneName: "Civil Lines", type: "Other", confidence: 0.70, desc: "Street light flickering and broken tree branch on side road.", daysAgo: 30 },

  // Low incident concentration in Dharampeth
  { zoneName: "Dharampeth", type: "Other", confidence: 0.65, desc: "Minor parking space dispute causing temporary road blockage.", daysAgo: 28 },

  // Moderate in Sadar
  { zoneName: "Sadar", type: "Theft", confidence: 0.82, desc: "Helmet and jacket taken from motorcycle parked outside residency.", daysAgo: 10 },
  { zoneName: "Sadar", type: "Suspicious Activity", confidence: 0.74, desc: "Suspicious vehicle idling with tinted windows near garden.", daysAgo: 14 },

  // Moderate in Jaripatka
  { zoneName: "Jaripatka", type: "Robbery", confidence: 0.89, desc: "Gold chain snatched from walking commuter in evening.", daysAgo: 5 },
  { zoneName: "Jaripatka", type: "Harassment", confidence: 0.81, desc: "Aggressive shouting and stalking along market corridor.", daysAgo: 16 },

  // High in Gandhibagh
  { zoneName: "Gandhibagh", type: "Assault", confidence: 0.91, desc: "Violent scuffle resulting in physical blows near park boundary.", daysAgo: 7 },
  { zoneName: "Gandhibagh", type: "Theft", confidence: 0.84, desc: "Laptop bag taken from car front seat during quick stop.", daysAgo: 19 },
  { zoneName: "Gandhibagh", type: "Robbery", confidence: 0.87, desc: "Threatened with blunt weapon and forced to hand over purse.", daysAgo: 21 },

  // Moderate in Sakkardara
  { zoneName: "Sakkardara", type: "Theft", confidence: 0.79, desc: "Two-wheeler spare parts stolen overnight from colony lane.", daysAgo: 11 },
  { zoneName: "Sakkardara", type: "Suspicious Activity", confidence: 0.73, desc: "Masked individuals peering into parked cars with torches.", daysAgo: 24 },

  // Low in Laxmi Nagar
  { zoneName: "Laxmi Nagar", type: "Other", confidence: 0.68, desc: "Pothole on square turn causing traffic slowdown.", daysAgo: 35 },

  // Low in Pratap Nagar
  { zoneName: "Pratap Nagar", type: "Other", confidence: 0.62, desc: "Water accumulation on road following rain.", daysAgo: 40 },

  // Moderate in Reshimbagh
  { zoneName: "Reshimbagh", type: "Harassment", confidence: 0.83, desc: "Eve teasing reported near ground gate in the evening.", daysAgo: 9 },

  // Moderate in Wardhaman Nagar
  { zoneName: "Wardhaman Nagar", type: "Theft", confidence: 0.81, desc: "Package stolen from front door delivery spot.", daysAgo: 13 },

  // Moderate in Mankapur
  { zoneName: "Mankapur", type: "Suspicious Activity", confidence: 0.76, desc: "Unattended bag left near flyover pillar for several hours.", daysAgo: 17 }
];

const seedDatabase = async () => {
  console.log('--- Starting SafePath Nagpur Database Seed ---');

  // 1. Clear existing collections
  await User.deleteMany({});
  await Area.deleteMany({});
  await Report.deleteMany({});
  console.log('Cleared existing User, Area, and Report collections.');

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

  // 3. Insert Initial Nagpur Zones
  const areaDocsMap = new Map();
  for (const zone of nagpurZones) {
    const area = new Area({
      name: zone.name,
      center: zone.center,
      riskScore: 10,
      riskLevel: 'Low',
      neighbors: zone.neighbors
    });
    await area.save();
    areaDocsMap.set(zone.name, area);
  }
  console.log(`Seeded ${nagpurZones.length} predefined Nagpur zones.`);

  // 4. Insert Synthetic Historical Incident Reports
  const now = new Date();
  const createdReports = [];

  for (const inc of syntheticIncidents) {
    const area = areaDocsMap.get(inc.zoneName);
    if (!area) continue;

    const reportDate = new Date(now.getTime() - inc.daysAgo * 24 * 60 * 60 * 1000);
    // Slight jitter around center coordinates
    const latJitter = (Math.random() - 0.5) * 0.004;
    const lngJitter = (Math.random() - 0.5) * 0.004;

    const report = new Report({
      userId: standardUser._id,
      latitude: area.center.latitude + latJitter,
      longitude: area.center.longitude + lngJitter,
      areaId: area._id,
      description: inc.desc,
      incidentType: inc.type,
      confidence: inc.confidence,
      timestamp: reportDate,
      status: 'active'
    });
    await report.save();
    createdReports.push(report);
  }
  console.log(`Seeded ${createdReports.length} synthetic incident records.`);

  // 5. Authoritatively calculate initial risk scores for every zone
  for (const [name, area] of areaDocsMap.entries()) {
    const areaReports = await Report.find({ areaId: area._id, status: { $ne: 'archived' } });
    const { riskScore, riskLevel } = RiskEngine.calculateAreaRisk(areaReports);

    await Area.findByIdAndUpdate(area._id, {
      riskScore,
      riskLevel,
      updatedAt: new Date()
    });
  }

  console.log('Calculated dynamic risk scores and levels for all 24 Nagpur zones.');
  console.log('--- Database Seeding Complete ---');
};

module.exports = seedDatabase;
