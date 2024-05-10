// Global application state
const app = {
    map: null,
    directionsService: null,
    directionsDisplay: null,
    geocoder: new google.maps.Geocoder(),
    distanceMatrixService: new google.maps.DistanceMatrixService(),
    markers: [null, null], // Markers for the starting and ending location
    inputs: {
        location1: document.getElementById('location1'),
        location2: document.getElementById('location2'),
    },
};

function initializeMap() {
    if (!navigator.geolocation) {
        alert('Error: Your browser doesn\'t support geolocation.');
        return;
    }

    showLoadingIndicator();

    navigator.geolocation.getCurrentPosition(position => {
        hideLoadingIndicator();
        const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        initMap(userLocation);
        initAutocomplete();
        setEventListeners();
    }, error => {
        hideLoadingIndicator();
        handleGeolocationError(error);
    });
}

function initMap(location) {
    app.map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 10,
    });

    app.directionsService = new google.maps.DirectionsService();
    app.directionsDisplay = new google.maps.DirectionsRenderer({
        map: app.map,
        suppressMarkers: true,
        provideRouteAlternatives: true,
    });

    // Place initial markers
    placeMarker(location, 0, 'Current Location');
    placeMarker(location, 1, 'Enter Second Location'); // Placeholder, adjust as needed
}
function setCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            app.geocoder.geocode({ 'location': latLng }, function(results, status) {
                if (status == 'OK') {
                    if (results[0]) {
                        app.inputs.location1.value = results[0].formatted_address;
                        app.markers[0].setPosition(latLng); // Assuming the first marker is for the current location
                        app.map.setCenter(latLng);
                        calculateAndDisplayRoute();
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });
        }, function() {
            alert('Error: The Geolocation service failed.');
        });
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

function initAutocomplete() {
    ['location1', 'location2'].forEach((id, index) => {
        const autocomplete = new google.maps.places.Autocomplete(app.inputs[id], {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'IN' },
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                console.error("Autocomplete's place contains no geometry");
                return;
            }
            const location = place.geometry.location;
            app.inputs[id].value = place.formatted_address;
            placeMarker(location, index);
            if (index === 0) { // If it's the first location, adjust map center
                app.map.setCenter(location);
            }
        });
    });
}

function setEventListeners() {
    // Map click event: Add a marker on the map where the user clicks
    app.map.addListener('click', event => {
        // Assuming the click adds/updates the second marker and updates the input field
        placeMarker(event.latLng, 1, 'Enter Second Location');
        updateInputField(event.latLng, 'location2');
        calculateAndDisplayRoute();
    });

    // Input change events: Update markers and recalculate the route when input fields change
    app.inputs.location1.addEventListener('change', () => {
        geocodeAndPlaceMarker(app.inputs.location1.value, 0);
    });
    app.inputs.location2.addEventListener('change', () => {
        geocodeAndPlaceMarker(app.inputs.location2.value, 1);
    });

    // Dragend event for markers: Update the corresponding input field when a marker is dragged
    app.markers.forEach((marker, index) => {
        if (!marker) return;
        marker.addListener('dragend', () => {
            const position = marker.getPosition();
            updateInputField(position, index === 0 ? 'location1' : 'location2');
            calculateAndDisplayRoute();
        });
    });
}

function updateInputField(latLng, inputId) {
    app.geocoder.geocode({ 'location': latLng }, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                document.getElementById(inputId).value = results[0].formatted_address;
            } else {
                console.error('No results found');
            }
        } else {
            console.error('Geocoder failed due to: ' + status);
        }
    });
}

