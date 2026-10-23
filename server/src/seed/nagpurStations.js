/**
 * Nagpur Police Station Catchment Representations
 * 35 official stations from Nagpur City Police Crime Data
 * 
 * Note: Coordinates represent approximate station marker locations for safety corridor decision-support.
 * Coordinate type is explicitly designated as 'approximate_station_marker'.
 */

const nagpurStations = [
  {
    name: "Ajni Police Station",
    center: { latitude: 21.1215, longitude: 79.0833 },
    neighbors: ["Dhantoli Police Station", "Imambada Police Station", "Sakkardara Police Station", "Bajaj Nagar Police Station", "Hudkeshwar Police Station"]
  },
  {
    name: "Bajaj Nagar Police Station",
    center: { latitude: 21.1250, longitude: 79.0600 },
    neighbors: ["Ajni Police Station", "Dhantoli Police Station", "Rana Pratap Nagar Police Station", "Sitabuldi Police Station"]
  },
  {
    name: "Bhandara Road Police Station",
    center: { latitude: 21.1600, longitude: 79.1600 },
    neighbors: ["Pardi Police Station", "Kalamna Police Station", "Lakadganj Police Station", "Fursungi Police Station"]
  },
  {
    name: "Bharsingi Police Station",
    center: { latitude: 21.2800, longitude: 78.7000 },
    neighbors: ["Wadi Police Station", "Gittikhadan Police Station"]
  },
  {
    name: "Cotton Market Police Station",
    center: { latitude: 21.1440, longitude: 79.0920 },
    neighbors: ["Ganeshpeth Police Station", "Sitabuldi Police Station", "Kotwali Police Station", "Dhantoli Police Station"]
  },
  {
    name: "Dhantoli Police Station",
    center: { latitude: 21.1345, longitude: 79.0841 },
    neighbors: ["Sitabuldi Police Station", "Ajni Police Station", "Bajaj Nagar Police Station", "Imambada Police Station", "Cotton Market Police Station"]
  },
  {
    name: "Fursungi Police Station",
    center: { latitude: 21.1700, longitude: 79.1800 },
    neighbors: ["Bhandara Road Police Station", "Pardi Police Station", "Kalamna Police Station"]
  },
  {
    name: "Ganeshpeth Police Station",
    center: { latitude: 21.1450, longitude: 79.0950 },
    neighbors: ["Cotton Market Police Station", "Kotwali Police Station", "Sitabuldi Police Station", "Tehsil Police Station"]
  },
  {
    name: "Gittikhadan Police Station",
    center: { latitude: 21.1700, longitude: 79.0500 },
    neighbors: ["Sadar Police Station", "Koradi Police Station", "Zingabai Takli Police Station", "Wadi Police Station"]
  },
  {
    name: "Hingna Police Station",
    center: { latitude: 21.0800, longitude: 78.9800 },
    neighbors: ["Wadi Police Station", "Sonegaon Police Station", "Rana Pratap Nagar Police Station"]
  },
  {
    name: "Hudkeshwar Police Station",
    center: { latitude: 21.0950, longitude: 79.1200 },
    neighbors: ["Sakkardara Police Station", "Nandanvan Police Station", "Ajni Police Station"]
  },
  {
    name: "Imambada Police Station",
    center: { latitude: 21.1320, longitude: 79.0950 },
    neighbors: ["Dhantoli Police Station", "Sakkardara Police Station", "Ajni Police Station", "Kotwali Police Station"]
  },
  {
    name: "Indora Police Station",
    center: { latitude: 21.1750, longitude: 79.0950 },
    neighbors: ["Pachpaoli Police Station", "Jaripatka Police Station", "Kapil Nagar Police Station", "Tehsil Police Station"]
  },
  {
    name: "Jaripatka Police Station",
    center: { latitude: 21.1850, longitude: 79.0900 },
    neighbors: ["Indora Police Station", "Kapil Nagar Police Station", "Koradi Police Station", "Sadar Police Station"]
  },
  {
    name: "Kalamna Police Station",
    center: { latitude: 21.1750, longitude: 79.1450 },
    neighbors: ["Pardi Police Station", "Yashodhara Nagar Police Station", "Lakadganj Police Station", "Bhandara Road Police Station", "Kamptee Police Station"]
  },
  {
    name: "Kamptee Police Station",
    center: { latitude: 21.2250, longitude: 79.1950 },
    neighbors: ["Kalamna Police Station", "Yashodhara Nagar Police Station", "Koradi Police Station"]
  },
  {
    name: "Kapil Nagar Police Station",
    center: { latitude: 21.1950, longitude: 79.1100 },
    neighbors: ["Jaripatka Police Station", "Yashodhara Nagar Police Station", "Koradi Police Station", "Indora Police Station"]
  },
  {
    name: "Koradi Police Station",
    center: { latitude: 21.2400, longitude: 79.0950 },
    neighbors: ["Jaripatka Police Station", "Kapil Nagar Police Station", "Zingabai Takli Police Station", "Gittikhadan Police Station", "Kamptee Police Station"]
  },
  {
    name: "Kotwali Police Station",
    center: { latitude: 21.1470, longitude: 79.1050 },
    neighbors: ["Ganeshpeth Police Station", "Tehsil Police Station", "Lakadganj Police Station", "Sakkardara Police Station", "Cotton Market Police Station"]
  },
  {
    name: "Lakadganj Police Station",
    center: { latitude: 21.1520, longitude: 79.1250 },
    neighbors: ["Kotwali Police Station", "Tehsil Police Station", "Wardhaman Nagar Police Station", "Kalamna Police Station", "Pardi Police Station"]
  },
  {
    name: "Mahalgaon Police Station",
    center: { latitude: 21.1200, longitude: 79.1900 },
    neighbors: ["Pardi Police Station", "Nandanvan Police Station", "Bhandara Road Police Station"]
  },
  {
    name: "Manish Nagar Police Station",
    center: { latitude: 21.0920, longitude: 79.0700 },
    neighbors: ["Sonegaon Police Station", "Ajni Police Station", "Rana Pratap Nagar Police Station"]
  },
  {
    name: "Nandanvan Police Station",
    center: { latitude: 21.1350, longitude: 79.1350 },
    neighbors: ["Sakkardara Police Station", "Lakadganj Police Station", "Hudkeshwar Police Station", "Pardi Police Station", "Wardhaman Nagar Police Station"]
  },
  {
    name: "Pachpaoli Police Station",
    center: { latitude: 21.1680, longitude: 79.1080 },
    neighbors: ["Indora Police Station", "Tehsil Police Station", "Yashodhara Nagar Police Station", "Sadar Police Station"]
  },
  {
    name: "Pardi Police Station",
    center: { latitude: 21.1550, longitude: 79.1550 },
    neighbors: ["Lakadganj Police Station", "Kalamna Police Station", "Bhandara Road Police Station", "Nandanvan Police Station", "Mahalgaon Police Station"]
  },
  {
    name: "Rana Pratap Nagar Police Station",
    center: { latitude: 21.1150, longitude: 79.0550 },
    neighbors: ["Bajaj Nagar Police Station", "Sonegaon Police Station", "Hingna Police Station", "Manish Nagar Police Station"]
  },
  {
    name: "Sadar Police Station",
    center: { latitude: 21.1633, longitude: 79.0838 },
    neighbors: ["Sitabuldi Police Station", "Gittikhadan Police Station", "Jaripatka Police Station", "Pachpaoli Police Station"]
  },
  {
    name: "Sakkardara Police Station",
    center: { latitude: 21.1230, longitude: 79.1120 },
    neighbors: ["Ajni Police Station", "Hudkeshwar Police Station", "Nandanvan Police Station", "Kotwali Police Station", "Imambada Police Station"]
  },
  {
    name: "Sitabuldi Police Station",
    center: { latitude: 21.1466, longitude: 79.0833 },
    neighbors: ["Sadar Police Station", "Dhantoli Police Station", "Bajaj Nagar Police Station", "Cotton Market Police Station", "Ganeshpeth Police Station"]
  },
  {
    name: "Sonegaon Police Station",
    center: { latitude: 21.0850, longitude: 79.0600 },
    neighbors: ["Manish Nagar Police Station", "Rana Pratap Nagar Police Station", "Hingna Police Station"]
  },
  {
    name: "Tehsil Police Station",
    center: { latitude: 21.1580, longitude: 79.1080 },
    neighbors: ["Kotwali Police Station", "Ganeshpeth Police Station", "Pachpaoli Police Station", "Lakadganj Police Station", "Indora Police Station"]
  },
  {
    name: "Wadi Police Station",
    center: { latitude: 21.1500, longitude: 79.0100 },
    neighbors: ["Gittikhadan Police Station", "Hingna Police Station", "Bharsingi Police Station"]
  },
  {
    name: "Wardhaman Nagar Police Station",
    center: { latitude: 21.1500, longitude: 79.1380 },
    neighbors: ["Lakadganj Police Station", "Pardi Police Station", "Kalamna Police Station", "Nandanvan Police Station"]
  },
  {
    name: "Yashodhara Nagar Police Station",
    center: { latitude: 21.1900, longitude: 79.1300 },
    neighbors: ["Kapil Nagar Police Station", "Kalamna Police Station", "Indora Police Station", "Pachpaoli Police Station", "Kamptee Police Station"]
  },
  {
    name: "Zingabai Takli Police Station",
    center: { latitude: 21.1950, longitude: 79.0650 },
    neighbors: ["Koradi Police Station", "Gittikhadan Police Station", "Jaripatka Police Station"]
  }
];

module.exports = nagpurStations;
