
// Retrieve email from local storage and display it in userName
document.addEventListener("DOMContentLoaded", function (event) {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
        document.getElementById("userName").textContent = userEmail;
    }

});

// Initialize Firebase with the provided configuration
firebase.initializeApp(config.firebaseConfig);

var savedLocationData = [];
// Define the storeLocationData function to store location data
function storeLocationData(address, coordinates) {
    savedLocationData.push({ address: address, coordinates: coordinates });
}

// Define the initMap function to set up the map and handle geolocation
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15 // Set the map zoom level to 15
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            localStorage.setItem("lat", userLocation.lat);
            localStorage.setItem("lng", userLocation.lng);

            map.setCenter(userLocation);

            var marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location'
            });

            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'location': userLocation }, function (results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        var locationInfo = document.createElement('p');
                        localStorage.setItem("allow-location", "allowed");
                        locationInfo.innerHTML = '<strong style="color: blue;">Your current location:</strong> ' + results[0].formatted_address;

                        // Append locationInfo to #container
                        var container = document.getElementById('containerAddress');
                        container.appendChild(locationInfo);

                        // Store the location data
                        var address = results[0].formatted_address;
                        var coordinates = userLocation;
                        storeLocationData(address, coordinates);
                    } else {
                        console.error('No results found');
                    }
                } else {
                    console.error('Geocoder failed due to: ' + status);
                }
            });
        }, function () {
            alert('Error: The Geolocation service failed.');
        });
    } else {
        alert('Error: Your browser does not support geolocation.');
    }
}



// Add this function to calculate the distance between two locations using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function getUserLocation() {
    return new Promise(function (resolve, reject) {
        if (localStorage.getItem("lat") == null) {
            navigator.geolocation.getCurrentPosition(function (position) {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, function (error) {
                reject(error);
            });
        } else {
            reject(new Error('Geolocation is not supported by this browser.'));
        }
    });
}

function createRideItem(driverKey, userDetail) {
    // Check if the ride item already exists
    if (document.getElementById(`ride-item-${driverKey}`)) {
        // If it already exists, return null to avoid duplicates
        return null;
    }

    var distance = calculateDistance(
        userDetail.currentLocation.latitude,
        userDetail.currentLocation.longitude,
        localStorage.getItem("lat"),
        localStorage.getItem("lng")
    );

    var driverDetail = {
        currentLocation: {
            latitude: localStorage.getItem("lat"), // Default latitude
            longitude: localStorage.getItem("lng") // Default longitude
        }
    };

    if (distance <= 50) {


        // Create ride item only if distance is within 50km
        var rideItem = document.createElement('li');
        rideItem.id = `ride-item-${driverKey}`;
        rideItem.classList.add('ride-item');
        rideItem.innerHTML = `
            <strong>Driver ID:</strong> ${driverKey} <br>
            <strong><i class='fas fa-map-marker-alt' style='font-size:24px;;color:red'></i></strong> ${userDetail.currentLocation.address} <br>
            <strong><i class='fas fa-route' style='font-size:24px'></i></strong> ${userDetail.distance} <!-- Road icon for "Distance:" -->
            <strong><i class="far fa-clock"></i></strong> ${userDetail.duration} <!-- Clock icon for "Duration:" -->
            <strong><i class="fas fa-dollar-sign"></i></strong> ${userDetail.expectedFare} <!-- Dollar sign icon for "Expected Fare:" -->
            <strong><i class="fas fa-car"></i></strong> ${userDetail.mode} <!-- Car icon for "Mode:" -->
            <strong><i class="fas fa-tag"></i></strong> ${userDetail.price} <br> <!-- Tag icon for "Price:" -->
            <strong><i class='fas fa-male' style='font-size:24px;color:red'></i></strong> ${userDetail.secondLocation.address} <br> 
            <div id="timer-${driverKey}" class="fa">&#xf017;</div> <!-- Clock"   
        `;
        return rideItem;
    }

    return null; // Return null if distance exceeds 50km
}

