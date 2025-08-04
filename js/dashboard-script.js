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

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyB7_Tdz7SGtcj-qN8Ro7uAmoVrPyuR5cqc",
    authDomain: "climatecurtainsab.firebaseapp.com",
    projectId: "climatecurtainsab",
    storageBucket: "climatecurtainsab.appspot.com",
    messagingSenderId: "534408595576",
    appId: "1:534408595576:web:c73c886ab1ea1abd9e858d",
    measurementId: "G-3GNNYNJKM7"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const loadingSpinner = document.getElementById('loading');
const dashboardView = document.getElementById('dashboard-view');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const investorResourcesSection = document.getElementById('investor-resources');
const investorFilesList = document.getElementById('investor-files-list');

// --- Main Authentication Flow ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, listen for their profile data
        const userProfileRef = doc(db, "users", user.uid);
        onSnapshot(userProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                loadingSpinner.classList.add('hidden');
                dashboardView.classList.remove('hidden');
                
                const profile = docSnap.data();
                
                // Populate dashboard with user data
                welcomeMessage.textContent = `Welcome, ${profile.companyName || profile.firstName}!`;
                document.getElementById('dashboard-company-name').textContent = profile.companyName || 'N/A';
                document.getElementById('dashboard-role').textContent = profile.roleInCompany || 'N/A';
                document.getElementById('dashboard-sqm').textContent = profile.squareMeterInFactory || 'N/A';
                document.getElementById('dashboard-investor').textContent = profile.isInvestor ? 'Yes' : 'No';
                const linkedinLink = document.getElementById('dashboard-linkedin');
                linkedinLink.href = profile.linkedinProfile || '#';
                linkedinLink.textContent = profile.linkedinProfile || 'Not Provided';
                document.getElementById('dashboard-uid').textContent = user.uid;

                // Show investor resources if applicable
                if (profile.isInvestor) {
                    investorResourcesSection.classList.remove('hidden');
                    loadInvestorFiles();
                } else {
                    investorResourcesSection.classList.add('hidden');
                }

            } else {
                // This shouldn't happen if registration was successful
                console.error("User profile document not found!");
                signOut(auth); // Log out to prevent being stuck
            }
        });
    } else {
        // User is signed out, redirect to portal
        window.location.href = 'portal.html';
    }
});

// --- Data Fetching ---
async function loadInvestorFiles() {
    try {
        const filesSnapshot = await getDocs(collection(db, "public/investor_files"));
        investorFilesList.innerHTML = ''; // Clear existing list
        if (filesSnapshot.empty) {
            investorFilesList.innerHTML = '<p>No files have been uploaded yet.</p>';
            return;
        }
        filesSnapshot.forEach(fileDoc => {
            const fileData = fileDoc.data();
            const fileItem = document.createElement('div');
            fileItem.className = 'flex justify-between items-center bg-white p-4 rounded-lg shadow-sm';
            fileItem.innerHTML = `
                <span class="font-semibold">${fileData.fileName}</span>
                <a href="${fileData.downloadURL}" target="_blank" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Download</a>
            `;
            investorFilesList.appendChild(fileItem);
        });
    } catch (error) {
        console.error("Error loading investor files:", error);
        investorFilesList.innerHTML = '<p>Could not load files.</p>';
    }
}

// --- Event Listeners ---
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOut(auth);
    });
}
