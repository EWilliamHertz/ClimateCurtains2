import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
    getAuth,
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
    serverTimestamp
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
const authView = document.getElementById('auth-view');
const messageBox = document.getElementById('message-box');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTitle = document.getElementById('auth-title');
const toggleAuthLink = document.getElementById('toggle-auth');

// --- Helper Functions ---
function showMessage(msg, isError = false) {
    if (!messageBox) return;
    messageBox.textContent = msg;
    messageBox.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

function toggleView(isRegisterView) {
    if (isRegisterView) {
        authTitle.textContent = 'Client Registration';
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleAuthLink.innerHTML = 'Already have an account? <span class="text-green-500 cursor-pointer hover:underline">Login here</span>';
        toggleAuthLink.querySelector('span').addEventListener('click', () => toggleView(false));
    } else {
        authTitle.textContent = 'Client Portal Login';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        toggleAuthLink.innerHTML = 'Don\'t have an account? <span class="text-green-500 cursor-pointer hover:underline">Register here</span>';
        toggleAuthLink.querySelector('span').addEventListener('click', () => toggleView(true));
    }
}

function showAuthUI() {
    loadingSpinner.classList.add('hidden');
    authView.classList.remove('hidden');
}

// --- Event Handlers ---
function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAuthUI(); // Ensure UI is visible
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                // onAuthStateChanged will handle the redirect
            } catch (error) {
                showMessage(`Login failed: ${error.message}`, true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAuthUI(); // Ensure UI is visible

            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;
            
            const userDetails = {
                firstName: registerForm['register-first-name'].value,
                lastName: registerForm['register-last-name'].value,
                companyName: registerForm['register-company-name'].value,
                roleInCompany: registerForm['register-role'].value,
                linkedinProfile: registerForm['register-linkedin'].value,
                squareMeterInFactory: registerForm['register-sqm'].value || 'N/A',
                isInvestor: registerForm['register-investor'].checked,
                email: email,
                isAdmin: email.toLowerCase() === 'ernst@hatake.eu',
                registeredAt: serverTimestamp()
            };

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                await setDoc(doc(db, 'users', newUser.uid), userDetails);
                // onAuthStateChanged will handle the redirect
            } catch (error) {
                showMessage(`Registration failed: ${error.message}`, true);
            }
        });
    }
    
    // Initial setup for the toggle link
    const toggleSpan = toggleAuthLink.querySelector('span');
    if (toggleSpan) {
        toggleSpan.addEventListener('click', () => toggleView(true));
    }
}

// --- Main Authentication Flow ---
function initializePortal() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userProfileRef = doc(db, 'users', user.uid);
            try {
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists()) {
                    const isAdmin = docSnap.data().isAdmin;
                    window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
                } else {
                     showMessage("Your user profile was not found. Please contact support.", true);
                     await signOut(auth);
                     showAuthUI();
                }
            } catch (error) {
                showMessage("Error checking your user profile. Please try again.", true);
                await signOut(auth);
                showAuthUI();
            }
        } else {
            // No user is logged in, show the auth form and set up listeners
            showAuthUI();
            setupEventListeners();
        }
    });
}

// --- Initialize Page ---
document.addEventListener('DOMContentLoaded', initializePortal);
