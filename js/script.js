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
    onSnapshot,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    addDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';

// --- Firebase Configuration ---
// This configuration is used to connect to your Firebase project.
const firebaseConfig = {
    apiKey: "AIzaSyB7_Tdz7SGtcj-qN8Ro7uAmoVrPyuR5cqc",
    authDomain: "climatecurtainsab.firebaseapp.com",
    projectId: "climatecurtainsab",
    storageBucket: "climatecurtainsab.appspot.com",
    messagingSenderId: "534408595576",
    appId: "1:534408595576:web:c73c886ab1ea1abd9e858d",
    measurementId: "G-3GNNYNJKM7"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- General UI Functions ---

/**
 * Toggles the mobile navigation menu.
 */
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

/**
 * Sets up the "Back to Top" button functionality.
 */
function setupBackToTopButton() {
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.onscroll = () => {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                backToTopButton.style.display = "block";
            } else {
                backToTopButton.style.display = "none";
            }
        };
        backToTopButton.addEventListener('click', () => {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        });
    }
}

/**
 * Displays a message to the user.
 * @param {string} msg - The message to display.
 * @param {boolean} [isError=false] - Whether the message is an error.
 */
function showMessage(msg, isError = false) {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) return;
    messageBox.textContent = msg;
    messageBox.className = 'fixed top-5 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// --- Page-Specific Logic ---

/**
 * Handles the logic for the authentication page (portal.html).
 * Manages login, registration, and view toggling.
 */
function handlePortalPage() {
    const authView = document.getElementById('auth-view');
    const loadingSpinner = document.getElementById('loading');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const toggleAuthLink = document.getElementById('toggle-auth');

    // Function to toggle between login and register views
    const toggleView = (view) => {
        if (view === 'register') {
            authTitle.textContent = 'Client Registration';
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            toggleAuthLink.innerHTML = 'Already have an account? <span class="text-green-500 cursor-pointer hover:underline">Login here</span>';
            toggleAuthLink.querySelector('span').addEventListener('click', () => toggleView('login'));
        } else {
            authTitle.textContent = 'Client Portal Login';
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            toggleAuthLink.innerHTML = 'Don\'t have an account? <span class="text-green-500 cursor-pointer hover:underline">Register here</span>';
            toggleAuthLink.querySelector('span').addEventListener('click', () => toggleView('register'));
        }
    };

    // Initial setup for the toggle link
    toggleAuthLink.querySelector('span').addEventListener('click', () => toggleView('register'));

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingSpinner.classList.remove('hidden');
        authView.classList.add('hidden');
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle redirection
        } catch (error) {
            console.error("Login failed:", error);
            showMessage(`Login failed: ${error.message}`, true);
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    });

    // Registration form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingSpinner.classList.remove('hidden');
        authView.classList.add('hidden');
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        const companyName = registerForm['register-company-name'].value;
        const roleInCompany = registerForm['register-role'].value;
        const isInvestor = registerForm['register-investor'].checked;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            // Using a more standard path for user profiles
            const userProfileRef = doc(db, 'users', newUser.uid);
            const isAdmin = email === 'ernst@hatake.eu'; // Admin check

            await setDoc(userProfileRef, {
                email,
                companyName,
                roleInCompany,
                isInvestor,
                isAdmin,
                registeredAt: serverTimestamp(),
            });
            // onAuthStateChanged will handle redirection
        } catch (error) {
            console.error("Registration failed:", error);
            showMessage(`Registration failed: ${error.message}`, true);
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    });

    // Auth state listener to redirect logged-in users
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    });
}

/**
 * Handles the logic for the client dashboard page (dashboard.html).
 * Fetches and displays user profile and their specific installation data.
 */
