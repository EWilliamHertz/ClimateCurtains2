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
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        });
    }
}

function showMessage(msg, isError = false) {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) return;
    messageBox.textContent = msg;
    // Using Tailwind classes for styling the message box
    messageBox.className = 'fixed top-5 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

// --- Page-Specific Logic ---

function handlePortalPage() {
    const authView = document.getElementById('auth-view');
    const loadingSpinner = document.getElementById('loading');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const toggleAuth = document.getElementById('toggle-auth').querySelector('span');

    const toggleView = (isRegistering) => {
        if (isRegistering) {
            authTitle.textContent = 'Client Registration';
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            toggleAuth.textContent = 'Login here';
        } else {
            authTitle.textContent = 'Client Portal Login';
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            toggleAuth.textContent = 'Register here';
        }
    };

    toggleAuth.addEventListener('click', () => {
        const isRegistering = loginForm.classList.contains('hidden');
        toggleView(!isRegistering);
    });

    const handleAuthSuccess = async (user) => {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loadingSpinner.classList.remove('hidden');
        authView.classList.add('hidden');
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await handleAuthSuccess(userCredential.user);
        } catch (error) {
            console.error("Login failed:", error);
            showMessage(`Login failed: ${error.message}`, true);
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    });

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
            const userProfileRef = doc(db, 'users', newUser.uid);
            const isAdmin = email === 'ernst@hatake.eu';

            await setDoc(userProfileRef, {
                email,
                companyName,
                roleInCompany,
                linkedinProfile,
                squareMeterInFactory: squareMeterInFactory || 'N/A',
                isInvestor,
                isAdmin,
                registeredAt: serverTimestamp(),
            });
            await handleAuthSuccess(newUser);
        } catch (error) {
            console.error("Registration failed:", error);
            showMessage(`Registration failed: ${error.message}`, true);
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            handleAuthSuccess(user);
        } else {
            loadingSpinner.classList.add('hidden');
            authView.classList.remove('hidden');
        }
    });
}

function handleDashboardPage() {
    const loadingSpinner = document.getElementById('loading');
    const dashboardContent = document.getElementById('dashboard-content');
    const logoutButton = document.getElementById('logout-button');

    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            try {
                const profileRef = doc(db, 'users', user.uid);
                const profileSnap = await getDoc(profileRef);

                if (!profileSnap.exists()) {
                    throw new Error("User profile not found. Please contact support.");
                }

                const profile = profileSnap.data();
                
                document.getElementById('welcome-message').textContent = `Welcome, ${profile.companyName || 'Valued Client'}!`;
                document.getElementById('dashboard-company-name').textContent = profile.companyName || 'N/A';
                document.getElementById('dashboard-role').textContent = profile.roleInCompany || 'N/A';
                document.getElementById('dashboard-uid').textContent = user.uid;
                document.getElementById('dashboard-investor').textContent = profile.isInvestor ? 'Yes' : 'No';

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
                            <p><strong>Curtain Area:</strong> ${installation.curtainArea || 'N/A'} m²</p>
                            <p><strong>R-Value:</strong> R-${installation.rValue || 'N/A'}</p>
                            ${installation.documentationURL ? `<a href="${installation.documentationURL}" target="_blank" class="text-green-600 hover:underline mt-2 inline-block">View Maintenance Guide</a>` : ''}
                        `;
                        installationsList.appendChild(card);
                    });
                }
                
                if (profile.isInvestor) {
                    // Logic to show investor resources
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

function handleContactPage() {
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, 'inquiries'), {
                    name: inquiryForm.name.value,
                    email: inquiryForm.email.value,
                    company: inquiryForm.company.value,
                    subject: inquiryForm.subject.value,
                    message: inquiryForm.message.value,
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
            // handleAdminPage();
            break;
        case 'contact.html':
            handleContactPage();
            break;
    }
});
