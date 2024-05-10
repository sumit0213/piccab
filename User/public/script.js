let map;
let directionsService;
let directionsDisplay;
let marker1 = null;
let marker2 = null;
let marketPrice;
let distance;
let duration;
let selectedMode;
let driverDetailsArray = [];
let geocoder;  // Declare the geocoder variable globally
let distanceMatrixService = new google.maps.DistanceMatrixService();
let location1Input = document.getElementById('location1');
let location2Input = document.getElementById('location2');

function initializeMap() {
    // Check if geolocation is supported by the browser
    if (navigator.geolocation) {
                 navigator.geolocation.getCurrentPosition(
             function (position) {
                 // Permission granted, initialize the map with current location
                 hideLoadingIndicator();
                 initMapWithLocation(position.coords.latitude, position.coords.longitude);
             },
             function (error) {
                 // Permission denied or error handling
                 hideLoadingIndicator();
                 handleGeolocationError(error);
             }
         );
        // Request location permission
         // Display a loading indicator while waiting for location permission
         showLoadingIndicator();

         // Request location permission

     } else {
         // Geolocation not supported by the browser
         alert('Error: Your browser doesn\'t support geolocation.');
        navigator.geolocation.getCurrentPosition(
            function (position) {
                // Permission granted, initialize the map with current location
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: position.coords.latitude, lng: position.coords.longitude },
                    zoom: 10,
                });

                directionsService = new google.maps.DirectionsService();
                directionsDisplay = new google.maps.DirectionsRenderer({
                    map: map,
                    suppressMarkers: true,
                    provideRouteAlternatives: true,
                });

                initAutocomplete('location1');
                initAutocomplete('location2');

                map.addListener('click', function (event) {
                    handleMapClick(event.latLng);
                });

                location1Input.addEventListener('change', function () {
                    handlePlaceChanged('location1');
                });

                location2Input.addEventListener('change', function () {
                    handlePlaceChanged('location2');
                });

                marker1 = createMarker('Current Location', true);
                marker2 = createMarker('Enter Second Location', true);

                // Set the current location on the map
                setCurrentLocation(position.coords.latitude, position.coords.longitude);
            },
            function () {
                // Permission denied or error handling
                alert('Error: The Geolocation service failed or permission denied.');
            }
        );
     }
}

function showLoadingIndicator() {
// Display a loading spinner or indicator
var loadingSpinner = document.getElementById('loading-spinner');
    
if (!loadingSpinner) {
    // Create the loading spinner if it doesn't exist
    loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'loading-spinner';
    loadingSpinner.style.position = 'fixed';
    loadingSpinner.style.top = '50%';
    loadingSpinner.style.left = '50%';
    loadingSpinner.style.transform = 'translate(-50%, -50%)';
    loadingSpinner.innerHTML = '<div class="spinner"></div>';
    
    document.body.appendChild(loadingSpinner);
} else {
    // Show the existing loading spinner
    loadingSpinner.style.display = 'block';
}
}

function hideLoadingIndicator() {
// Hide the loading spinner or indicator
var loadingSpinner = document.getElementById('loading-spinner');
    
if (loadingSpinner) {
    // Hide the loading spinner
    loadingSpinner.style.display = 'none';
}
}

function handleGeolocationError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            // Permission denied by the user
            showPermissionDeniedMessage();
            break;
        case error.POSITION_UNAVAILABLE:
            // Location information is unavailable
            showPositionUnavailableMessage();
            break;
        case error.TIMEOUT:
            // The request to get user location timed out
            showTimeoutErrorMessage();
            break;
        case error.UNKNOWN_ERROR:
            // An unknown error occurred
            showUnknownErrorMessage();
            break;
    }
}

