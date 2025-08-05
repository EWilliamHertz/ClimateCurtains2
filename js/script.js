import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

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

// --- General UI Functions ---
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
}

// --- Dashboard Page Logic ---
function handleDashboardPage() {
    const loadingView = document.getElementById('loading');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutButton = document.getElementById('logout-button');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in, show the dashboard
            loadingView.classList.add('hidden');
            dashboardContent.classList.remove('hidden');

            const profileRef = doc(db, 'users', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const profile = profileSnap.data();
                document.getElementById('welcome-message').textContent = `Welcome, ${profile.companyName || 'Valued Client'}!`;
                document.getElementById('dashboard-company-name').textContent = profile.companyName || 'N/A';
                document.getElementById('dashboard-role').textContent = profile.roleInCompany || 'N/A';
                document.getElementById('dashboard-uid').textContent = user.uid;
                document.getElementById('dashboard-investor').textContent = profile.isInvestor ? 'Yes' : 'No';

                // If user is an investor, show the resources section and fetch files
                if (profile.isInvestor) {
                    const investorResources = document.getElementById('investor-resources');
                    const investorFilesList = document.getElementById('investor-files-list');
                    investorResources.classList.remove('hidden');

                    const filesSnapshot = await getDocs(collection(db, 'investor_files'));
                    investorFilesList.innerHTML = '';
                    filesSnapshot.forEach(fileDoc => {
                        const fileData = fileDoc.data();
                        const fileItem = document.createElement('div');
                        fileItem.className = 'flex justify-between items-center bg-gray-100 p-3 rounded-lg';
                        fileItem.innerHTML = `
                            <span class="font-semibold">${fileData.fileName}</span>
                            <a href="${fileData.downloadURL}" target="_blank" class="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-sm">Download</a>
                        `;
                        investorFilesList.appendChild(fileItem);
                    });
                }
            }

            // Fetch installations
            const installationsList = document.getElementById('installations-list');
            const noInstallationsMessage = document.getElementById('no-installations-message');
            const q = query(collection(db, "installations"), where("customerId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            installationsList.innerHTML = '';
            if (querySnapshot.empty) {
                noInstallationsMessage.classList.remove('hidden');
            } else {
                noInstallationsMessage.classList.add('hidden');
                querySnapshot.forEach((doc) => {
                    const installation = doc.data();
                    const card = document.createElement('div');
                    card.className = 'border border-gray-200 p-4 rounded-lg shadow-sm';
                    card.innerHTML = `
                        <h3 class="text-xl font-semibold">${installation.location || 'Installation Details'}</h3>
                        <p><strong>Date:</strong> ${installation.installationDate ? new Date(installation.installationDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                    `;
                    installationsList.appendChild(card);
                });
            }

        } else {
            // No user is signed in. Redirect to login page.
            window.location.replace('portal.html');
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await signOut(auth);
            window.location.replace('../index.html');
        });
    }
}

// --- Main Execution Logic ---
document.addEventListener('DOMContentLoaded', () => {
    setupHamburgerMenu();

    // Determine which page is loaded and run the correct logic
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'dashboard.html') {
        handleDashboardPage();
    }
    // Note: The logic for portal.html and admin.html is self-contained in those files.
});
