import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    onSnapshot,
    collection,
    getDocs
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {
    getStorage
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';

// Firebase configuration from the user
const firebaseConfig = {
    apiKey: "AIzaSyB7_Tdz7SGtcj-qN8Ro7uAmoVrPyuR5cqc",
    authDomain: "climatecurtainsab.firebaseapp.com",
    projectId: "climatecurtainsab",
    storageBucket: "climatecurtainsab.appspot.com",
    messagingSenderId: "534408595576",
    appId: "1:534408595576:web:c73c886ab1ea1abd9e858d",
    measurementId: "G-3GNNYNJKM7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM elements
const messageBox = document.getElementById('message-box');
const loadingSpinner = document.getElementById('loading');
const dashboardView = document.getElementById('dashboard-view');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const investorResourcesSection = document.getElementById('investor-resources');
const investorFilesList = document.getElementById('investor-files-list');

// Helper function to show messages
function showMessage(msg, isError = false) {
    if (!messageBox) return;
    messageBox.textContent = msg;
    messageBox.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// Function to handle auth state on dashboard page
async function handleDashboardPage() {
    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            // *** FIXED: Simplified the path to the user profile document ***
            const docRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(docRef, async (docSnap) => {
                if (docSnap.exists()) {
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    dashboardView.classList.remove('hidden');

                    const profile = docSnap.data();
                    if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${profile.companyName}!`;
                    // ... (rest of the profile display logic remains the same)

                } else {
                    // Profile doesn't exist, something is wrong.
                    showMessage("User profile not found. Please contact support.", true);
                    signOut(auth); // Sign out and redirect
                }
            }, (error) => {
                console.error("Error fetching user profile:", error);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                showMessage(`Error: ${error.message}`, true);
            });
            window.addEventListener('beforeunload', () => unsubscribe());
        } else {
            // No user is signed in, redirect to the portal.
            if (!window.location.pathname.includes('portal.html')) {
                window.location.href = 'portal.html';
            }
        }
    });
}


// Logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // The onAuthStateChanged listener will handle the redirect to portal.html
        } catch (error) {
            console.error("Logout failed:", error);
            showMessage(`Logout failed: ${error.message}`, true);
        }
    });
}

// Initialize the correct page logic based on URL
document.addEventListener('DOMContentLoaded', () => {
    handleDashboardPage();
});    
