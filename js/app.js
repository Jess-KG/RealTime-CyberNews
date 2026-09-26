console.log("loaded the library")

import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';
import { incidents, severities } from './data.js';
const socket = new WebSocket('ws://localhost:3001');
socket.onopen = () => {
  console.log("WebSocket connected!");
};

socket.onerror = (error) => {
  console.log("WebSocket error:", error);
};

socket.onclose = () => {
  console.log("WebSocket closed");
};
socket.onmessage = (event) => {

  const articleData = JSON.parse(event.data);

  console.log("received an article...");

  console.log(articleData);

  const intelligence = articleData.intelligence;
  const article = articleData.article;

  // Create an incident from the live intelligence
  const incident = {
    id: article.link,
    country: intelligence.country,
    city: intelligence.city,
    coordinates: intelligence.coordinates,
    threat: intelligence.threat,
    severity: intelligence.severity,
    sector: intelligence.sector,
    status: "ACTIVE",
    source: article.link,
    eventType: intelligence.event_type,
    image: article.image
  };

  addIncident(incident);

};

function addIncident(target) {

  const el = document.createElement('div');

  el.className = 'cyber-marker';
  el.dataset.id = target.id;

  if (target.image) {

    el.innerHTML = `
        <img 
            src="${target.image}" 
            alt=""
        >
    `;

  }

  const markerColor = severities[target.severity] || '#00E5FF';

  el.style.background = markerColor;
  el.style.boxShadow = `0 0 8px ${markerColor}`;


  // Create popup
  const popup = new maplibregl.Popup({
    offset: 25,
    closeButton: true,
    closeOnClick: true
  }).setHTML(`

        <div class="threat-popup" data-id="${target.id}">
            ${target.image ? `
            <img 
                class="popup-image"
                src="${target.image}"
                alt=""
            >
        ` : ''}
            <div class="popup-header">
                <span class="popup-status"></span>
                THREAT DETECTED
            </div>

            <div class="popup-country">
                ${target.city || target.country || "UNKNOWN"}
            </div>

            <div class="popup-grid">

                <div>
                    <span>TYPE</span>
                    <strong>${target.threat || target.eventType || "UNKNOWN"}</strong>
                </div>

                <div>
                    <span>SEVERITY</span>
                    <strong>${target.severity || "UNKNOWN"}</strong>
                </div>

                <div>
                    <span>SECTOR</span>
                    <strong>${target.sector || "UNKNOWN"}</strong>
                </div>

                <div>
                    <span>STATUS</span>
                    <strong>${target.status}</strong>
                </div>

                <div>
                    <span>SOURCE</span>
                    <strong>
                        <a href="${target.source}" target="_blank">
                            ARTICLE
                        </a>
                    </strong>
                </div>

            </div>

        </div>
    `);


  // Only create a map marker if we actually have coordinates
  if (target.coordinates) {

    new maplibregl.Marker({ element: el })
      .setLngLat(target.coordinates)
      .setPopup(popup)
      .addTo(map);

  }


  // Create event card
  const eventCard = document.createElement('div');

  eventCard.className = 'event-card';
  eventCard.dataset.id = target.id;

  eventCard.innerHTML = `

        <div class="event-card-header">

            <span class="event-country">
                ${target.city || target.country || "UNKNOWN"}
            </span>

            <span
                class="event-severity"
                style="color:${markerColor}"
            >
                ${target.severity || "UNKNOWN"}
            </span>

        </div>

        <div class="event-threat">
            ${target.threat || target.eventType || "UNKNOWN"}
        </div>

        <div class="event-details">

            <div>
                <span>SECTOR</span>
                <strong>${target.sector || "UNKNOWN"}</strong>
            </div>

            <div>
                <span>STATUS</span>
                <strong>${target.status}</strong>
            </div>

            <div>
                <span>SOURCE</span>
                <strong>
                    <a href="${target.source}" target="_blank">
                        ARTICLE
                    </a>
                </strong>
            </div>

        </div>
    `;


  // Card click
  eventCard.addEventListener('click', () => {

    document.querySelectorAll('.event-card').forEach(card => {
      card.classList.remove('selected');
    });

    eventCard.classList.add('selected');

    const id = eventCard.dataset.id;

    if (!target.coordinates) {
      return;
    }

    map.flyTo({
      center: target.coordinates
    });

    const marker = document.querySelector(
      `.cyber-marker[data-id="${id}"]`
    );

    if (marker) {
      marker.click();
    }

  });


  eventsList.appendChild(eventCard);

}