function showPermissionDeniedMessage() {
        // Display a user-friendly message about location permission denial
    // You can provide instructions on how to enable location access in the browser settings
    var permissionDeniedMessage = document.getElementById('permission-denied-message');
    
    if (!permissionDeniedMessage) {
        // Create the message container if it doesn't exist
        permissionDeniedMessage = document.createElement('div');
        permissionDeniedMessage.id = 'permission-denied-message';
        permissionDeniedMessage.style.position = 'fixed';
        permissionDeniedMessage.style.top = '50%';
        permissionDeniedMessage.style.left = '50%';
        permissionDeniedMessage.style.transform = 'translate(-50%, -50%)';
        permissionDeniedMessage.style.padding = '20px';
        permissionDeniedMessage.style.background = '#ffcccc';
        permissionDeniedMessage.style.border = '1px solid #ff0000';
        permissionDeniedMessage.style.borderRadius = '5px';
        permissionDeniedMessage.style.textAlign = 'center';
        permissionDeniedMessage.innerHTML = `
            <p><strong>Location Access Denied</strong></p>
            <p>Please enable location access in your browser settings to use this feature.</p>
        `;
        
        document.body.appendChild(permissionDeniedMessage);
    } else {
        // Show the existing message container
        permissionDeniedMessage.style.display = 'block';
    }
}

function showPositionUnavailableMessage() {
    // Display a user-friendly message about unavailable location information
    // You can suggest checking network connection or trying again later
    var positionUnavailableMessage = document.getElementById('position-unavailable-message');
    
    if (!positionUnavailableMessage) {
        // Create the message container if it doesn't exist
        positionUnavailableMessage = document.createElement('div');
        positionUnavailableMessage.id = 'position-unavailable-message';
        positionUnavailableMessage.style.position = 'fixed';
        positionUnavailableMessage.style.top = '50%';
        positionUnavailableMessage.style.left = '50%';
        positionUnavailableMessage.style.transform = 'translate(-50%, -50%)';
        positionUnavailableMessage.style.padding = '20px';
        positionUnavailableMessage.style.background = '#ffffcc';
        positionUnavailableMessage.style.border = '1px solid #cccc00';
        positionUnavailableMessage.style.borderRadius = '5px';
        positionUnavailableMessage.style.textAlign = 'center';
        positionUnavailableMessage.innerHTML = `
            <p><strong>Location Information Unavailable</strong></p>
            <p>Unable to retrieve your current location. Please check your network connection or try again later.</p>
        `;
        
        document.body.appendChild(positionUnavailableMessage);
    } else {
        // Show the existing message container
        positionUnavailableMessage.style.display = 'block';
    }
}

function showTimeoutErrorMessage() {
   // Display a user-friendly message about the request for user location timing out
    // You can suggest trying again or checking network connection
    var timeoutErrorMessage = document.getElementById('timeout-error-message');
    
    if (!timeoutErrorMessage) {
        // Create the message container if it doesn't exist
        timeoutErrorMessage = document.createElement('div');
        timeoutErrorMessage.id = 'timeout-error-message';
        timeoutErrorMessage.style.position = 'fixed';
        timeoutErrorMessage.style.top = '50%';
        timeoutErrorMessage.style.left = '50%';
        timeoutErrorMessage.style.transform = 'translate(-50%, -50%)';
        timeoutErrorMessage.style.padding = '20px';
        timeoutErrorMessage.style.background = '#ffcc99';
        timeoutErrorMessage.style.border = '1px solid #ff6600';
        timeoutErrorMessage.style.borderRadius = '5px';
        timeoutErrorMessage.style.textAlign = 'center';
        timeoutErrorMessage.innerHTML = `
            <p><strong>Request Timeout</strong></p>
            <p>The request for your location timed out. Please try again or check your network connection.</p>
        `;
        
        document.body.appendChild(timeoutErrorMessage);
    } else {
        // Show the existing message container
        timeoutErrorMessage.style.display = 'block';
    }
}