// Function to play alert tone
function playAlertTone() {
    // Play your alert tone here
    // For example:
    var audio = new Audio('alarm.mp3'); // Replace 'alert-tone.mp3' with the path to your alert tone file
    audio.play();
}
// Function to make background blink
function blinkBackground() {
    var backgroundElement = document.querySelector('body');
    backgroundElement.classList.add('blink');
    setTimeout(function () {
        backgroundElement.classList.remove('blink');
    }, 10000); // Adjust the duration of the blink as needed (in milliseconds)
}


// Function to handle accept button click
function handleAcceptButton(rideItem, driverKey, userKey) {
    var acceptButton = document.createElement('button');
    acceptButton.textContent = 'Accept';
    acceptButton.onclick = function () {
        var fareInput = document.createElement('input');
        fareInput.setAttribute('type', 'text');
        fareInput.placeholder = 'Enter expected amount';

        var confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.onclick = function () {
            confirmFare(driverKey, fareInput.value.trim(), rideItem);
            handleConfirmMessage(driverKey);
        };

        rideItem.appendChild(fareInput);
        rideItem.appendChild(confirmButton);
        rideItem.removeChild(acceptButton); // Remove the accept button after creating fare input and confirm button
    };
    return acceptButton;
}

// Function to handle decline button click
function handleDeclineButton(driverKey) {
    var declineButton = document.createElement('button');
    declineButton.textContent = 'Decline';
    declineButton.onclick = function () {
        declineRide(driverKey);
    };
    return declineButton;
}

// Function to remove buttons and input field
function removeButtonsAndInput(rideItem) {
    var buttons = rideItem.querySelectorAll('button');
    var inputs = rideItem.querySelectorAll('input');

    buttons.forEach(button => rideItem.removeChild(button));
    inputs.forEach(input => rideItem.removeChild(input));
}

var driverExpectedAmounts = [];
var fairID; // Global variable to store the unique ID
var globalUserKey; // Global variable to store the userKey

function confirmFare(userKey, enteredAmount, rideItem) {
    if (enteredAmount !== '') {
        if (!isNaN(enteredAmount)) {
            console.log("User Key:", userKey);
            console.log("Expected Amount:", enteredAmount);

            // Storing userKey in the global variable
            globalUserKey = userKey;

            var database = firebase.database();
            var fareRef = database.ref('fares');
            var newFareRef = fareRef.push(); // पहले खाली नोड बनाएं
            fairID = newFareRef.key; // Storing the unique ID in the global variable

            var userDetailsRef = database.ref('userDetails/' + userKey); // Updated to use userDetails

            savedLocationData.forEach(function (location) {
                var fareData = {
                    userKey: userKey, // Now using userKey
                    enteredAmount: enteredAmount,
                    address: location.address,
                    lat: location.coordinates.lat,
                    lng: location.coordinates.lng,
                    refId: fairID // Using the global variable
                };

                newFareRef.set(fareData) // अब डेटा को सेट करें
                    .then(() => console.log('Data saved successfully to the fares node with reference ID!'))
                    .catch(error => console.error('Error saving data to the fares node:', error));
                // यूज़र की विवरण में किराया डेटा के साथ एक नई यूनिक ID के तहत डेटा सहेजना
                var userFareDataPath = `userDetails/${userKey}/fareData`;
                var newFareEntryRef = database.ref(userFareDataPath).push(fareData); // डायरेक्टली डेटा पुश करें

                newFareEntryRef.set(fareData) // उस यूनिक ID के अंदर डेटा सेट करना
                    .then(() => console.log('New fare data saved successfully with a unique ID in userDetails!'))
                    .catch(error => console.error('Error saving new fare data with a unique ID in userDetails:', error));
            });

            removeButtonsAndInput(rideItem);
            var message = document.createElement('p');
            message.textContent = `Requested Rs ${enteredAmount} for this Ride`;
            rideItem.appendChild(message);
            setupFirebaseListener(rideItem, fairID);
        } else {
            console.error('Expected amount should be a number.');
        }
    } else {
        console.error('Expected amount cannot be blank.');
    }
}

