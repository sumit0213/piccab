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
let global_driverDetails = {
    distance: null,
    duration: null,
    mode: null,
    price: null,
    expectedFare: null,
    currentLocation: null,
    secondLocation: null,
    timestamp: null 
};
let loggedinuseremail;
let uniqueNodeId ;

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
        document.getElementById('userName').innerText = localStorage.getItem('userEmail');
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
    let loadingSpinner = document.getElementById('loading-spinner');

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
    let loadingSpinner = document.getElementById('loading-spinner');

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
    let permissionDeniedMessage = document.getElementById('permission-denied-message');

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
    let positionUnavailableMessage = document.getElementById('position-unavailable-message');

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
    let timeoutErrorMessage = document.getElementById('timeout-error-message');

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
    let unknownErrorMessage = document.getElementById('unknown-error-message');

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

function initAutocomplete(inputId) {
    let input = document.getElementById(inputId);
    let autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode', 'establishment'], componentRestrictions: { country: 'IN' } });

    // Use the global geocoder variable
    geocoder = new google.maps.Geocoder();

    autocomplete.addListener('place_changed', function () {
        handlePlaceChanged(inputId);
    });

    // Bias the autocomplete results towards the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            let userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            let circle = new google.maps.Circle({
                center: userLocation,
                radius: 50000, // Adjust this radius based on your preference
            });

            autocomplete.setBounds(circle.getBounds());
        });
    }
}

