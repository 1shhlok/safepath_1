const fs = require('fs');
const path = require('path');
const importWorkbookData = require('../src/seed/importWorkbookData');

describe('SafePath Authoritative Crime Data Import Suite', () => {
  const jsonPath = path.resolve(__dirname, '../src/data/nagpur_crime_data_extracted.json');

  test('extracted JSON file exists and contains all required dataset sections', () => {
    expect(fs.existsSync(jsonPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    expect(data).toHaveProperty('zones');
    expect(data).toHaveProperty('stations');
    expect(data).toHaveProperty('categories');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('provenance');
    expect(data).toHaveProperty('metadata');
  });

  test('verifies exact row counts and year coverage across all sheets', () => {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // 1. Zone-wise Crime: 10 rows (Zones 1-5 for 2023 and 2024)
    expect(data.zones.length).toBe(10);
    const zoneYears = new Set(data.zones.map(z => z.year));
    expect(Array.from(zoneYears).sort()).toEqual([2023, 2024]);

    // 2. Police Station-wise: 70 rows (35 stations x 2023, 2024)
    expect(data.stations.length).toBe(70);
    const stationNames = new Set(data.stations.map(s => s.stationName));
    expect(stationNames.size).toBe(35);
    const stationYears = new Set(data.stations.map(s => s.year));
    expect(Array.from(stationYears).sort()).toEqual([2023, 2024]);

    // 3. Crime Categories: 92 rows (23 categories x 2021-2024)
    expect(data.categories.length).toBe(92);
    const categoryLabels = new Set(data.categories.map(c => c.sourceLabel));
    expect(categoryLabels.size).toBe(23);
    const catYears = new Set(data.categories.map(c => c.year));
    expect(Array.from(catYears).sort()).toEqual([2021, 2022, 2023, 2024]);
  });

  test('preserves unverified station-to-zone mappings without guessing Zone 1 or Zone 2', () => {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const unverifiedRows = data.stations.filter(s => s.mappingStatus === 'unverified');
    expect(unverifiedRows.length).toBe(48); // 24 stations x 2 years

    // Ensure every unverified station has the exact unverified label preserved
    for (const row of unverifiedRows) {
      expect(row.zone).toBe('Unverified — Zone 1/2 or check current roster');
      expect(row.mappingStatus).toBe('unverified');
    }

    const verifiedRows = data.stations.filter(s => s.mappingStatus === 'verified_document');
    expect(verifiedRows.length).toBe(22); // 11 stations x 2 years
    for (const row of verifiedRows) {
      expect(['Zone 3', 'Zone 4', 'Zone 5']).toContain(row.zone);
    }
  });

  test('keeps reported count, detected count, and detection rate distinct', () => {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const cat of data.categories) {
      expect(cat).toHaveProperty('reported');
      expect(cat).toHaveProperty('detected');
      expect(cat).toHaveProperty('detectionRate');
      expect(typeof cat.reported).toBe('number');
      expect(typeof cat.detected).toBe('number');
      expect(typeof cat.detectionRate).toBe('number');
      // Detection rate is a percentage
      expect(cat.detectionRate).toBeGreaterThanOrEqual(0);
      expect(cat.detectionRate).toBeLessThanOrEqual(100);
    }
  });

  test('preserves exact source category labels including punctuation and abbreviations', () => {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const expectedLabels = [
      'ASSAULT ON P.S.',
      'ATT.MURDER',
      'CR.BR.OF TRUST',
      'H.B.Ts.',
      'M.V.THEFTS',
      'PRE.OF DACOITY',
      'Tot. ROBBERY',
      'TOTAL RIOTS',
      'TOTAL THEFTS'
    ];

    const presentLabels = new Set(data.categories.map(c => c.sourceLabel));
    for (const label of expectedLabels) {
      expect(presentLabels.has(label)).toBe(true);
    }
  });

  test('dry-run execution validates successfully without writing', async () => {
    const summary = await importWorkbookData({ dryRun: true });
    expect(summary.isDryRun).toBe(true);
    expect(summary.zonesImported).toBe(0);
    expect(summary.stationsImported).toBe(0);
    expect(summary.categoriesImported).toBe(0);
    expect(summary.unverifiedStationMappings).toBe(24);
    expect(summary.rejectedRows.length).toBe(0);
  });
});