function setupFirebaseListener(rideItem, fairID) {
    var database = firebase.database();

    // No need to extract the unique key, use fairID directly
    var fareMessageRef = database.ref('fares/' + fairID + '/message');

    // Define a function to handle message events
    function handleMessage(snapshot) {
        var message = snapshot.val();
        console.log('Current fare message:', message);

        if (message) {
            if (message === 'Confirm Ride') {
                blurAndShowConfirmMessage(rideItem);
            } else if (message === 'Remove') {
                // Remove rideItem when receiving "Remove" message
                rideItem.remove();
            } else {
                console.log('No actionable message received.');
            }
        } else {
            console.log('Message is null.');
        }
    }

    // Listen for initial value and subsequent changes
    fareMessageRef.on('value', handleMessage);
}

function blurAndShowConfirmMessage() {
    // Remove all elements from the page
    document.body.innerHTML = '';

    // Create a container for the message
    var confirmContainer = document.createElement('div');
    confirmContainer.className = 'confirmation-container'; // Apply CSS class
    confirmContainer.style.position = 'fixed';
    confirmContainer.style.top = '50%';
    confirmContainer.style.left = '50%';
    confirmContainer.style.transform = 'translate(-50%, -50%)';
    confirmContainer.style.zIndex = '9999'; // Ensure it's above other elements

    // Apply blur effect to the document body
    document.body.style.filter = 'blur(70%)';

    // Show the confirmation message inside the container
    var confirmMessage = document.createElement('p');
    confirmMessage.textContent = 'Booking Confirmed!';
    confirmMessage.className = 'confirm-message'; // Apply CSS class
    confirmContainer.appendChild(confirmMessage);

    // Define the properties to display
    var propertiesToDisplay = [
        'currentLocation',
        'distance',
        'duration',
        'expectedFare',
        'mode',
        'secondLocation',
        'timestamp'
    ];

    // Define static name tags with bold formatting
    var staticNameTags = {
        currentLocation: '<strong>Current Location:</strong>',
        distance: '<strong>Distance:</strong>',
        duration: '<strong>Duration:</strong>',
        expectedFare: '<strong>Expected Fare:</strong>',
        mode: '<strong>Mode:</strong>',
        secondLocation: '<strong>Second Location:</strong>',
        timestamp: '<strong>Timestamp:</strong>'
    };

    // Retrieve data from Firebase
    var database = firebase.database();
    var userDetailsRef = database.ref('userDetails/' + globalUserKey);

    var currentLocationCoords, secondLocationCoords;

    userDetailsRef.once('value', function (snapshot) {
        var userData = snapshot.val();
        if (userData) {
            // Loop through propertiesToDisplay and display them if present in userData
            propertiesToDisplay.forEach(function (property) {
                if (userData.hasOwnProperty(property)) {
                    var dataParagraph = document.createElement('p');
                    dataParagraph.innerHTML = staticNameTags[property]; // Assign static name tag to paragraph
                    if (property === 'currentLocation' || property === 'secondLocation') {
                        var location = userData[property];
                        if (location && location.latitude && location.longitude) {
                            if (property === 'currentLocation') {
                                currentLocationCoords = { lat: location.latitude, lng: location.longitude };
                            } else {
                                secondLocationCoords = { lat: location.latitude, lng: location.longitude };
                            }
                            dataParagraph.innerHTML += location.address; // Use innerHTML to render HTML content
                        } else {
                            console.error('Invalid or missing coordinates for', property);
                        }
                    } else {
                        dataParagraph.textContent += userData[property];
                    }
                    dataParagraph.className = 'data-property'; // Apply CSS class
                    confirmContainer.appendChild(dataParagraph);
                }
            });

            // Add button to show location on Google Maps
            var showMapButton = document.createElement('button');
            showMapButton.textContent = 'Show on Google Maps';
            showMapButton.classList.add('button', 'button-primary', 'standard-button');

            showMapButton.addEventListener('click', function () {
                // Construct the Google Maps URL with the coordinates
                if (currentLocationCoords && secondLocationCoords) {
                    var googleMapsUrl = 'https://www.google.com/maps/dir/?api=1';
                    googleMapsUrl += '&origin=' + currentLocationCoords.lat + ',' + currentLocationCoords.lng;
                    googleMapsUrl += '&destination=' + secondLocationCoords.lat + ',' + secondLocationCoords.lng;

                    // Open the URL in a new tab/window
                    window.open(googleMapsUrl, '_blank');
                } else {
                    console.error('Coordinates are not available.');
                }
            });
            confirmContainer.appendChild(showMapButton);

            // Add button to complete ride
            var completeRideButton = document.createElement('button');
            completeRideButton.textContent = 'Complete Ride';
            completeRideButton.classList.add('button', 'button-secondary', 'standard-button');
            completeRideButton.addEventListener('click', function () {
                // Remove all buttons
                confirmContainer.querySelectorAll('button').forEach(function (button) {
                    button.remove();
                });

                // Apply blur effect
                document.body.style.filter = 'blur(80%)';

                // Show message
                var completionMessage = document.createElement('p');
                completionMessage.textContent = 'Ride completed!';
                completionMessage.style.fontSize = '24px';
                completionMessage.style.fontWeight = 'bold';
                completionMessage.style.textAlign = 'center';
                completionMessage.style.marginTop = '20px';
                confirmContainer.appendChild(completionMessage);


                // Add additional actions here if needed

                // Log completion message
                console.log('Ride completed.');
            });
            confirmContainer.appendChild(completeRideButton);


            // Add button to cancel ride
            var cancelRideButton = document.createElement('button');
            cancelRideButton.textContent = 'Cancel Ride';
            cancelRideButton.classList.add('button', 'button-secondary', 'standard-button');
            cancelRideButton.addEventListener('click', function () {
                // Add your logic to cancel the ride here
                console.log('Ride cancelled.');
                // You can perform further actions like updating database, etc.
            });
            confirmContainer.appendChild(cancelRideButton);

        } else {
            // If no data found, display a message
            var noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No data found for this user.';
            noDataMessage.className = 'no-data-message'; // Apply CSS class
            confirmContainer.appendChild(noDataMessage);
        }

        // Now you have currentLocationCoords and secondLocationCoords available for further use
        console.log('Current Location Coordinates:', currentLocationCoords);
        console.log('Second Location Coordinates:', secondLocationCoords);
    });

    // Append the container to the document body
    document.body.appendChild(confirmContainer);

    console.log('Confirmation message displayed.');
}