function handlePlaceChanged(inputId) {
    let location1Input = document.getElementById('location1');
    let location2Input = document.getElementById('location2');

    if (location1Input && location2Input) {
        geocodeLocation(geocoder, location1Input.value, function (origin) {
            geocodeLocation(geocoder, location2Input.value, function (destination) {
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
            let coordinates = results[0].geometry.location;
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
            let route = response.routes[0];  // Assuming you want the first route

            directionsDisplay.setDirections(response);

            // Customize the polyline options (color and animation)
            let polylineOptions = {
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
            let step = 0;
            let numSteps = route.legs[0].steps.length;
            let iconOffset = 0;

            function animate() {
                if (step >= numSteps) {
                    return;
                }
                let path = response.routes[0].legs[0].steps[step].path;
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
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': newPosition.toJSON() }, function (results, status) {
        if (status === 'OK') {
            document.getElementById(inputId).value = results[0].formatted_address;
            handlePlaceChanged(inputId);

            let newLatLng = newPosition instanceof google.maps.LatLng ?
                newPosition :
                new google.maps.LatLng(newPosition.lat(), newPosition.lng());

            if (inputId === 'location1') {
                let location2Input = document.getElementById('location2');
                let destination = location2Input.value;
                calculateDistanceAndTimeWithPrice(newLatLng, destination);
                updateMarkersAndRoute(newLatLng, destination);
            } else if (inputId === 'location2') {
                let location1Input = document.getElementById('location1');
                let origin = location1Input.value;
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
            let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

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
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
        document.getElementById("userName").textContent = userEmail;
    }
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
    let price;

    switch (mode) {
        case 'CAR':
            price = 20;
            break;
        case 'SUV':
            price = 30;
            break;
        case 'AUTO':
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

    let originInput = document.getElementById('location1').value;
    let destinationInput = document.getElementById('location2').value;

    if (originInput && destinationInput) {
        let geocoder = new google.maps.Geocoder();

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
    let service = new google.maps.DistanceMatrixService();

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
            let resultContainer = document.createElement('div');
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

            let driverDetails = {
                distance: distance,
                duration: duration,
                mode: selectedMode,
                price: marketPrice,
                expectedFare: parseFloat(document.getElementById('expected-fare').value),
                currentLocation: document.getElementById('location1').value,
                secondLocation: document.getElementById('location2').value
            };
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
    let location1Input = document.getElementById('location1');
    let location2Input = document.getElementById('location2');

    if (location1Input && location2Input) {
        let geocoder = new google.maps.Geocoder();

        geocodeLocation(geocoder, location1Input.value, function (origin) {
            geocodeLocation(geocoder, location2Input.value, function (destination) {
                calculateDistanceAndTimeWithPrice(origin, destination);
            });
        });
    }
}

function checkExpectedFare() {
    let expectedFareInput = document.getElementById('expected-fare');

    if (!expectedFareInput.value.trim()) {
        alert('Please enter the expected fare.');
        return;
    }

    let enteredFare = parseFloat(expectedFareInput.value);

    if (isNaN(enteredFare)) {
        alert('Invalid input. Please enter a valid number for the expected fare.');
        return;
    }

    if (marketPrice !== undefined) {
        let lowerBound = marketPrice - 50;
        let upperBound = marketPrice + 200;

        if (enteredFare >= lowerBound && enteredFare <= upperBound) {
            showSearchingMessage();


            let currentLocationInput = document.getElementById('location1');
            let secondLocationInput = document.getElementById('location2');

            let currentLocation = {
                address: currentLocationInput.value,
                latitude: null,
                longitude: null,
            };

            let secondLocation = {
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
                    let currentDateTimeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });


                    let driverDetails = {
                        distance: distance,
                        duration: duration,
                        mode: selectedMode,
                        price: marketPrice,
                        expectedFare: enteredFare,
                        currentLocation: currentLocation,
                        secondLocation: secondLocation,
                        timestamp: currentDateTimeIST  // Storing the IST formatted timestamp

                    };
                    global_driverDetails = driverDetails;
                    // Push data to Firebase
                    storeDataInFirebase(driverDetails);

                    
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
    let driverDetailsRef = database.ref('userDetails');

    var newDriverDetailsRef = driverDetailsRef.push(data, function (error) {
        if (error) {
            console.error('Error storing data in Firebase:', error);
        } else {
            console.log('Data stored in Firebase successfully.');
            // Capture the unique key of the newly created node
             uniqueNodeId = newDriverDetailsRef.key;
            // Print the unique key in the console
            console.log('Unique Node ID:', uniqueNodeId);
            // Now, listen to changes on this newly created node
            listenToDataChanges(uniqueNodeId);
        }
    });
}
function listenToDataChanges(uniqueNodeId) {
    let fareDataRef = database.ref('userDetails/' + uniqueNodeId + '/fareData');

    fareDataRef.on('value', function (snapshot) {
        let fareDataList = []; // Initialize as an empty array
        snapshot.forEach(function (childSnapshot) {
            let fareData = childSnapshot.val();
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
    let buttons = document.getElementsByClassName('transportation-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }

    document.getElementById('find-driver-button').disabled = true;
}

function showSearchingMessage(cancelCallback, fareDataList) {
    try {
        // Ensure fareDataList is an array or initialize it as an empty array if undefined
        fareDataList = fareDataList || [];
        if (!Array.isArray(fareDataList)) {
            throw new Error('Expected fareDataList to be an array');
        }

        // Check if an overlay already exists
        let existingOverlay = document.getElementById('overlay');
        if (existingOverlay) {
            existingOverlay.remove(); // Remove the existing overlay if it exists
        }

        // Proceed with creating the overlay
        let overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'overlay';

        // Blurring the background content
        document.body.style.filter = 'blur(60%)';

        // Create the message container
        let messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        messageContainer.innerHTML = '<div class="message-header">Searching for Driver...</div>';

        // Firebase Database reference
        let database = firebase.database();

        // Dynamically display each fare data if available
        fareDataList.forEach(fareData => {
            if (fareData && fareData.enteredAmount && fareData.address && fareData.refId) {
                let fareDetailsContainer = document.createElement('div');
                fareDetailsContainer.className = 'fare-details-container';
                fareDetailsContainer.innerHTML = `
                    <div>Reference ID: ${fareData.refId}</div>
                    <div>Estimated Fare: ${fareData.enteredAmount}</div>
                    <div>Address: ${fareData.address}</div>
                `;

                // Create Confirm Button
                let confirmButton = createButton('Confirm', () => {
                    saveAndRedirect(fareData, 'Confirm Ride');
                });
                confirmButton.classList.add('confirm-button'); // Add CSS class

                // Create Remove Button
                let removeButton = createButton('Remove', () => {
                    saveAndRemove(fareData, 'Remove');
                });
                removeButton.classList.add('remove-button'); // Add CSS class

                // Append buttons to the fare details container
                fareDetailsContainer.appendChild(confirmButton);
                fareDetailsContainer.appendChild(removeButton);

                // Append the fare details container to the message container
                messageContainer.appendChild(fareDetailsContainer);
            }
        });

        // Creating the cancel button
            let cancelButton = createButton('Cancel', () => {
                cancelOverlay(cancelCallback, overlay);
            });

            // Assigning the class to the cancel button
            cancelButton.classList.add('cancel-button');

            overlay.appendChild(messageContainer);
            overlay.appendChild(cancelButton);
            document.body.appendChild(overlay); // Adds the newly created overlay to the body
    } catch (error) {
        console.error('Error in showSearchingMessage:', error);
    }
}

function createButton(text, onClick) {
    let button = document.createElement('button');
    button.className = 'action-button';
    button.innerText = text;
    button.addEventListener('click', onClick);
    return button;
}

function saveAndRedirect(fareData, message) {
    // Remove the current page's elements
    document.body.innerHTML = '';

    // Display the fare address on the same page
    displayFareAddress(fareData.address, fareData);


    // Save the fare details in localStorage and Firebase
    localStorage.setItem('fareAddress', fareData.address);
    localStorage.setItem('fareRefId', fareData.refId);
    firebase.database().ref('fares/' + fareData.refId).update({
        message: message,
        timestamp: new Date().toISOString()
    });
}

// function displayFareAddress(address) {
//     let fareAddressDiv = document.createElement('div');
//     fareAddressDiv.id = 'fareAddress';
//     fareAddressDiv.innerText = 'Drivers Address: ' + address;
//     document.body.appendChild(fareAddressDiv);
// }
function displayFareAddress(address, driverDetails) {
    console.log(global_driverDetails);
    let fareAddressDiv = document.createElement('div');
    fareAddressDiv.id = 'fareAddress_id';
    fareAddressDiv.className = 'confirmation-container'; // Apply CSS class
    fareAddressDiv.style.position = 'fixed';
    fareAddressDiv.style.top = '50%';
    fareAddressDiv.style.left = '50%';
    fareAddressDiv.style.transform = 'translate(-50%, -50%)';
    fareAddressDiv.style.zIndex = '9999'; // Ensure it's above other elements

    // Apply blur effect to the document body
    document.body.style.filter = 'blur(70%)';

    // Local variable to store the ride history
    let rideHistory = '';

    // Function to handle keydown events
    function handleKeyDown(event) {
        if (event.key === 'Backspace' || event.key === 'r' || event.key === 'F5') {
            event.preventDefault(); // Prevent default action
        }
    }

    // Function to prevent page reload
    function preventPageReload(event) {
        event.preventDefault(); // Prevent default action
        event.returnValue = ''; // For older browsers
    }

    // Add event listeners for keydown events
    document.addEventListener('keydown', handleKeyDown);
    // Add event listener for beforeunload event to prevent page reload
    window.addEventListener('beforeunload', preventPageReload);

    // Check if driverDetails is defined
    if (driverDetails) {
        fareAddressDiv.innerHTML = `
        <div><p class="confirm-message">Booking Confirmed!</p>
        <p class="data-property">Driver's Address: ${global_driverDetails.currentLocation.address}</p>
        <p class="data-property">Distance: ${global_driverDetails.distance}</p>
        <p class="data-property">Duration: ${global_driverDetails.duration}</p>
        <p class="data-property">Mode: ${global_driverDetails.mode}</p>
        <p class="data-property">Price: ${global_driverDetails.price}</p>
        <p class="data-property">Expected Fare: ${global_driverDetails.expectedFare}</p>
        <p class="data-property">Timestamp: ${global_driverDetails.timestamp}</p>
        <button class="button button-primary confirm-button">Show on Google Maps</button>
        <button class="button button-secondary remove-button">Cancel Ride</button>
        </div>
    `;

        // Assign the content of fareAddressDiv.innerHTML to rideHistory
        rideHistory = fareAddressDiv.innerHTML;

        // Function to handle cancel button click
        function handleCancelClick() {
            // Remove the fare address confirmation modal
            fareAddressDiv.remove();
            // Remove event listeners for keydown events
            document.removeEventListener('keydown', handleKeyDown);
            // Remove event listener for beforeunload event
            window.removeEventListener('beforeunload', preventPageReload);
            // Restore default blur effect of the document body
            document.body.style.filter = 'none';
            // Store data to Firebase
    var database = firebase.database();
        var userDetailsRef = database.ref('userDetails/' + uniqueNodeId);
    userDetailsRef.update({
        Ride_status: "cancelled"
    }).then(function() {
        console.log("Data stored to Firebase with status 'cancelled'.");
    }).catch(function(error) {
        console.error("Error storing data to Firebase:", error);
    });
        }

        // Add event listener for cancel button click
        fareAddressDiv.querySelector('.remove-button').addEventListener('click', handleCancelClick);

    } else {
        // If driverDetails is not defined, only display the address
        fareAddressDiv.innerText = 'Driver\'s Address: ' + address;
        // Assign the content of fareAddressDiv.innerHTML to rideHistory
        rideHistory = fareAddressDiv.innerHTML;
    }

    // Now you can use the rideHistory variable to access the saved content
    console.log('Ride history:', rideHistory);

    document.body.appendChild(fareAddressDiv);
}






function saveAndRemove(fareData, message) {
    localStorage.setItem('fareRefId', fareData.refId);
    firebase.database().ref('fares/' + fareData.refId).update({
        message: message,
        timestamp: new Date().toISOString()
    });
    fareDetailsContainer.remove();
}

function cancelOverlay(cancelCallback, overlay) {
    document.body.style.filter = ''; // Removing the blur effect
    overlay.remove(); // Remove the overlay from the body
    if (cancelCallback && typeof cancelCallback === 'function') {
        cancelCallback();
    }
}




function enableButtons() {
    let buttons = document.getElementsByClassName('transportation-button');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = false;
    }

    document.getElementById('find-driver-button').disabled = false;
}