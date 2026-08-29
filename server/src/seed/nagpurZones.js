/**
 * Predefined Nagpur Zones with accurate coordinates and zone-level adjacency relationships.
 * Total: 24 realistic Nagpur localities.
 */

const nagpurZones = [
  {
    name: "Sitabuldi",
    center: { latitude: 21.1466, longitude: 79.0833 },
    neighbors: ["Dharampeth", "Ramdaspeth", "Dhantoli", "Civil Lines", "Mahal"]
  },
  {
    name: "Dharampeth",
    center: { latitude: 21.1428, longitude: 79.0624 },
    neighbors: ["Sitabuldi", "Ramdaspeth", "Civil Lines", "Laxmi Nagar", "Gokulpeth"]
  },
  {
    name: "Gokulpeth",
    center: { latitude: 21.1392, longitude: 79.0551 },
    neighbors: ["Dharampeth", "Laxmi Nagar", "Trimurti Nagar", "Wadi"]
  },
  {
    name: "Civil Lines",
    center: { latitude: 21.1558, longitude: 79.0722 },
    neighbors: ["Sitabuldi", "Dharampeth", "Sadar", "Katol Road"]
  },
  {
    name: "Sadar",
    center: { latitude: 21.1633, longitude: 79.0838 },
    neighbors: ["Civil Lines", "Sitabuldi", "Jaripatka", "Mankapur", "Mahal"]
  },
  {
    name: "Ramdaspeth",
    center: { latitude: 21.1354, longitude: 79.0754 },
    neighbors: ["Sitabuldi", "Dharampeth", "Dhantoli", "Laxmi Nagar"]
  },
  {
    name: "Dhantoli",
    center: { latitude: 21.1345, longitude: 79.0841 },
    neighbors: ["Sitabuldi", "Ramdaspeth", "Medical Square", "Reshimbagh"]
  },
  {
    name: "Mahal",
    center: { latitude: 21.1442, longitude: 79.1022 },
    neighbors: ["Sitabuldi", "Itwari", "Gandhibagh", "Reshimbagh", "Sadar"]
  },
  {
    name: "Itwari",
    center: { latitude: 21.1539, longitude: 79.1128 },
    neighbors: ["Mahal", "Gandhibagh", "Wardhaman Nagar", "Jaripatka"]
  },
  {
    name: "Gandhibagh",
    center: { latitude: 21.1495, longitude: 79.1065 },
    neighbors: ["Mahal", "Itwari", "Wardhaman Nagar", "Reshimbagh"]
  },
  {
    name: "Wardhaman Nagar",
    center: { latitude: 21.1481, longitude: 79.1303 },
    neighbors: ["Gandhibagh", "Itwari", "Nandanvan"]
  },
  {
    name: "Reshimbagh",
    center: { latitude: 21.1305, longitude: 79.1031 },
    neighbors: ["Dhantoli", "Mahal", "Medical Square", "Sakkardara"]
  },
  {
    name: "Medical Square",
    center: { latitude: 21.1278, longitude: 79.0924 },
    neighbors: ["Dhantoli", "Reshimbagh", "Sakkardara", "Ramdaspeth"]
  },
  {
    name: "Sakkardara",
    center: { latitude: 21.1221, longitude: 79.1114 },
    neighbors: ["Reshimbagh", "Medical Square", "Nandanvan", "Manish Nagar"]
  },
  {
    name: "Nandanvan",
    center: { latitude: 21.1341, longitude: 79.1272 },
    neighbors: ["Sakkardara", "Wardhaman Nagar", "Reshimbagh"]
  },
  {
    name: "Laxmi Nagar",
    center: { latitude: 21.1235, longitude: 79.0645 },
    neighbors: ["Dharampeth", "Gokulpeth", "Ramdaspeth", "Pratap Nagar", "Khamla"]
  },
  {
    name: "Pratap Nagar",
    center: { latitude: 21.1165, longitude: 79.0558 },
    neighbors: ["Laxmi Nagar", "Trimurti Nagar", "Khamla", "Hingna T-Point"]
  },
  {
    name: "Trimurti Nagar",
    center: { latitude: 21.1192, longitude: 79.0435 },
    neighbors: ["Gokulpeth", "Pratap Nagar", "Hingna T-Point", "Wadi"]
  },
  {
    name: "Khamla",
    center: { latitude: 21.1124, longitude: 79.0682 },
    neighbors: ["Laxmi Nagar", "Pratap Nagar", "Manish Nagar"]
  },
  {
    name: "Manish Nagar",
    center: { latitude: 21.0894, longitude: 79.0782 },
    neighbors: ["Khamla", "Sakkardara", "Hingna T-Point"]
  },
  {
    name: "Jaripatka",
    center: { latitude: 21.1825, longitude: 79.0931 },
    neighbors: ["Sadar", "Mankapur", "Itwari", "Koradi Naka"]
  },
  {
    name: "Mankapur",
    center: { latitude: 21.1895, longitude: 79.0775 },
    neighbors: ["Sadar", "Jaripatka", "Koradi Naka", "Katol Road"]
  },
  {
    name: "Katol Road",
    center: { latitude: 21.1712, longitude: 79.0588 },
    neighbors: ["Civil Lines", "Mankapur", "Wadi"]
  },
  {
    name: "Wadi",
    center: { latitude: 21.1504, longitude: 79.0125 },
    neighbors: ["Gokulpeth", "Trimurti Nagar", "Katol Road", "Hingna T-Point"]
  }
];

module.exports = nagpurZones;
