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
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

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

// DOM elements
const messageBox = document.getElementById('message-box');
const loadingSpinner = document.getElementById('loading');
const dashboardView = document.getElementById('dashboard-view');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');

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
            const docRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(docRef, async (docSnap) => {
                if (docSnap.exists()) {
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    dashboardView.classList.remove('hidden');

                    const profile = docSnap.data();
                    if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${profile.companyName}!`;
                    // You can add more dashboard population logic here if needed

                } else {
                    showMessage("User profile not found. Please contact support.", true);
                    signOut(auth);
                }
            }, (error) => {
                console.error("Error fetching user profile:", error);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                showMessage(`Error: ${error.message}`, true);
            });
            window.addEventListener('beforeunload', () => unsubscribe());
        } else {
            if (!window.location.pathname.includes('portal.html')) {
                window.location.href = 'portal.html';
            }
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
            showMessage(`Logout failed: ${error.message}`, true);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    handleDashboardPage();
});
