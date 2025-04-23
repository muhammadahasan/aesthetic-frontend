// Coordinates for 26 Burn Road, UK (approximate - you may want to geocode for exact location)
const burnRoadLocation = [53.4808, -2.2426]; // Manchester area coordinates (example)

// Initialize the map centered on this location
const map = L.map("map").setView(burnRoadLocation, 16); // Zoom level 16 for street view

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

// Add a custom marker
const customIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Marker icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Add marker with popup
L.marker(burnRoadLocation, { icon: customIcon })
  .addTo(map)
  .bindPopup(
    `
        <b>26 Burn Road</b><br>
        Manchester, UK
    `
  )
  .openPopup();

// Optionally add a circle to highlight the area
L.circle(burnRoadLocation, {
  color: "#3388ff",
  fillColor: "#3388ff",
  fillOpacity: 0.2,
  radius: 100, // 100 meters radius
})
  .addTo(map)
  .bindPopup("Approximate location area");