function showUnknownErrorMessage() {
 // Display a user-friendly message about an unknown error
    // You can provide general instructions and suggest trying again
    var unknownErrorMessage = document.getElementById('unknown-error-message');
    
    if (!unknownErrorMessage) {
        // Create the message container if it doesn't exist
        unknownErrorMessage = document.createElement('div');
        unknownErrorMessage.id = 'unknown-error-message';
        unknownErrorMessage.style.position = 'fixed';
        unknownErrorMessage.style.top = '50%';
        unknownErrorMessage.style.left = '50%';
        unknownErrorMessage.style.transform = 'translate(-50%, -50%)';
        unknownErrorMessage.style.padding = '20px';
        unknownErrorMessage.style.background = '#ccffcc';
        unknownErrorMessage.style.border = '1px solid #00cc00';
        unknownErrorMessage.style.borderRadius = '5px';
        unknownErrorMessage.style.textAlign = 'center';
        unknownErrorMessage.innerHTML = `
            <p><strong>Unknown Error</strong></p>
            <p>An unknown error occurred. Please try again.</p>
        `;
        
        document.body.appendChild(unknownErrorMessage);
    } else {
        // Show the existing message container
        unknownErrorMessage.style.display = 'block';
    }
}

function initMapWithLocation(latitude, longitude) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: latitude, lng: longitude },
        zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        provideRouteAlternatives: true,
    });

    initAutocomplete('location1');
    initAutocomplete('location2');

    map.addListener('click', function (event) {
        handleMapClick(event.latLng);
    });

    location1Input.addEventListener('change', function () {
        handlePlaceChanged('location1');
    });

    location2Input.addEventListener('change', function () {
        handlePlaceChanged('location2');
    });

    marker1 = createMarker('Current Location', true);
    marker2 = createMarker('Enter Second Location', true);

    // Set the current location on the map
    setCurrentLocation(latitude, longitude);

    // Initialize the map with the provided latitude and longitude
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: latitude, lng: longitude },
        zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        provideRouteAlternatives: true,
    });

    initAutocomplete('location1');
    initAutocomplete('location2');

    map.addListener('click', function (event) {
        handleMapClick(event.latLng);
    });

    location1Input.addEventListener('change', function () {
        handlePlaceChanged('location1');
    });

    location2Input.addEventListener('change', function () {
        handlePlaceChanged('location2');
    });

    marker1 = createMarker('Current Location', true);
    marker2 = createMarker('Enter Second Location', true);

    // Set the current location on the map
    setCurrentLocation(latitude, longitude);
}

function createMarker(title, draggable) {
    return new google.maps.Marker({
        map: map,
        draggable: draggable,
        title: title,
    });
}

// var geocoder;  // Declare the geocoder variable globally

function initAutocomplete(inputId) {
    var input = document.getElementById(inputId);
    var autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode', 'establishment'], componentRestrictions: { country: 'IN' } });

    // Use the global geocoder variable
    geocoder = new google.maps.Geocoder();

    autocomplete.addListener('place_changed', function () {
        handlePlaceChanged(inputId);
    });

    // Bias the autocomplete results towards the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            var circle = new google.maps.Circle({
                center: userLocation,
                radius: 50000, // Adjust this radius based on your preference
            });

            autocomplete.setBounds(circle.getBounds());
        });
    }
}

function handlePlaceChanged(inputId) {
    var location1Input = document.getElementById('location1');
    var location2Input = document.getElementById('location2');

    if (location1Input && location2Input) {
        geocodeLocation(geocoder, location1Input.value, function (origin) {
            geocodeLocation(geocoder, location2Input.value, function (destination) {
               // calculateDistanceAndTimeWithPrice(origin, destination);
                updateMarkersAndRoute(origin, destination);
            });
        });
    } else {
        document.getElementById('result').innerHTML = '';
    }
}

function geocodeLocation(geocoder, location, callback) {
    // Check if location is provided and not empty
    if (!location) {
        console.error('Geocode request received an empty location.');
        // Handle the error appropriately for your application
        return;
    }

    // Make geocoding request
    geocoder.geocode({ 'address': location }, function (results, status) {
        if (status === 'OK') {
            var coordinates = results[0].geometry.location;
            callback(coordinates);
        } else {
            console.error('Geocode was not successful for the following reason:', status);
            // You might want to alert or handle the error in a way suitable for your application
        }
    });
}