function handleDashboardPage() {
    const loadingSpinner = document.getElementById('loading');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutButton = document.getElementById('logout-button');

    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            try {
                // Fetch User Profile
                const profileRef = doc(db, 'users', user.uid);
                const profileSnap = await getDoc(profileRef);

                if (!profileSnap.exists()) {
                    throw new Error("User profile not found. Please contact support.");
                }

                const profile = profileSnap.data();
                
                // Populate Profile Info
                document.getElementById('welcome-message').textContent = `Welcome, ${profile.companyName || 'Valued Client'}!`;
                document.getElementById('dashboard-company-name').textContent = profile.companyName || 'N/A';
                document.getElementById('dashboard-role').textContent = profile.roleInCompany || 'N/A';
                document.getElementById('dashboard-uid').textContent = user.uid;
                document.getElementById('dashboard-investor').textContent = profile.isInvestor ? 'Yes' : 'No';

                // Fetch Installations Data
                const installationsList = document.getElementById('installations-list');
                const noInstallationsMessage = document.getElementById('no-installations-message');
                const q = query(collection(db, "installations"), where("customerId", "==", user.uid));
                const querySnapshot = await getDocs(q);
                
                installationsList.innerHTML = ''; // Clear previous content
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
                            <p><strong>Curtain Area:</strong> ${installation.curtainArea || 'N/A'} m²</p>
                            <p><strong>R-Value:</strong> R-${installation.rValue || 'N/A'}</p>
                            ${installation.documentationURL ? `<a href="${installation.documentationURL}" target="_blank" class="text-green-600 hover:underline mt-2 inline-block">View Maintenance Guide</a>` : ''}
                        `;
                        installationsList.appendChild(card);
                    });
                }
                
                // Show investor resources if applicable
                if (profile.isInvestor) {
                    const investorResourcesSection = document.getElementById('investor-resources');
                    const investorFilesList = document.getElementById('investor-files-list');
                    investorResourcesSection.classList.remove('hidden');
                    
                    const filesCollectionRef = collection(db, 'public_files', 'investor_docs', 'files');
                    const filesSnapshot = await getDocs(filesCollectionRef);
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

                loadingSpinner.classList.add('hidden');
                dashboardContent.classList.remove('hidden');

            } catch (error) {
                console.error("Error loading dashboard:", error);
                showMessage(error.message, true);
                setTimeout(async () => {
                    await signOut(auth);
                    window.location.href = 'portal.html';
                }, 5000);
            }

        } else {
            // No user is signed in, redirect to portal.
            window.location.href = 'portal.html';
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showMessage("You have been logged out.");
                window.location.href = '../index.html';
            } catch (error) {
                console.error("Logout failed:", error);
                showMessage(`Logout failed: ${error.message}`, true);
            }
        });
    }
}

/**
 * Handles the logic for the admin dashboard page (admin.html).
 */
async function handleAdminPage() {
    // This function would contain the logic for the admin page,
    // such as fetching all users, stats, and handling file uploads.
    // The original logic from the user's script can be adapted here.
    console.log("Admin page logic would run here.");
}

/**
 * Handles the logic for the contact page, including form submission.
 */
function handleContactPage() {
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = inquiryForm.name.value;
            const email = inquiryForm.email.value;
            const company = inquiryForm.company.value;
            const subject = inquiryForm.subject.value;
            const message = inquiryForm.message.value;

            try {
                await addDoc(collection(db, 'inquiries'), {
                    name,
                    email,
                    company,
                    subject,
                    message,
                    timestamp: serverTimestamp(),
                    status: 'New'
                });
                showMessage("Thank you for your message! We will get back to you shortly.");
                inquiryForm.reset();
            } catch (error) {
                console.error("Error sending message:", error);
                showMessage("There was an error sending your message. Please try again later.", true);
            }
        });
    }
}


// --- Main Execution ---
// This runs when the DOM is fully loaded. It checks which page is currently
// active and calls the appropriate handler function.
document.addEventListener('DOMContentLoaded', () => {
    setupHamburgerMenu();
    setupBackToTopButton();

    const page = window.location.pathname.split("/").pop();

    switch (page) {
        case 'portal.html':
            handlePortalPage();
            break;
        case 'dashboard.html':
            handleDashboardPage();
            break;
        case 'admin.html':
            handleAdminPage();
            break;
        case 'contact.html':
            handleContactPage();
            break;
        // Add cases for other pages if they need specific JS
    }
});