function geocodeAndPlaceMarker(address, markerIndex) {
    app.geocoder.geocode({ 'address': address }, (results, status) => {
        if (status === 'OK') {
            const location = results[0].geometry.location;
            placeMarker(location, markerIndex, markerIndex === 0 ? 'Current Location' : 'Enter Second Location');
            if (markerIndex === 0) { // Center map on the first marker
                app.map.setCenter(location);
            }
            calculateAndDisplayRoute();
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}
// Route Display Module
function displayRoute(origin, destination) {
    if (!origin || !destination) {
        console.error('Cannot display route: origin or destination is null');
        return;
    }
    app.directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING, // You can allow users to select travel mode
    }, function(response, status) {
        if (status === 'OK') {
            app.directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function calculateAndDisplayRoute() {
    if (!app.markers[0] || !app.markers[1]) return; // Ensure both markers are placed
    const origin = app.markers[0].getPosition();
    const destination = app.markers[1].getPosition();

    app.directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        if (status === 'OK') {
            app.directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

// Note: Make sure to initialize markers array with actual google.maps.Marker instances
// or adjust the logic in setEventListeners to check if markers[index] exists before adding a listener.


function placeMarker(location, index, title = '') {
    if (app.markers[index]) {
        app.markers[index].setPosition(location);
    } else {
        app.markers[index] = new google.maps.Marker({
            position: location,
            map: app.map,
            title: title,
            draggable: true,
        });

        app.markers[index].addListener('dragend', () => {
            // Handle drag end if necessary
            console.log(`Marker ${index} moved to: ${app.markers[index].getPosition()}`);
        });
    }
}

function showLoadingIndicator() {
    let loadingIndicator = document.getElementById('loadingIndicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.left = '0';
        loadingIndicator.style.top = '0';
        loadingIndicator.style.width = '100%';
        loadingIndicator.style.height = '100%';
        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.justifyContent = 'center';
        loadingIndicator.style.alignItems = 'center';
        loadingIndicator.style.zIndex = '1000';
        loadingIndicator.innerHTML = `<div style="padding: 20px; background: white; border-radius: 5px;">Loading...</div>`;
        document.body.appendChild(loadingIndicator);
    } else {
        loadingIndicator.style.display = 'flex';
    }
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function handleGeolocationError(error) {
    let errorMessage = 'An unknown error occurred.';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for Geolocation.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
    }
    console.error('Geolocation error:', errorMessage);
    alert(`Geolocation Error: ${errorMessage}`);
}
// Error Handling Module
function showErrorMessage(type) {
    const messages = {
        'permissionDenied': 'User denied the request for Geolocation.',
        'positionUnavailable': 'Location information is unavailable.',
        'timeout': 'The request to get user location timed out.',
        'unknownError': 'An unknown error occurred.'
    };
    alert(`Error: ${messages[type]}`);
    console.error(`Geolocation error: ${messages[type]}`);
}
// Function to initialize the map
function initMapWithLocation(latitude, longitude) {
    const mapOptions = {
        center: new google.maps.LatLng(latitude, longitude),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    // Create a new map instance
    app.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // Create the Directions Service and Directions Renderer instances
    app.directionsService = new google.maps.DirectionsService();
    app.directionsDisplay = new google.maps.DirectionsRenderer({
        map: app.map,
        suppressMarkers: true, // We are creating custom markers
    });

    // Create markers on the map for the current and destination locations
    createMarker({ lat: latitude, lng: longitude }, 'Current Location', true); // Current location marker
    createMarker({ lat: latitude, lng: longitude }, 'Enter Second Location', false); // Destination marker as a placeholder

    // Additional initialization code can go here (e.g., event listeners, UI setup)
}

// Function to create a marker on the map
function createMarker(position, title, isDraggable) {
    const marker = new google.maps.Marker({
        map: app.map,
        position: position,
        title: title,
        draggable: isDraggable
    });

    // Store the marker in our global state
    app.markers.push(marker);

    // If the marker is draggable, listen for dragend event to update location
    if (isDraggable) {
        google.maps.event.addListener(marker, 'dragend', function (event) {
            // You can handle the dragend event here
            // For example, update the location input fields
            console.log(`Marker dragged to: ${event.latLng.lat()}, ${event.latLng.lng()}`);
        });
    }
}
// Assume there's an HTML element with id='map' in your document
// Initialization
window.onload = function () {
    // Initialize the map with a given latitude and longitude, for example, New York City
    initMapWithLocation(40.7128, -74.0060);
};
// Markers Management Module
function addOrUpdateMarker(inputId, position, title) {
    const index = inputId === 'location1' ? 0 : 1;
    if (app.markers[index]) {
        // Update the position of the existing marker
        app.markers[index].setPosition(position);
    } else {
        // Create a new marker and add it to the map
        app.markers[index] = new google.maps.Marker({
            map: app.map,
            position: position,
            title: title,
            draggable: true, // Assuming you want the marker to be draggable
        });

        // Optionally set up a 'dragend' event listener for the marker
        app.markers[index].addListener('dragend', function() {
            const newPosition = app.markers[index].getPosition();
            handleMarkerDrag(inputId, newPosition);
        });
    }
}

function removeMarkers() {
    // Remove all markers from the map and clear the array
    app.markers.forEach(marker => {
        if (marker) {
            marker.setMap(null);
        }
    });
    app.markers = [];
}



// Location Handling Module
function handlePlaceChanged(inputId) {
    const place = app.autocomplete[inputId].getPlace();
    if (!place.geometry) {
        window.alert("Autocomplete's place contains no geometry");
        return;
    }
    // If the place has a geometry, present it on a map.
    if (place.geometry.viewport) {
        app.map.fitBounds(place.geometry.viewport);
    } else {
        app.map.setCenter(place.geometry.location);
        app.map.setZoom(17);
    }
    
    // Add or update the marker on the map
    addOrUpdateMarker(inputId, place.geometry.location, place.name);
    // Update the input fields
    app.inputs[inputId].value = place.formatted_address;
}

// You will need to call this function somewhere in your code to handle when the place is changed.
// For example:
// app.autocomplete['location1'].addListener('place_changed', () => handlePlaceChanged('location1'));
// app.autocomplete['location2'].addListener('place_changed', () => handlePlaceChanged('location2'));
// Function to geocode a location
function geocodeLocation(geocoder, location, callback) {
    geocoder.geocode({ 'address': location }, function (results, status) {
        if (status === 'OK') {
            // Invoke the callback function with the geocoded coordinates
            callback(results[0].geometry.location);
        } else {
            // Log an error message or invoke the callback with null to indicate failure
            console.error('Geocode was not successful for the following reason:', status);
            callback(null);
        }
    });
}

// UI Updates Module

// Resets the selection of transportation buttons
function resetTransportationButtonSelection() {
    const buttons = document.querySelectorAll('.transportation-button');
    buttons.forEach(button => {
        button.classList.remove('selected');
    });
}

// Shows a message while searching, with an option to cancel the search
function showSearchingMessage(cancelCallback) {
    const overlay = document.createElement('div');
    overlay.id = 'searchingOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    const messageContainer = document.createElement('div');
    messageContainer.innerText = 'Searching for drivers...';
    overlay.appendChild(messageContainer);

    if (typeof cancelCallback === 'function') {
        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.onclick = function () {
            overlay.remove();
            cancelCallback();
        };
        overlay.appendChild(cancelButton);
    }

    document.body.appendChild(overlay);
}

// Enables all buttons that were previously disabled
function enableButtons() {
    const buttons = document.querySelectorAll('.transportation-button, #find-driver-button');
    buttons.forEach(button => {
        button.disabled = false;
    });
}

// Disables all buttons to prevent multiple submissions
function disableButtons() {
    const buttons = document.querySelectorAll('.transportation-button, #find-driver-button');
    buttons.forEach(button => {
        button.disabled = true;
    });
}
// Assuming pricing per kilometer for different modes of transport
const pricingPerKm = {
    CAR: 20,
    SUV: 30,
    BIKE: 10,
    INTER_CITY: 35
  };
  
  // Data Handling Module
  function calculatePrice(mode) {
    // Placeholder for price calculation logic
    const pricePerKm = pricingPerKm[mode.toUpperCase()] || 0;
    return pricePerKm;
  }
  
  function calculateDistanceAndTimeWithPrice(origin, destination, mode, callback) {
    app.distanceMatrixService.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    }, function(response, status) {
      if (status === 'OK') {
        const distance = response.rows[0].elements[0].distance.value / 1000; // Convert meters to kilometers
        const duration = response.rows[0].elements[0].duration.text;
        const pricePerKm = calculatePrice(mode);
        const price = pricePerKm * distance;
        callback({ distance, duration, price });
      } else {
        console.error('Error calculating distance and time:', status);
      }
    });
  }
  
  function checkExpectedFare(expectedFare, actualFare) {
    // Define the range of acceptable fares
    const lowerBound = actualFare - 50;
    const upperBound = actualFare + 200;
    return expectedFare >= lowerBound && expectedFare <= upperBound;
  }
  
  function storeDataInFirebase(data) {
    // You need to have Firebase initialized and configured at this point
    const driverDetailsRef = firebase.database().ref('driverDetails');
    driverDetailsRef.push(data, function(error) {
      if (error) {
        console.error('Error storing data in Firebase:', error);
      } else {
        console.log('Data stored in Firebase successfully.');
      }
    });
  }
  
  // Example usage
  calculateDistanceAndTimeWithPrice({ lat: 10, lng: 10 }, { lat: 20, lng: 20 }, 'CAR', (result) => {
    console.log(`Distance: ${result.distance} km, Duration: ${result.duration}, Price: ${result.price} currency units`);
    
    const isFareAcceptable = checkExpectedFare(150, result.price);
    console.log(`Is the expected fare acceptable? ${isFareAcceptable}`);
  
    if (isFareAcceptable) {
      storeDataInFirebase(result);
    } else {
      console.error('The entered fare is outside the acceptable range.');
    }
  });
  function showPermissionDeniedMessage() {
    alert("Access to your location has been denied. Please enable location access in your browser settings to use this feature.");
    console.error("Geolocation permission was denied.");
}

function showPositionUnavailableMessage() {
    alert("Your location information is currently unavailable. Please check your network connection or try again later.");
    console.error("Location information is unavailable.");
}

function showTimeoutErrorMessage() {
    alert("The request to get your location has timed out. Please try again.");
    console.error("The request to get user location timed out.");
}

function showUnknownErrorMessage() {
    alert("An unknown error occurred while trying to retrieve your location.");
    console.error("An unknown geolocation error occurred.");
}

// This function handles the geolocation error and calls the appropriate message function.
function handleGeolocationError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            showPermissionDeniedMessage();
            break;
        case error.POSITION_UNAVAILABLE:
            showPositionUnavailableMessage();
            break;
        case error.TIMEOUT:
            showTimeoutErrorMessage();
            break;
        default:
            showUnknownErrorMessage();
            break;
    }
}
function handleMarkerDrag(markerIndex) {
    if (markerIndex >= app.markers.length) {
        console.error('Marker index out of bounds');
        return;
    }

    const marker = app.markers[markerIndex];
    google.maps.event.addListener(marker, 'dragend', function() {
        const newPosition = marker.getPosition();
        app.geocoder.geocode({ 'location': newPosition }, function(results, status) {
            if (status == 'OK') {
                if (results[0]) {
                    const inputId = markerIndex === 0 ? 'location1' : 'location2';
                    app.inputs[inputId].value = results[0].formatted_address;
                    calculateAndDisplayRoute();
                } else {
                    console.error('No results found');
                }
            } else {
                console.error('Geocoder failed due to: ' + status);
            }
        });
    });
}



function handleLocationChange(inputId) {
    const locationInput = app.inputs[inputId];
    const markerIndex = inputId === 'location1' ? 0 : 1;

    if (locationInput.value.trim() !== '') {
        app.geocoder.geocode({ 'address': locationInput.value }, function(results, status) {
            if (status === 'OK' && results[0]) {
                const latLng = results[0].geometry.location;
                app.markers[markerIndex].setPosition(latLng);
                if (markerIndex === 0) { // If it's the first location, adjust map center
                    app.map.setCenter(latLng);
                }
                calculateAndDisplayRoute();
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
}


window.onload = function() {
    initializeMap();
    // Other initialization code...
    // Then set the current location
    setCurrentLocation();
};