function updateMarkersAndRoute(origin, destination) {
    removeMarkers();
    addOrUpdateMarker('location1', origin, marker1);
    addOrUpdateMarker('location2', destination, marker2);
    displayRoute(origin, destination);
}

function addOrUpdateMarker(inputId, position, marker) {
    if (!marker) {
        marker = createMarker(inputId === 'location1' ? 'Current Location' : 'Enter Second Location', true);
        if (inputId === 'location1') {
            marker1 = marker;
        } else if (inputId === 'location2') {
            marker2 = marker;
        }
    }
    marker.setPosition(position);
    marker.setMap(map);

    marker.addListener('dragend', function () {
        handleMarkerDrag(inputId, marker.getPosition());
    });
}


function removeMarkers() {
    if (marker1) {
        marker1.setMap(null);
    }

    if (marker2) {
        marker2.setMap(null);
    }
}

function displayRoute(origin, destination) {
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
    }, function (response, status) {
        if (status === 'OK') {
            var route = response.routes[0];  // Assuming you want the first route

            directionsDisplay.setDirections(response);

            // Customize the polyline options (color and animation)
            var polylineOptions = {
                strokeColor: '#00008B',  // Dark Blue color
                strokeOpacity: 0.8,
                strokeWeight: 5,
                path: [],
                icons: [{
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 6,
                        strokeColor: '#FFFF00',
                        strokeWeight: 3,
                    },
                    offset: '100%',
                }],
            };

            // Apply the custom options to the polyline
            directionsDisplay.setOptions({
                polylineOptions: polylineOptions,
            });

            // Animate the route with a moving arrow
            var step = 0;
            var numSteps = route.legs[0].steps.length;
            var iconOffset = 0;

            function animate() {
                if (step >= numSteps) {
                    return;
                }
                var path = response.routes[0].legs[0].steps[step].path;
                polylineOptions.path = path;
                directionsDisplay.setOptions({ polylineOptions: polylineOptions });

                // Update arrow position along the path
                iconOffset += 1; // You can adjust the speed by changing this value
                if (iconOffset >= 100) {
                    iconOffset = 0;
                    step++;
                }

                polylineOptions.icons[0].offset = iconOffset + '%';
                setTimeout(animate, 50);  // Adjust the duration of each step
            }

            animate();
        } else {
            alert('Error displaying route. Please try again.');
        }
    });
}

function handleMarkerDrag(inputId, newPosition) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': newPosition.toJSON() }, function (results, status) {
        if (status === 'OK') {
            document.getElementById(inputId).value = results[0].formatted_address;
            handlePlaceChanged(inputId);

            var newLatLng = newPosition instanceof google.maps.LatLng ?
                newPosition :
                new google.maps.LatLng(newPosition.lat(), newPosition.lng());

            if (inputId === 'location1') {
                var location2Input = document.getElementById('location2');
                var destination = location2Input.value;
                calculateDistanceAndTimeWithPrice(newLatLng, destination);
                updateMarkersAndRoute(newLatLng, destination);
            } else if (inputId === 'location2') {
                var location1Input = document.getElementById('location1');
                var origin = location1Input.value;
                calculateDistanceAndTimeWithPrice(origin, newLatLng);
                updateMarkersAndRoute(origin, newLatLng);
            }
        } else {
            alert('Geocoder failed due to: ' + status);
        }
    });
}

function setCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            geocoder.geocode({ 'location': latLng }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        document.getElementById('location1').value = results[0].formatted_address;
                        handlePlaceChanged('location1');
                    } else {
                        alert('No results found');
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });

            map.setCenter(latLng);
            addOrUpdateMarker('location1', latLng, marker1);
        }, function () {
            alert('Error: The Geolocation service failed.');
        });
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

// Ensure initializeMap is defined before it's called
window.onload = function () {
    initializeMap();
};

