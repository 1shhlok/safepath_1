const axios = require('axios');
const nagpurZones = require('../seed/nagpurZones');
const nagpurStations = require('../seed/nagpurStations');

// In-memory cache to respect OSM Nominatim policy and reduce API calls
const geocodeCache = new Map();

class GeocodingService {
  /**
   * Calculate Haversine distance in km between two GPS points
   */
  static haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Match location name to Nagpur predefined zones or call OSM Nominatim
   * @param {string} query 
   */
  static async geocode(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      throw new Error("Location query cannot be empty");
    }

    const cleanQuery = query.trim().toLowerCase();

    // 1. Check local zone direct match
    const directMatch = nagpurZones.find(
      z => z.name.toLowerCase() === cleanQuery || cleanQuery.includes(z.name.toLowerCase())
    );

    if (directMatch) {
      return {
        name: directMatch.name,
        latitude: directMatch.center.latitude,
        longitude: directMatch.center.longitude,
        displayName: `${directMatch.name}, Nagpur, Maharashtra, India`,
        source: 'predefined_zone'
      };
    }

    // 1b. Check official station names from workbook
    const stationMatch = nagpurStations.find(
      s => s.name.toLowerCase() === cleanQuery ||
           cleanQuery.includes(s.name.toLowerCase()) ||
           s.name.toLowerCase().includes(cleanQuery)
    );

    if (stationMatch) {
      return {
        name: stationMatch.name,
        latitude: stationMatch.center.latitude,
        longitude: stationMatch.center.longitude,
        displayName: `${stationMatch.name}, Nagpur, Maharashtra, India`,
        source: 'police_station_catchment'
      };
    }

    // 2. Check in-memory cache
    if (geocodeCache.has(cleanQuery)) {
      return geocodeCache.get(cleanQuery);
    }

    // 3. Fallback to OpenStreetMap Nominatim with Nagpur bounds preference
    try {
      const nagpurQuery = cleanQuery.includes('nagpur') ? cleanQuery : `${cleanQuery}, Nagpur, Maharashtra`;
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: nagpurQuery,
          format: 'json',
          limit: 1,
          countrycodes: 'in'
        },
        headers: {
          'User-Agent': 'SafePath-Nagpur-Safety-App/1.0'
        },
        timeout: 4000
      });

      if (response.data && response.data.length > 0) {
        const item = response.data[0];
        const result = {
          name: query.trim(),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: item.display_name,
          source: 'nominatim'
        };
        geocodeCache.set(cleanQuery, result);
        return result;
      }
    } catch (err) {
      console.warn(`[SafePath Geocoder] External geocoding failed for "${query}": ${err.message}. Falling back to default center.`);
    }

    // 4. Fallback default to Nagpur center (Sitabuldi)
    const defaultCenter = nagpurZones[0];
    const fallback = {
      name: query.trim(),
      latitude: defaultCenter.center.latitude,
      longitude: defaultCenter.center.longitude,
      displayName: `${query.trim()} (Approximated to Nagpur Central)`,
      source: 'fallback'
    };
    return fallback;
  }

  /**
   * Find nearest Nagpur zone from database or predefined list
   * @param {number} lat 
   * @param {number} lon 
   * @param {Array} zonesList 
   */
  static findNearestZone(lat, lon, zonesList = nagpurZones) {
    if (!zonesList || zonesList.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const zone of zonesList) {
      const center = zone.center || { latitude: zone.latitude, longitude: zone.longitude };
      const distance = this.haversineDistance(lat, lon, center.latitude, center.longitude);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = zone;
      }
    }

    return {
      zone: nearest,
      distanceKm: Math.round(minDistance * 100) / 100
    };
  }
}

module.exports = GeocodingService;
