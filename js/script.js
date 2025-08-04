import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
    getAuth,
    signInWithCustomToken,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

// Firebase configuration from the user
const firebaseConfig = {
    apiKey: "AIzaSyB7_Tdz7SGtcj-qN8Ro7uAmoVrPyuR5cqc",
    authDomain: "climatecurtainsab.firebaseapp.com",
    projectId: "climatecurtainsab",
    storageBucket: "climatecurtainsab.firebasestorage.app",
    messagingSenderId: "534408595576",
    appId: "1:534408595576:web:c73c886ab1ea1abd9e858d",
    measurementId: "G-3GNNYNJKM7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.projectId;

// DOM elements
const messageBox = document.getElementById('message-box');
const loadingSpinner = document.getElementById('loading');
const authView = document.getElementById('auth-view');
const authTitle = document.getElementById('auth-title');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleAuthLink = document.getElementById('toggle-auth');
const toggleRegisterLink = document.getElementById('toggle-register-link');
const dashboardView = document.getElementById('dashboard-view');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const mainContent = document.getElementById('main-content');


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

// Helper function to toggle between login and registration forms
window.toggleView = (view) => {
    if (view === 'register') {
        authTitle.textContent = 'Client Registration';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleAuthLink.innerHTML = 'Already have an account? <span id="toggle-login-link" class="text-green-500 cursor-pointer hover:underline">Login here</span>';
        document.getElementById('toggle-login-link').addEventListener('click', () => toggleView('login'));
    } else {
        authTitle.textContent = 'Client Portal Login';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        toggleAuthLink.innerHTML = 'Don\'t have an account? <span id="toggle-register-link" class="text-green-500 cursor-pointer hover:underline">Register here</span>';
        document.getElementById('toggle-register-link').addEventListener('click', () => toggleView('register'));
    }
}

// Function to handle form submission (login/register)
function handleAuthForms() {
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            if (authView) authView.classList.add('hidden');
            const email = loginForm.querySelector('#login-email').value;
            const password = loginForm.querySelector('#login-password').value;
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const docRef = doc(db, `/artifacts/${appId}/users/${user.uid}/user_profiles`, 'profile');
                const docSnap = await getDoc(docRef);

                let isAdmin = false;
                if (docSnap.exists()) {
                    isAdmin = docSnap.data().isAdmin || false;
                }
                
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userIsAdmin', isAdmin);
                showMessage("Login successful!");
                if (isAdmin) {
                     window.location.href = 'admin.html';
                } else {
                     window.location.href = 'dashboard.html';
                }
            } catch (error) {
                console.error("Login failed:", error);
                showMessage(`Login failed: ${error.message}`, true);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                if (authView) authView.classList.remove('hidden');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            if (authView) authView.classList.add('hidden');
            const email = registerForm.querySelector('#register-email').value;
            const password = registerForm.querySelector('#register-password').value;
            const companyName = registerForm.querySelector('#register-company-name').value;
            const roleInCompany = registerForm.querySelector('#register-role').value;
            const linkedinProfile = registerForm.querySelector('#register-linkedin').value;
            const squareMeterInFactory = registerForm.querySelector('#register-sqm').value;
            const isInvestor = registerForm.querySelector('#register-investor').checked;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                const userProfileRef = doc(db, `/artifacts/${appId}/users/${newUser.uid}/user_profiles`, 'profile');
                
                const isAdmin = email === 'ernst@hatake.eu'; // Set admin flag for specific email
                
                await setDoc(userProfileRef, {
                    companyName,
                    roleInCompany,
                    linkedinProfile,
                    squareMeterInFactory: squareMeterInFactory || 'N/A',
                    isInvestor,
                    registeredAt: serverTimestamp(),
                    isAdmin // Set admin flag
                });
                
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userIsAdmin', isAdmin);
                showMessage("Registration successful!");
                if (isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                console.error("Registration failed:", error);
                showMessage(`Registration failed: ${error.message}`, true);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                if (authView) authView.classList.remove('hidden');
            }
        });
    }
}