// Add event listeners to location input fields
document.getElementById('location1').addEventListener('input', resetTransportationButtonSelection);
document.getElementById('location2').addEventListener('input', resetTransportationButtonSelection);

function resetTransportationButtonSelection() {
    // Reset styles for all buttons
    const buttons = document.querySelectorAll('.transportation-button');
    buttons.forEach(button => button.classList.remove('selected'));
}

function calculatePrice(mode) {
    var price;

    switch (mode) {
        case 'CAR':
            price = 20;
            break;
        case 'SUV':
            price = 30;
            break;
        case 'BIKE':
            price = 10;
            break;
        case 'INTER CITY':
            price = 35;
            break;
        default:
            alert('Invalid transportation mode');
            return;
    }

    // Reset styles for all buttons
    resetTransportationButtonSelection();

    // Add style to the selected button
    const selectedButton = document.querySelector(`.transportation-button[data-type="${mode}"]`);
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }

    var originInput = document.getElementById('location1').value;
    var destinationInput = document.getElementById('location2').value;

    if (originInput && destinationInput) {
        var geocoder = new google.maps.Geocoder();

        geocodeLocation(geocoder, originInput, function (origin) {
            geocodeLocation(geocoder, destinationInput, function (destination) {
                // Clear previous content
                document.getElementById('result').innerHTML = '';
                calculateDistanceAndTimeWithPrice(origin, destination, mode, price);
            });
        });
    } else {
        // Clear previous content
        document.getElementById('result').innerHTML = '';
    }
}


function calculateDistanceAndTimeWithPrice(origin, destination, mode, price) {
    var service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
    }, function (response, status) {
        if (status === 'OK') {
            distance = response.rows[0].elements[0].distance.text;
            duration = response.rows[0].elements[0].duration.text;
            selectedMode = mode;
            marketPrice = parseFloat(distance.replace(' km', '')) * price;

            // Create a new container element
            var resultContainer = document.createElement('div');
            resultContainer.classList.add('result-item');

            // Clear previous content
            resultContainer.innerHTML = '';

            // Set the content of the container
            resultContainer.innerHTML = `
            <div style="display: flex; flex-direction: row;justify-content:space-between">
            <div style="width: 100px; height: 50px; box-shadow: 0px 3px 10px 2px rgba(20, 25, 127, 0.50); border: 1px rgba(20.31, 24.58, 127.15, 0.50) solid color: #4CAF50; font-weight: bold; font-size: 16px; font-family: 'Arial', sans-serif; animation: textAnimation 1s infinite;">
            <span style="margin-top:5px">${distance}</span>
             </div>
            <div style="width: 100px; height: 50px; box-shadow: 0px 3px 10px 2px rgba(20, 25, 127, 0.50); border: 1px rgba(20.31, 24.58, 127.15, 0.50) solid color: #4CAF50; font-weight: bold; font-size: 16px; font-family: 'Arial', sans-serif; animation: textAnimation 1s infinite;"">
            <span style="margin-top:5px"> ${duration} </span>
           </div>
            <div style="width: 100px; height: 50px; box-shadow: 0px 3px 10px 2px rgba(20, 25, 127, 0.50); border: 1px rgba(20.31, 24.58, 127.15, 0.50) solid color: #4CAF50; font-weight: bold; font-size: 16px; font-family: 'Arial', sans-serif; animation: textAnimation 1s infinite;"">
            <span style="margin-top:5px">${price === undefined || isNaN(price) ? "MODE?" : marketPrice.toFixed(2)} Rs </span>
             </div>

            </div>
            `;

            // Append the container to the result div
            document.getElementById('result').innerHTML = ''; // Clear previous content
            document.getElementById('result').appendChild(resultContainer);

            // Set the placeholder for the expected-fare input
            document.getElementById('expected-fare').placeholder = `Expected Fare: ${marketPrice.toFixed(2)} Rs`;

            var driverDetails = {
                distance: distance,
                duration: duration,
                mode: selectedMode,
                price: marketPrice,
                expectedFare: parseFloat(document.getElementById('expected-fare').value),
                currentLocation: document.getElementById('location1').value,
                secondLocation: document.getElementById('location2').value
            };

            // driverDetailsArray.push(driverDetails);

            // console.log(driverDetailsArray);
        } else {
            alert('Error calculating distance and time. Please try again.');
        }
    });
}