// Function to create and simulate click on decline button
function callDeclineButton(userKey) {
    var declineButton = handleDeclineButton(userKey);
    declineButton.onclick(); // Simulate button click or directly call declineRide
    console.log('Decline button clicked.');
}

// Additional helper function to programmatically decline a ride
function declineRide(driverKey) {
    console.log('Ride declined for driverKey:', driverKey);
    // Further logic to handle the ride decline
    var rideItem = document.getElementById(`ride-item-${driverKey}`);
    if (rideItem) {
        rideItem.parentNode.removeChild(rideItem);
    }
}

function displayNoDriversMessage() {
    var noDriversMessage = document.createElement('p');
    noDriversMessage.innerHTML = 'No drivers available in your area.';
    document.body.appendChild(noDriversMessage);
}

var rideToggle = false;

function toggleRide() {
    console.log(localStorage.getItem("allow-location"));

    rideToggle = !rideToggle;

    var desiredLocationInput = document.getElementById('desiredLocation');
    if (desiredLocationInput) {
        desiredLocationInput.disabled = !rideToggle;
        desiredLocationInput.readOnly = !rideToggle;
    }

    if (rideToggle) {
        getRide();

    } else {
        clearRideDetails();
        resetDesiredLocation();
        clearInterval(rideInterval);
    }
}