// Function to handle auth state on portal page
function handlePortalPage() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docRef = doc(db, `/artifacts/${appId}/users/${user.uid}/user_profiles`, 'profile');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && !user.isAnonymous) {
                if (docSnap.data().isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                 if (loadingSpinner) loadingSpinner.classList.add('hidden');
                 if (authView) authView.classList.remove('hidden');
                 if (toggleRegisterLink) toggleRegisterLink.addEventListener('click', () => toggleView('register'));
            }
        } else {
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            if (authView) authView.classList.remove('hidden');
            if (toggleRegisterLink) toggleRegisterLink.addEventListener('click', () => toggleView('register'));
        }
    });
}

// Function to handle auth state on dashboard/admin pages
function handleDashboardPage() {
    const userIsLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userIsAdmin = localStorage.getItem('userIsAdmin') === 'true';

    if (!userIsLoggedIn) {
        window.location.href = 'portal.html';
        return;
    }

    if (window.location.pathname.includes('admin.html') && !userIsAdmin) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            const docRef = doc(db, `/artifacts/${appId}/users/${user.uid}/user_profiles`, 'profile');
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const profile = docSnap.data();
                    if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${profile.companyName}!`;
                    if (document.getElementById('dashboard-company-name')) document.getElementById('dashboard-company-name').textContent = profile.companyName;
                    if (document.getElementById('dashboard-role')) document.getElementById('dashboard-role').textContent = profile.roleInCompany;
                    if (document.getElementById('dashboard-sqm')) document.getElementById('dashboard-sqm').textContent = profile.squareMeterInFactory;
                    if (document.getElementById('dashboard-investor')) document.getElementById('dashboard-investor').textContent = profile.isInvestor ? 'Yes' : 'No';
                    if (document.getElementById('dashboard-linkedin')) {
                        document.getElementById('dashboard-linkedin').href = profile.linkedinProfile;
                        document.getElementById('dashboard-linkedin').textContent = profile.linkedinProfile;
                    }
                    if (document.getElementById('dashboard-uid')) document.getElementById('dashboard-uid').textContent = user.uid;
                    if (dashboardView) dashboardView.classList.remove('hidden');
                } else {
                    showMessage("User profile not found. Please contact support.", true);
                    signOut(auth);
                    window.location.href = 'portal.html';
                }
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }, (error) => {
                console.error("Error fetching user profile:", error);
                showMessage(`Error fetching user profile: ${error.message}`, true);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            });
            window.addEventListener('beforeunload', () => unsubscribe());
        } else {
            window.location.href = 'portal.html';
        }
    });
}


// Admin page specific logic
async function handleAdminPage() {
    const userIsLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userIsAdmin = localStorage.getItem('userIsAdmin') === 'true';

    if (!userIsLoggedIn || !userIsAdmin) {
        window.location.href = 'portal.html';
        return;
    }

    // Tab switching logic
    window.switchTab = (tabName) => {
        const tabs = document.querySelectorAll('.tabs button');
        tabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector(`#tab-button-${tabName}`).classList.add('active');

        document.getElementById('users-tab-content').classList.add('hidden');
        document.getElementById('investors-tab-content').classList.add('hidden');
        document.getElementById('inquiries-tab-content').classList.add('hidden');
        document.getElementById(`${tabName}-tab-content`).classList.remove('hidden');
    };
    
    // Fetch and display all users
    const usersCollectionRef = collection(db, `/artifacts/${appId}/users`);
    const usersListBody = document.querySelector('#user-list-table tbody');
    let totalUsers = 0;
    let totalCompanies = new Set();
    
    const usersSnapshot = await getDocs(usersCollectionRef);
    usersSnapshot.forEach(userDoc => {
        const userProfileRef = doc(db, userDoc.ref.path, 'user_profiles/profile');
        onSnapshot(userProfileRef, (profileSnap) => {
            if (profileSnap.exists()) {
                const profile = profileSnap.data();
                // Get email from Firestore profile data
                const email = profile.email || 'N/A';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${profile.companyName || 'N/A'}</td>
                    <td>${email}</td>
                    <td>${profile.roleInCompany || 'N/A'}</td>
                    <td>${profile.squareMeterInFactory || 'N/A'}</td>
                    <td>${profile.isInvestor ? 'Yes' : 'No'}</td>
                    <td>${userDoc.id}</td>
                `;
                usersListBody.appendChild(tr);

                totalUsers++;
                totalCompanies.add(profile.companyName);
                if (document.getElementById('total-users')) document.getElementById('total-users').textContent = totalUsers;
                if (document.getElementById('registered-companies')) document.getElementById('registered-companies').textContent = totalCompanies.size;
            }
        });
    });

    // Populate investor list
    const investorListGrid = document.getElementById('investor-list-grid');
    if (investorListGrid) {
        investorListGrid.innerHTML = ''; // Clear existing content
        for (const category in investorData) {
            investorData[category].forEach(investor => {
                const card = document.createElement('div');
                card.className = 'investor-card';
                card.innerHTML = `
                    <h3>${investor.contact.split(',')[0]}</h3>
                    <p><strong>Contact:</strong> ${investor.contact}</p>
                    <p><strong>Email:</strong> <a href="mailto:${investor.email}">${investor.email}</a></p>
                    <p><strong>Website:</strong> <a href="${investor.website}" target="_blank">${investor.website}</a></p>
                    <p><strong>Focus:</strong> ${investor.focus}</p>
                    <p><strong>Relevance:</strong> ${investor.relevance}</p>
                `;
                investorListGrid.appendChild(card);
            });
        }
    }


    // Dummy inquiry data for now
    if (inquiryListTable) {
        const inquiryListBody = inquiryListTable.querySelector('tbody');
        inquiryListBody.innerHTML = `
            <tr>
                <td>2025-08-03</td>
                <td>Northvolt</td>
                <td>Quote Request from Calculator</td>
                <td>New</td>
                <td><a href="#">View</a></td>
            </tr>
            <tr>
                <td>2025-08-02</td>
                <td>Dongguan Zhuohaoyang PKG Co., Ltd</td>
                <td>General Inquiry</td>
                <td>In Progress</td>
                <td><a href="#">View</a></td>
            </tr>
        `;
        if (document.getElementById('total-inquiries')) document.getElementById('total-inquiries').textContent = 2; // Placeholder
    }
}


// Logout functionality
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('userIsAdmin');
            showMessage("Logged out successfully.");
            window.location.href = 'portal.html';
        } catch (error) {
            console.error("Logout failed:", error);
            showMessage(`Logout failed: ${error.message}`, true);
        }
    });
}

// Initialize the correct page logic based on URL
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('portal.html')) {
        handlePortalPage();
        handleAuthForms();
    } else if (window.location.pathname.includes('dashboard.html')) {
        handleDashboardPage();
    } else if (window.location.pathname.includes('admin.html')) {
        handleAdminPage();
    }
});

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Add active class to current page in navigation
    const currentLocation = window.location.pathname;
    const navLinkItems = document.querySelectorAll('.nav-links a');
    const menuLength = navLinkItems.length;
    
    for (let i = 0; i < menuLength; i++) {
        if (navLinkItems[i].getAttribute('href') === currentLocation || 
            navLinkItems[i].getAttribute('href') === currentLocation.substring(currentLocation.lastIndexOf('/') + 1)) {
            navLinkItems[i].classList.add('active');
        } else if (currentLocation === '/' || currentLocation === '/index.html') {
            if (navLinkItems[i].getAttribute('href') === 'index.html' || navLinkItems[i].getAttribute('href') === './') {
                navLinkItems[i].classList.add('active');
            }
        }
    }
});
