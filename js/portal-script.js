import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
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
const authView = document.getElementById('auth-view');
const authTitle = document.getElementById('auth-title');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleAuthLink = document.getElementById('toggle-auth');

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
        document.getElementById('toggle-login-link').addEventListener('click', () => window.toggleView('login'));
    } else {
        authTitle.textContent = 'Client Portal Login';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        toggleAuthLink.innerHTML = 'Don\'t have an account? <span id="toggle-register-link" class="text-green-500 cursor-pointer hover:underline">Register here</span>';
        document.getElementById('toggle-register-link').addEventListener('click', () => window.toggleView('register'));
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
                await signInWithEmailAndPassword(auth, email, password);
                // The onAuthStateChanged listener will handle the redirect
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
            const firstName = registerForm.querySelector('#register-first-name').value;
            const lastName = registerForm.querySelector('#register-last-name').value;
            const companyName = registerForm.querySelector('#register-company-name').value;
            const roleInCompany = registerForm.querySelector('#register-role').value;
            const continent = registerForm.querySelector('#register-continent').value;
            const country = registerForm.querySelector('#register-country').value;
            const wechatPhone = registerForm.querySelector('#register-wechat-phone').value;
            const linkedinProfile = registerForm.querySelector('#register-linkedin').value;
            const squareMeterInFactory = registerForm.querySelector('#register-sqm').value;
            const isInvestor = registerForm.querySelector('#register-investor').checked;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                // *** FIXED: This now uses a simple, robust path for the new user profile ***
                const userProfileRef = doc(db, 'users', newUser.uid); 
                const isAdmin = email === 'ernst@hatake.eu';
                await setDoc(userProfileRef, {
                    email,
                    firstName,
                    lastName,
                    companyName,
                    roleInCompany,
                    continent: continent || 'N/A',
                    country: country || 'N/A',
                    wechatPhone: wechatPhone || 'N/A',
                    linkedinProfile,
                    squareMeterInFactory: squareMeterInFactory || 'N/A',
                    isInvestor,
                    registeredAt: serverTimestamp(),
                    isAdmin
                });
                // The onAuthStateChanged listener will handle the redirect
            } catch (error) {
                console.error("Registration failed:", error);
                showMessage(`Registration failed: ${error.message}`, true);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                if (authView) authView.classList.remove('hidden');
            }
        });
    }
}

// Centralized authentication handler
onAuthStateChanged(auth, async (user) => {
    if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('admin.html')) {
        return;
    }

    if (user) {
        // *** FIXED: This now checks the simple, robust path for the user profile ***
        const docRef = doc(db, 'users', user.uid);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && !user.isAnonymous) {
                if (docSnap.data().isAdmin) {
                    if (!window.location.pathname.includes('admin.html')) {
                        window.location.href = 'admin.html';
                    }
                } else {
                    if (!window.location.pathname.includes('dashboard.html')) {
                        window.location.href = 'dashboard.html';
                    }
                }
            } else {
                 if (loadingSpinner) loadingSpinner.classList.add('hidden');
                 if (authView) authView.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Redirect check failed:", error);
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            if (authView) authView.classList.remove('hidden');
        }
    } else {
        // No user, ensure login/register forms are visible
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (authView) authView.classList.remove('hidden');
        const toggleRegisterLink = document.getElementById('toggle-register-link');
        if (toggleRegisterLink) toggleRegisterLink.addEventListener('click', () => window.toggleView('register'));
    }
});


// Initialize the correct page logic
document.addEventListener('DOMContentLoaded', () => {
    handleAuthForms();
    const toggleRegisterLink = document.getElementById('toggle-register-link');
    if (toggleRegisterLink) toggleRegisterLink.addEventListener('click', () => window.toggleView('register'));
});