var database = firebase.database(); // Define database globally


function clearRideDetails() {
    var rideDetailsList = document.getElementById('ride-details-list');
    if (rideDetailsList) {
        rideDetailsList.parentNode.removeChild(rideDetailsList);
    }
}

function resetDesiredLocation() {
    var desiredLocationInput = document.getElementById('desiredLocation');
    if (desiredLocationInput) {
        desiredLocationInput.value = '';
    }
}


// Override startTimer function to include timeout handling
function startTimer(driverKey, seconds) {
    var timerElement = document.getElementById(`timer-${driverKey}`);

    var interval = setInterval(function () {
        if (seconds == 0) {
            clearRideDetails();
            handleTimeoutMessage(driverKey); // Call function to save 'timeout' message
        }
        if (seconds <= 0) {
            clearInterval(interval);
            var rideItem = document.getElementById(`ride-item-${driverKey}`);
            if (rideItem) {
                rideItem.parentNode.removeChild(rideItem);
            }

        } else {
            seconds--;
            if (timerElement) {
                var minutes = Math.floor(seconds / 60);
                var remainingSeconds = seconds % 60;
                timerElement.textContent = `Timer: ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
            }
        }
    }, 1000);
}

function getRide() {
    var userDetailsRef = database.ref('userDetails');
    var rideDetailsList = document.getElementById('ride-details-list');

    // Check if the toggle switch is turned on
    var toggleSwitch = document.getElementById('myonoffswitch');
    if (!toggleSwitch.checked) {
        // If toggle switch is off, clear the ride-details-list and return
        if (rideDetailsList) {
            rideDetailsList.innerHTML = ''; // Clear the list
        }
        return;
    }

    // Set up a listener for any changes in the 'userDetails' node
    userDetailsRef.on('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var userKey = childSnapshot.key;
            var userDetail = childSnapshot.val();

            // Check if 'timeout' message is available in user's details
            if (userDetail.status === 'timeout' || userDetail.Driver_status === 'Confirm') {
                // If 'timeout' message is available, skip this user and continue to next
                return; // Skip to next iteration
            }

            // Check if vehicleType matches userDetail.mode
            var vehicleType = localStorage.getItem('vehicleType');
            // if (vehicleType && userDetail.mode === vehicleType) {

            if (userDetail.mode === vehicleType) {
                var rideItem = createRideItem(userKey, userDetail);
                if (rideItem) {
                    if (!rideDetailsList) {
                        // If ride-details-list doesn't exist, create it
                        rideDetailsList = document.createElement('ul');
                        rideDetailsList.id = 'ride-details-list';
                        var container = document.querySelector('.container');
                        container.appendChild(rideDetailsList);
                    }
                    rideDetailsList.appendChild(rideItem);

                    var acceptButton = handleAcceptButton(rideItem, userKey);
                    var declineButton = handleDeclineButton(userKey);
                    rideItem.appendChild(acceptButton);
                    rideItem.appendChild(declineButton);

                    startTimer(userKey, 60); // Using userKey for timer
                    // Play alert tone
                    playAlertTone();
                    blinkBackground();
                }
            }
        });
    }, function (error) {
        console.error('Error getting user details:', error);
        displayNoDriversMessage(); // Consider updating message
    });
}



// Function to handle timeout message
function handleTimeoutMessage(userKey) {
    var userDetailsRef = database.ref('userDetails/' + userKey);
    userDetailsRef.update({
        'status': 'timeout' // Updating status to 'timeout'
    });
}

// Function to handle timeout message
function handleConfirmMessage(userKey) {
    var userDetailsRef = database.ref('userDetails/' + userKey);
    userDetailsRef.update({
        'Driver_status': 'Confirm' // Updating status to 'timeout'
    });
}




// Set up ride interval
// var intervalTime = 60000; // 1 minute
// var rideInterval = setInterval(getRide, intervalTime);