window.onload = function () {
    initializeMap();
};

document.getElementById('location1').addEventListener('change', handleLocationChange);
document.getElementById('location2').addEventListener('change', handleLocationChange);

function handleLocationChange() {
    var location1Input = document.getElementById('location1');
    var location2Input = document.getElementById('location2');

    if (location1Input && location2Input) {
        var geocoder = new google.maps.Geocoder();

        geocodeLocation(geocoder, location1Input.value, function (origin) {
            geocodeLocation(geocoder, location2Input.value, function (destination) {
                calculateDistanceAndTimeWithPrice(origin, destination);
            });
        });
    }
}

function checkExpectedFare() {
    var expectedFareInput = document.getElementById('expected-fare');

    if (!expectedFareInput.value.trim()) {
        alert('Please enter the expected fare.');
        return;
    }

    var enteredFare = parseFloat(expectedFareInput.value);

    if (isNaN(enteredFare)) {
        alert('Invalid input. Please enter a valid number for the expected fare.');
        return;
    }

    if (marketPrice !== undefined) {
        var lowerBound = marketPrice - 50;
        var upperBound = marketPrice + 200;

        if (enteredFare >= lowerBound && enteredFare <= upperBound) {
            // disableButtons();
            showSearchingMessage();
           

            var currentLocationInput = document.getElementById('location1');
            var secondLocationInput = document.getElementById('location2');

            var currentLocation = {
                address: currentLocationInput.value,
                latitude: null,
                longitude: null,
            };

            var secondLocation = {
                address: secondLocationInput.value,
                latitude: null,
                longitude: null,
            };

            geocodeLocation(geocoder, currentLocationInput.value, function (origin) {
                currentLocation.latitude = origin.lat();
                currentLocation.longitude = origin.lng();

                geocodeLocation(geocoder, secondLocationInput.value, function (destination) {
                    secondLocation.latitude = destination.lat();
                    secondLocation.longitude = destination.lng();
             // Format the current date and time in IST timezone
            var currentDateTimeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });


                    var driverDetails = {
                        distance: distance,
                        duration: duration,
                        mode: selectedMode,
                        price: marketPrice,
                        expectedFare: enteredFare,
                        currentLocation: currentLocation,
                        secondLocation: secondLocation,
                        timestamp: currentDateTimeIST  // Storing the IST formatted timestamp

                    };

                    // Push data to Firebase
                    storeDataInFirebase(driverDetails);

                   // driverDetailsArray.push(driverDetails);

                    // console.log(driverDetailsArray);
                });
            });
        } else {
            alert('The entered fare is outside the acceptable range.');
        }
    } else {
        alert('Market price not available. Please calculate the price first.');
    }
}

function storeDataInFirebase(data) {
    var driverDetailsRef = database.ref('userDetails');

    var newDriverDetailsRef = driverDetailsRef.push(data, function(error) {
        if (error) {
            console.error('Error storing data in Firebase:', error);
        } else {
            console.log('Data stored in Firebase successfully.');
            // Capture the unique key of the newly created node
            var uniqueNodeId = newDriverDetailsRef.key;
            // Print the unique key in the console
            console.log('Unique Node ID:', uniqueNodeId);
            // Now, listen to changes on this newly created node
            listenToDataChanges(uniqueNodeId);
        }
    });
}
function listenToDataChanges(uniqueNodeId) {
    var fareDataRef = database.ref('userDetails/' + uniqueNodeId + '/fareData');

    fareDataRef.on('value', function(snapshot) {
        var fareDataList = []; // Initialize as an empty array
        snapshot.forEach(function(childSnapshot) {
            var fareData = childSnapshot.val();
            if (fareData) { // Ensure fareData is not null or undefined
                fareDataList.push(fareData);
            }
        });

        console.log(fareDataList); // Log to see what data is being sent

        if (fareDataList.length > 0) {
            showSearchingMessage(() => { console.log('Search cancelled'); }, fareDataList);
        }
    });
}

