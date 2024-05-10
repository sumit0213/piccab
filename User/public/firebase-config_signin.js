// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD_OF-GCSb49quE1Jbs9vA7_cotXjQaPpk",
    authDomain: "urban-cab-2-96e07.firebaseapp.com",
    databaseURL: "https://urban-cab-2-96e07-default-rtdb.firebaseio.com",
    projectId: "urban-cab-2-96e07",
    storageBucket: "urban-cab-2-96e07.appspot.com",
    messagingSenderId: "655633876241",
    appId: "1:655633876241:web:e0db94634c06e34dcef8b0",
    measurementId: "G-CW48Z88FY3"
};

firebase.initializeApp(firebaseConfig);

// Get a reference to the Firebase auth service
const auth = firebase.auth();

let userEmail = null; // Initialize userEmail as null

// Add login event listener
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Sign in with email and password
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            // Store email in userEmail
            userEmail = user.email;
            console.log("Logged in as:", userEmail); // Print email ID in console
            // Redirect to index.html
            window.location.href = 'index.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // Handle login errors
            console.error(errorCode, errorMessage);
        });
});

// Add listener for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        userEmail = user.email; // Store email in userEmail
        console.log("Logged in as:", userEmail); // Print email ID in console
        // Update account name in the UI
        document.getElementById('accountName').textContent = userEmail;
    } else {
        // No user is signed in
        console.log("Not logged in");
        userEmail = null; // Reset userEmail
        // Update account name in the UI to show not logged in or similar message
        document.getElementById('accountName').textContent = 'Not logged in';
    }
});
