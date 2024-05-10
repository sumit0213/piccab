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
// Initialize Firebase Realtime Database
const database = firebase.database();

// Get a reference to the Firebase auth service
const auth = firebase.auth();

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
