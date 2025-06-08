// create the map
var map = L.map('map').setView([41.2053, 29.0745], 13); // Centered at Koç University Main Campus with zoom level 13
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    minZoom: 3,
    maxZoom: 18
}).addTo(map);

// Add icon
var kocIcon = L.divIcon({className: 'c-icon c-icon__koc', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25]});
var buildingIcon = L.divIcon({className: 'c-icon c-icon__building', iconSize: [20, 20], iconAnchor: [10, 20], popupAnchor: [0, -15]});

// Store markers
var markers = {};
var campusMarkers = [];
var buildingMarkerGroups = {};

// Fetch and process the JSON data
fetch('map.json')
    .then(response => response.json())
    .then(data => {
        // Generate the sidebar navigation
        generateSidebar(data);
        
        // Process campuses
        data.campuses.forEach(campus => {
            // Create campus marker but don't add to map yet
            var campusMarker = L.marker(campus.coordinates, {
                icon: kocIcon, 
                title: campus.id
            }).bindPopup("<b>" + campus.name + "</b>");
            
            campusMarkers.push(campusMarker);
            markers[campus.id] = campusMarker;
            
            // Create a group for this campus's buildings
            buildingMarkerGroups[campus.id] = [];

            // Process buildings for this campus
            campus.buildings.forEach(building => {
                // Create a more detailed popup content
                var popupContent = `
                    <div class="marker-popup">
                        <h3>${building.name}</h3>
                    </div>
                `;
                
                var buildingMarker = L.marker(building.coordinates, {
                    icon: buildingIcon, 
                    title: building.id
                }).bindPopup(popupContent);
                
                // Store marker but don't add to map yet
                markers[building.id] = buildingMarker;
                buildingMarkerGroups[campus.id].push(buildingMarker);
            });
        });
        
        // Set up event handlers for sidebar links after they're generated
        initializeSidebarEventHandlers();
    })
    .catch(error => {
        console.error('Error loading the map data:', error);
    });

// Function to generate sidebar from JSON data
function generateSidebar(data) {
    const sidebarContainer = document.getElementById('dynamic-sidebar');
    let sidebarHTML = '';
    
    // Process each campus
    data.campuses.forEach(campus => {
        sidebarHTML += `
        <li class="c-nav__item">
          <h2>${campus.name}</h2>
          <ul class="c-nav__sub">
            <li><a href="#" id="${campus.id}">${campus.id.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Overview</a></li>
        `;
        
        // Add building links
        campus.buildings.forEach(building => {
            sidebarHTML += `<li><a href="#" id="${building.id}">${building.name}</a></li>`;
        });
        
        sidebarHTML += `
          </ul>
        </li>
        `;
    });
    
    // Insert the generated HTML into the sidebar container
    sidebarContainer.innerHTML = sidebarHTML;
}

// Initialize event handlers for the dynamically generated sidebar
function initializeSidebarEventHandlers() {
    // Handle clicks on sidebar links
    $("a").click(function() {
        var id = $(this)[0].id;
        
        // First, remove all markers from the map
        hideAllMarkers();
        
        // For any link, we'll show exactly ONE marker (the one that corresponds to the ID)
        if (markers[id]) {
            // Add the marker to the map
            markers[id].addTo(map);
            
            // Apply a short delay before opening the popup
            setTimeout(function() {
                markers[id].openPopup();
            }, 50);
        }
        
        // Update the highlighting in the sidebar
        $('a').removeClass("j-is-highlight");
        $(this).addClass("j-is-highlight");
    });

    // Open sub menus
    $('h2').click(function(e) {
        $(this).next(".c-nav__sub").toggleClass('j-is-open');
        $(this).closest(".c-nav__item").toggleClass('j-is-active');
    });
}

// Animate marker zoom and coordinates
map.on('popupopen', function(centerMarker) {
    var cM = map.project(centerMarker.popup._latlng);
    cM.y -= centerMarker.popup._container.clientHeight/2
    map.setView(map.unproject(cM), 17, {animate: true});
});

// Hide all markers
function hideAllMarkers() {
    for (var id in markers) {
        if (map.hasLayer(markers[id])) {
            map.removeLayer(markers[id]);
        }
    }
}