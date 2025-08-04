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
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

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
const analytics = getAnalytics(app);
const appId = firebaseConfig.projectId;

// DOM elements
const messageBox = document.getElementById('message-box');
const loadingSpinner = document.getElementById('loading');
const authView = document.getElementById('auth-view');
const authTitle = document.getElementById('auth-title');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleAuthLink = document.getElementById('toggle-auth');
const dashboardView = document.getElementById('dashboard-view');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const mainContent = document.getElementById('main-content');

// Helper function to show messages
function showMessage(msg, isError = false) {
    messageBox.textContent = msg;
    messageBox.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// Function to handle form submission (login/register)
function handleAuthForms() {
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loadingSpinner.classList.remove('hidden');
            authView.classList.add('hidden');
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userIsAdmin', userCredential.user.email === 'admin@climatecurtains.com'); // Simple admin check
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Login failed:", error);
                showMessage(`Login failed: ${error.message}`, true);
                loadingSpinner.classList.add('hidden');
                authView.classList.remove('hidden');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loadingSpinner.classList.remove('hidden');
            authView.classList.add('hidden');
            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;
            const companyName = registerForm['register-company-name'].value;
            const roleInCompany = registerForm['register-role'].value;
            const linkedinProfile = registerForm['register-linkedin'].value;
            const squareMeterInFactory = registerForm['register-sqm'].value;
            const isInvestor = registerForm['register-investor'].checked;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                const userProfileRef = doc(db, `/artifacts/${appId}/users/${newUser.uid}/user_profiles`, 'profile');
                await setDoc(userProfileRef, {
                    companyName,
                    roleInCompany,
                    linkedinProfile,
                    squareMeterInFactory: squareMeterInFactory || 'N/A',
                    isInvestor,
                    registeredAt: new Date().toISOString()
                });
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userIsAdmin', false);
                showMessage("Registration successful!");
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error("Registration failed:", error);
                showMessage(`Registration failed: ${error.message}`, true);
                loadingSpinner.classList.add('hidden');
                authView.classList.remove('hidden');
            }
        });
    }
}

// Function to handle auth state on portal page
function handlePortalPage() {
    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            window.location.href = 'dashboard.html';
        } else {
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
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
    } else if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('admin.html')) {
        handleDashboardPage();
    }
});
