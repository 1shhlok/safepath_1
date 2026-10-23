const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const HistoricalZoneCrime = require('../models/HistoricalZoneCrime');
const HistoricalStationCrime = require('../models/HistoricalStationCrime');
const HistoricalCategoryCrime = require('../models/HistoricalCategoryCrime');
const DataImportLog = require('../models/DataImportLog');
const Area = require('../models/Area');
const nagpurStations = require('./nagpurStations');
const config = require('../config');

/**
 * Idempotent Import Pipeline for Nagpur Police Crime Statistics
 * Follows SAFEPath Existing Project Delta Harness v4
 */
async function importWorkbookData(options = {}) {
  const isDryRun = options.dryRun || process.argv.includes('--dry-run') || false;
  const jsonPath = options.jsonPath || path.resolve(__dirname, '../data/nagpur_crime_data_extracted.json');

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Extracted crime dataset not found at: ${jsonPath}. Run 'python scripts/extract_workbook.py' first.`);
  }

  const rawContent = fs.readFileSync(jsonPath, 'utf8');
  const dataset = JSON.parse(rawContent);

  const { zones = [], stations = [], categories = [], summary = [], provenance = {}, metadata = {} } = dataset;

  const importSummary = {
    isDryRun,
    totalRowsRead: zones.length + stations.length + categories.length,
    zonesRead: zones.length,
    stationsRead: stations.length,
    categoriesRead: categories.length,
    zonesImported: 0,
    stationsImported: 0,
    categoriesImported: 0,
    areasSynchronized: 0,
    unverifiedStationMappings: 0,
    unverifiedStationList: [],
    duplicatesPrevented: 0,
    rejectedRows: [],
    warnings: [
      'Summary sheet totals reflect differing scopes and are NOT reconciled; preserved without summing across scopes.',
      'Staffing and vehicle columns in workbook are 0; excluded from risk baseline formulas.'
    ]
  };

  if (metadata.warnings && metadata.warnings.length > 0) {
    importSummary.warnings.push(...metadata.warnings);
  }

  // --- Validation Phase ---
  // Validate Zones
  for (const z of zones) {
    if (!z.zone || typeof z.year !== 'number' || typeof z.reportedCrimes !== 'number' || typeof z.detectionRate !== 'number') {
      importSummary.rejectedRows.push({ type: 'zone', row: z, reason: 'Missing or malformed numeric fields' });
    }
  }

  // Validate Stations
  for (const s of stations) {
    if (!s.stationName || typeof s.year !== 'number' || typeof s.reportedCrimes !== 'number' || typeof s.detectionRate !== 'number') {
      importSummary.rejectedRows.push({ type: 'station', row: s, reason: 'Missing or malformed station fields' });
    }
    if (s.mappingStatus === 'unverified') {
      if (!importSummary.unverifiedStationList.includes(s.stationName)) {
        importSummary.unverifiedStationList.push(s.stationName);
      }
    }
  }
  importSummary.unverifiedStationMappings = importSummary.unverifiedStationList.length;

  // Validate Categories
  for (const c of categories) {
    if (!c.sourceLabel || typeof c.year !== 'number' || typeof c.reported !== 'number' || typeof c.detected !== 'number') {
      importSummary.rejectedRows.push({ type: 'category', row: c, reason: 'Missing or malformed category fields' });
    }
  }

  if (importSummary.rejectedRows.length > 0) {
    throw new Error(`Data validation failed with ${importSummary.rejectedRows.length} rejected rows.`);
  }

  if (isDryRun) {
    console.log('[DRY RUN] Validation succeeded. No database modifications performed.');
    console.log(`[DRY RUN] Read: ${zones.length} zones, ${stations.length} stations (${importSummary.unverifiedStationMappings} unverified), ${categories.length} categories.`);
    return importSummary;
  }

  // --- Idempotent Write Phase (Upsert on Natural Keys) ---

  // 1. Zone-wise aggregates (natural key: zone + year)
  for (const z of zones) {
    await HistoricalZoneCrime.findOneAndUpdate(
      { zone: z.zone, year: z.year },
      {
        $set: {
          zone: z.zone,
          year: z.year,
          reportedCrimes: z.reportedCrimes,
          detectionRate: z.detectionRate,
          provenance: {
            sourceWorkbook: provenance.sourceWorkbook,
            sourceUrl: provenance.sourceUrl,
            extractionMethod: provenance.extractionMethod,
            extractionTimestamp: new Date(provenance.extractionTimestamp || Date.now())
          }
        }
      },
      { upsert: true, new: true }
    );
    importSummary.zonesImported++;
  }

  // 2. Police Station-wise records (natural key: stationName + year)
  for (const s of stations) {
    await HistoricalStationCrime.findOneAndUpdate(
      { stationName: s.stationName, year: s.year },
      {
        $set: {
          stationName: s.stationName,
          stationMarathi: s.stationMarathi,
          sourceLabel: s.sourceLabel,
          zone: s.zone,
          mappingStatus: s.mappingStatus,
          year: s.year,
          reportedCrimes: s.reportedCrimes,
          detectionRate: s.detectionRate,
          manpower: s.manpower || 0,
          fourWheelers: s.fourWheelers || 0,
          twoWheelers: s.twoWheelers || 0,
          provenance: {
            sourceWorkbook: provenance.sourceWorkbook,
            sourceUrl: provenance.sourceUrl,
            extractionMethod: provenance.extractionMethod,
            zoneMappingSource: provenance.zoneMappingSource,
            extractionTimestamp: new Date(provenance.extractionTimestamp || Date.now())
          }
        }
      },
      { upsert: true, new: true }
    );
    importSummary.stationsImported++;
  }

  // 3. Crime Categories (natural key: sourceLabel + year)
  for (const c of categories) {
    await HistoricalCategoryCrime.findOneAndUpdate(
      { sourceLabel: c.sourceLabel, year: c.year },
      {
        $set: {
          sourceLabel: c.sourceLabel,
          categoryMarathi: c.categoryMarathi,
          year: c.year,
          reported: c.reported,
          detected: c.detected,
          detectionRate: c.detectionRate,
          classifierMapping: c.classifierMapping,
          isAggregate: c.isAggregate,
          provenance: {
            sourceWorkbook: provenance.sourceWorkbook,
            sourceUrl: provenance.sourceUrl,
            extractionMethod: provenance.extractionMethod,
            extractionTimestamp: new Date(provenance.extractionTimestamp || Date.now())
          }
        }
      },
      { upsert: true, new: true }
    );
    importSummary.categoriesImported++;
  }

  // 4. Synchronize Area Collection with 35 Station Catchments
  // Use the 2024 reported crimes as the baseline metric
  const stations2024 = stations.filter(s => s.year === 2024);
  const stations2024Map = new Map();
  stations2024.forEach(s => stations2024Map.set(s.stationName, s));

  // Compute baseline min/max for deterministic normalization across stations
  const counts = stations2024.map(s => s.reportedCrimes);
  const minCrime = Math.min(...counts);
  const maxCrime = Math.max(...counts);

  const stationMetaMap = new Map();
  nagpurStations.forEach(st => stationMetaMap.set(st.name, st));

  for (const s of stations2024) {
    const geoMeta = stationMetaMap.get(s.stationName);
    const center = geoMeta?.center || { latitude: 21.1458, longitude: 79.0882 };
    const neighbors = geoMeta?.neighbors || [];

    // Deterministic baseline risk normalization:
    // Normalize station crime count between 15 (min) and 60 (max)
    // Formula: 15 + ((count - min) / (max - min)) * 45
    const crimeSpread = maxCrime > minCrime ? (s.reportedCrimes - minCrime) / (maxCrime - minCrime) : 0.5;
    const baselineRisk = Math.round(15 + crimeSpread * 45);

    // Initial categorical level based on baseline score
    let riskLevel = 'Low';
    if (baselineRisk > 50) riskLevel = 'High';
    else if (baselineRisk > 25) riskLevel = 'Moderate';

    await Area.findOneAndUpdate(
      { name: s.stationName },
      {
        $set: {
          name: s.stationName,
          center,
          neighbors,
          stationMarathi: s.stationMarathi,
          policeZone: s.zone,
          zoneMappingStatus: s.mappingStatus,
          coordinateType: 'approximate_station_marker',
          riskScore: baselineRisk,
          riskLevel,
          historicalBaseline: {
            year: 2024,
            reportedCrimes: s.reportedCrimes,
            detectionRate: s.detectionRate,
            baselineRisk
          },
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    importSummary.areasSynchronized++;
  }

  // 5. Record Data Import Log
  await DataImportLog.create({
    importTimestamp: new Date(),
    sourceWorkbook: provenance.sourceWorkbook || 'Nagpur_City_Police_Crime_Data_With_Zone_Mapping (1).xlsx',
    isDryRun: false,
    status: 'success',
    summary: {
      totalRowsRead: importSummary.totalRowsRead,
      zonesImported: importSummary.zonesImported,
      stationsImported: importSummary.stationsImported,
      categoriesImported: importSummary.categoriesImported,
      unverifiedStationMappings: importSummary.unverifiedStationMappings,
      duplicatesPrevented: 0,
      rejectedRows: [],
      warnings: importSummary.warnings
    },
    provenance
  });

  return importSummary;
}

// Standalone execution support
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');

  mongoose.connect(config.mongodbUri)
    .then(async () => {
      console.log(`Connected to MongoDB for crime data import (dryRun=${isDryRun})...`);
      const summary = await importWorkbookData({ dryRun: isDryRun });
      console.log('--- Import Summary ---');
      console.log(`- Zones imported/updated     : ${summary.zonesImported}`);
      console.log(`- Stations imported/updated  : ${summary.stationsImported}`);
      console.log(`- Categories imported/updated: ${summary.categoriesImported}`);
      console.log(`- Areas synchronized         : ${summary.areasSynchronized}`);
      console.log(`- Unverified station mappings: ${summary.unverifiedStationMappings}`);
      console.log(`- Warnings                   : ${summary.warnings.length}`);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[IMPORT ERROR]', err.message);
      process.exit(1);
    });
}

module.exports = importWorkbookData;