function disableButtons() {
    var buttons = document.getElementsByClassName('transportation-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }

    document.getElementById('find-driver-button').disabled = true;
}

function showSearchingMessage(cancelCallback, fareDataList) {
    // Ensure fareDataList is an array or initialize it as an empty array if undefined
    if (!Array.isArray(fareDataList)) {
        console.error('Expected fareDataList to be an array, received:', fareDataList);
        fareDataList = []; // Initialize as an empty array to allow the function to continue
    }

    // Check if an overlay already exists
    var existingOverlay = document.getElementById('overlay');
    if (existingOverlay) {
        existingOverlay.remove(); // Remove the existing overlay if it exists
    }

    // Proceed with creating the overlay
    var overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'overlay';

    // Blurring the background content
    document.body.style.filter = 'blur(60%)';

    // Create the message container
    var messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    messageContainer.innerHTML = '<div class="message-header">Searching for Driver...</div>';

// Firebase Database reference
var database = firebase.database();

// Dynamically display each fare data if available
fareDataList.forEach(fareData => {
    if (fareData && fareData.enteredAmount && fareData.address && fareData.refId) {
        var fareDetailsContainer = document.createElement('div');
        fareDetailsContainer.className = 'fare-details-container';
        fareDetailsContainer.innerHTML = `
            <div>Reference ID: ${fareData.refId}</div>
            <div>Estimated Fare: ${fareData.enteredAmount}</div>
            <div>Address: ${fareData.address}</div>
        `;

        // Create Confirm Button
        var confirmButton = document.createElement('button');
        confirmButton.className = 'confirm-button';
        confirmButton.innerText = 'Confirm';
        confirmButton.addEventListener('click', function() {
            // Store the fare address and refId in localStorage
            localStorage.setItem('fareAddress', fareData.address);
            localStorage.setItem('fareRefId', fareData.refId);
            // Save the "Confirm Ride" message in Firebase under the node of fareRefId inside the fares node
            database.ref('fares/' + fareData.refId).update({
                message: 'Confirm Ride',
                timestamp: new Date().toISOString()
            });

            // Redirect to a new page
            window.location.href = 'Ride_confermation_page.html';
        });

        // Create Remove Button
        var removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerText = 'Remove';
        removeButton.addEventListener('click', function() {
                        // Store the fare address and refId in localStorage
                        localStorage.setItem('fareRefId', fareData.refId);
                        // Save the "Remove" message in Firebase under the node of fareRefId inside the fares node
                        database.ref('fares/' + fareData.refId).update({
                            message: 'Remove',
                            timestamp: new Date().toISOString()
                        });
            fareDetailsContainer.remove();
        });

        // Append buttons to the fare details container
        fareDetailsContainer.appendChild(confirmButton);
        fareDetailsContainer.appendChild(removeButton);

        // Append the fare details container to the message container
        messageContainer.appendChild(fareDetailsContainer);
    }
});




    // Creating the cancel button
    var cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.innerText = 'Cancel';
    cancelButton.addEventListener('click', function () {
        document.body.style.filter = ''; // Removing the blur effect
        document.body.removeChild(overlay); // Use removeChild to remove the overlay from the body
        if (cancelCallback && typeof cancelCallback === 'function') {
            cancelCallback();
        }
    });

    overlay.appendChild(messageContainer);
    overlay.appendChild(cancelButton);
    document.body.appendChild(overlay); // Adds the newly created overlay to the body
}

// Function to enable all buttons
function enableButtons() {
    var buttons = document.getElementsByClassName('transportation-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = false;
    }

    document.getElementById('find-driver-button').disabled = false;
}