const map = new maplibregl.Map({
  container: 'map', // container id
  style: 'https://demotiles.maplibre.org/style.json', // style URL
  center: [0, 0], // starting position [lng, lat]
  zoom: 1, // starting zoom
  maplibreLogo: true
});

map.on('load', () => {
  map.setPaintProperty(
    "background",
    'background-color',
    '#03060A'
  );
  map.setPaintProperty(
    'coastline',
    'line-color',
    '#164A5A'
  );
  map.setPaintProperty(
    'countries-fill',
    'fill-color',
    '#111C26'
  );
  map.setPaintProperty(
    'countries-boundary',
    'line-color',
    '#00E5FF'
  );

  map.setLayoutProperty(
    'geolines',
    'visibility',
    'none'
  );

  map.setLayoutProperty(
    'geolines-label',
    'visibility',
    'none'
  );
})

const eventsList = document.getElementById("events-list");

// incidents.forEach(target => {
//     const el = document.createElement('div');
//     el.className = 'cyber-marker';
//     el.dataset.id = target.id;
//     el.style.background = severities[target.severity];
//     el.style.boxShadow = `0 0 8px ${severities[target.severity]}`;

//     // Create popup
//     const popup = new maplibregl.Popup({
//         offset: 25,
//         closeButton: true,
//         closeOnClick: true
//     }).setHTML(`
//               <div class="threat-popup" data-id="${target.id}">
//                 <div class="popup-header">
//                   <span class="popup-status"></span>
//                   THREAT DETECTED
//                 </div>

//                 <div class="popup-country">
//                   ${target.country}
//                 </div>

//                 <div class="popup-grid">
//                   <div>
//                     <span>TYPE</span>
//                     <strong>${target.threat}</strong>
//                   </div>

//                   <div>
//                     <span>SEVERITY</span>
//                     <strong>${target.severity}</strong>
//                   </div>

//                   <div>
//                     <span>SECTOR</span>
//                     <strong>${target.sector}</strong>
//                   </div>

//                   <div>
//                     <span>STATUS</span>
//                     <strong>${target.status}</strong>
//                   </div>

//                   <div>
//                     <span>SOURCE</span>
//                     <strong>${target.source}</strong>
//                   </div>
//                 </div>
//               </div>
//               `);

//     // Add marker
//     new maplibregl.Marker({ element: el })
//         .setLngLat(target.coordinates)
//         .setPopup(popup)
//         .addTo(map);


//     const eventCard = document.createElement('div');
//     eventCard.className = 'event-card';
//     eventCard.dataset.id = target.id;

//     eventCard.innerHTML = `

//               <div class="event-card-header">
//                 <span class="event-country">${target.country}</span>
//                 <span class="event-severity" style="color:${severities[target.severity]}">${target.severity}</span>
//               </div>

//               <div class="event-threat">
//                 ${target.threat}
//               </div>

//               <div class="event-details">
//                 <div>
//                   <span>SECTOR</span>
//                   <strong>${target.sector}</strong>
//                 </div>

//                 <div>
//                   <span>STATUS</span>
//                   <strong>${target.status}</strong>
//                 </div>

//                 <div>
//                   <span>SOURCE</span>
//                   <strong>${target.source}</strong>
//                 </div>
//               </div>`

//     eventCard.addEventListener('click', () => {
//         document.querySelectorAll('.event-card').forEach(card => {
//             card.classList.remove('selected');
//         });

//         eventCard.classList.add('selected');
//         const id = eventCard.dataset.id;
//         const incident = incidents.find(target => target.id == id);
//         console.log(incident.id);
//         map.flyTo({
//             center: incident.coordinates
//         });

//         const marker = document.querySelector(
//             `.cyber-marker[data-id="${id}"]`
//         );

//         marker.click();
//     })
//     eventsList.appendChild(eventCard);
// })
// Create marker element

