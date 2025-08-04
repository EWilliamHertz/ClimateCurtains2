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
    getDocs,
    addDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';

// Firebase configuration
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
const storage = getStorage(app);
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
const investorResourcesSection = document.getElementById('investor-resources');
const investorFilesList = document.getElementById('investor-files-list');
const adminDashboardSection = document.querySelector('.admin-dashboard');
const adminNameSpan = document.getElementById('admin-name');
const totalUsersElem = document.getElementById('total-users');
const registeredCompaniesElem = document.getElementById('registered-companies');
const totalInquiriesElem = document.getElementById('total-inquiries');
const userListTableBody = document.querySelector('#user-list-table tbody');
const investorListGrid = document.getElementById('investor-list-grid');
const inquiryListTableBody = document.querySelector('#inquiry-list-table tbody');
const uploadedFilesTableBody = document.querySelector('#uploaded-files-table tbody');
const fileUploadForm = document.getElementById('file-upload-form');

// Investor data (hardcoded for now)
const investorData = {
    'Venture Capital Firms': [{
        contact: 'Christian Hernandez, Partner',
        email: 'info@2150.vc',
        website: 'https://www.2150.vc',
        focus: 'Climate tech (environment and urban solutions)',
        relevance: 'Focuses on technologies that reimagine how cities are designed, constructed, and operated'
    }, {
        contact: 'Pauline Wink, Managing Partner',
        email: 'info@4impact.vc',
        website: 'https://www.4impact.vc',
        focus: 'Digital tech solutions driving positive social and environmental impact',
        relevance: 'Backs European tech4good companies tackling environmental challenges'
    }, {
        contact: 'Danijel Višević, General Partner',
        email: 'hello@worldfund.vc',
        website: 'https://www.worldfund.vc',
        focus: 'Energy, building materials, manufacturing',
        relevance: 'Backs entrepreneurs building climate tech that can save significant CO2e emissions'
    }, {
        contact: 'Investment Team',
        email: 'info@blumeequity.com',
        website: 'https://www.blumeequity.com',
        focus: 'Climate tech with proven traction',
        relevance: 'Backs European companies addressing climate and sustainability challenges'
    }, {
        contact: 'Peet Denny, Founding Partner',
        email: 'hello@climate.vc',
        website: 'https://www.climate.vc',
        focus: 'Climate tech startups with gigaton-level impact potential',
        relevance: 'Focuses on businesses that can reduce significant CO2e per year'
    }, {
        contact: 'Rokas Peciulaitis, Managing Partner',
        email: 'info@cventures.vc',
        website: 'https://www.cventures.vc',
        focus: 'Climate tech (excluding food and agri)',
        relevance: 'Invests in early-stage European climate tech startups'
    }, {
        contact: 'Investment Team',
        email: 'capital@systemiq.earth',
        website: 'https://www.systemiqcapital.com',
        focus: 'Circular economy, energy transition',
        relevance: 'Focuses on energy transition technologies'
    }, {
        contact: 'Investment Team',
        email: 'hello@aenu.com',
        website: 'https://www.aenu.com',
        focus: 'Climate tech and social impact startups',
        relevance: 'Invests in solutions addressing climate challenges'
    }, {
        contact: 'Max ter Horst, Managing Partner',
        email: 'energy@rockstart.com',
        website: 'https://www.rockstart.com/energy',
        focus: 'Energy transition and emerging tech',
        relevance: 'Specializes in energy transition technologies'
    }, {
        contact: 'Investment Team',
        email: 'hello@faber.vc',
        website: 'https://www.faber.vc',
        focus: 'Climate tech, digital transformation, sustainability',
        relevance: 'Invests in climate tech solutions with digital components'
    }],
    'Angel Investors and Syndicates': [{
        contact: 'Investment Team',
        email: 'climate@coreangels.com',
        website: 'https://www.coreangels.com/coreangelsclimate',
        focus: 'Climate innovation',
        relevance: 'Pan-European group of business angels focused on climate tech'
    }, {
        contact: 'Nick Lyth, Founder & CEO',
        email: 'enquiries@greenangelsyndicate.com',
        website: 'https://greenangelsyndicate.com',
        focus: 'Investments that reduce carbon emissions',
        relevance: 'UK\'s only angel syndicate specializing in the fight against climate change'
    }, {
        contact: 'Investment Team',
        email: 'info@greenangelventures.com',
        website: 'https://greenangelventures.com',
        focus: 'Emerging climate tech start-ups',
        relevance: 'Specializes in early-stage climate startups'
    }],
    'Corporate Venture Capital (CVC)': [{
        contact: 'Jordy Klaassen, Investment Manager',
        email: 'ventures@eneco.com',
        website: 'https://www.eneco.com/ventures',
        focus: 'Energy efficiency, sustainability solutions',
        relevance: 'Helps startups test propositions and scale through customer base'
    }, {
        contact: 'Frederico Gonçalves, Partner & Managing Director',
        email: 'edpventures@edp.com',
        website: 'https://www.edpventures.com',
        focus: 'Energy efficiency and sustainability solutions',
        relevance: 'Focuses on strategic collaborations and industry expertise'
    }, {
        contact: 'Kendra Rauschenberger, General Partner',
        email: 'ventures@siemens-energy.com',
        website: 'https://www.siemens-energy.com/ventures',
        focus: 'Energy technologies',
        relevance: 'Supports "hard tech" companies with technical expertise'
    }, {
        contact: 'Investment Team',
        email: 'ventures@abb.com',
        website: 'https://new.abb.com/about/technology/ventures',
        focus: 'Energy efficiency and industrial applications',
        relevance: 'Provides market credibility and expertise in scaling products'
    }, {
        contact: 'Investment Team',
        email: 'info@futureenergyventures.com',
        website: 'https://www.futureenergyventures.com',
        focus: 'Energy efficiency and sustainability solutions',
        relevance: 'Brings together corporate partners and startups'
    }],
    'Government Grants and Sustainable Funding Programs': [{
        contact: 'EIC Program Officers',
        email: 'EISMEA-EIC-ACCELERATOR-ENQUIRIES@ec.europa.eu',
        website: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
        focus: 'SMEs developing game-changing innovations',
        relevance: 'Supports sustainability and climate solutions'
    }, {
        contact: 'Program Officers',
        email: 'EC-HORIZON-EUROPE-HELPDESK@ec.europa.eu',
        website: 'https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
        focus: 'Research and innovation',
        relevance: 'Significant portion dedicated to climate action'
    }, {
        contact: 'LIFE Program Officers',
        email: 'LIFE@ec.europa.eu',
        website: 'https://cinea.ec.europa.eu/programmes/life_en',
        focus: 'Environment and climate action',
        relevance: 'Provides grants for innovative climate solutions'
    }, {
        contact: 'EIT Climate-KIC',
        email: 'info@climate-kic.org',
        website: 'https://eit.europa.eu/our-communities/eit-climate-kic',
        focus: 'Climate, energy, sustainability',
        relevance: 'Funding and acceleration for climate tech startups'
    }, {
        contact: 'Program Officers',
        email: 'vinnova@vinnova.se',
        website: 'https://www.vinnova.se/en/',
        focus: 'Innovation in Sweden',
        relevance: 'Country-specific grants for innovative climate solutions'
    }]
};

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

// Global scope functions for auth pages
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
                const isAdmin = email === 'ernst@hatake.eu';
                await setDoc(userProfileRef, {
                    email,
                    companyName,
                    roleInCompany,
                    linkedinProfile,
                    squareMeterInFactory: squareMeterInFactory || 'N/A',
                    isInvestor,
                    registeredAt: serverTimestamp(),
                    isAdmin
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

// Logic for portal.html
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
                 const toggleRegisterLink = document.getElementById('toggle-register-link');
                 if (toggleRegisterLink) toggleRegisterLink.addEventListener('click', () => window.toggleView('register'));
            }
        } else {
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            if (authView) authView.classList.remove('hidden');
            const toggleRegisterLink = document.getElementById('toggle-register-link');
            if (toggleRegisterLink) toggleRegisterLink.addEventListener('click', () => window.toggleView('register'));
        }
    });
}

// Logic for dashboard.html
function handleDashboardPage() {
    const userIsLoggedIn = localStorage.getItem('userLoggedIn') === 'true';

    if (!userIsLoggedIn) {
        window.location.href = 'portal.html';
        return;
    }

    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            const docRef = doc(db, `/artifacts/${appId}/users/${user.uid}/user_profiles`, 'profile');
            const unsubscribe = onSnapshot(docRef, async (docSnap) => {
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
                    
                    if (profile.isInvestor && investorResourcesSection) {
                        investorResourcesSection.classList.remove('hidden');
                        const filesCollectionRef = collection(db, `/artifacts/${appId}/public/investor_files`);
                        const filesSnapshot = await getDocs(filesCollectionRef);
                        if (investorFilesList) {
                            investorFilesList.innerHTML = '';
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
                        }
                    }
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
            window.addEventListener('beforeunload', () => unsubscribe());
        } else {
            window.location.href = 'portal.html';
        }
    });
}

// Logic for admin.html
function handleAdminPage() {
    const userIsLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userIsAdmin = localStorage.getItem('userIsAdmin') === 'true';

    if (!userIsLoggedIn || !userIsAdmin) {
        window.location.href = 'portal.html';
        return;
    }

    if (loadingSpinner) loadingSpinner.classList.remove('hidden');

    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            const userProfileRef = doc(db, `/artifacts/${appId}/users/${user.uid}/user_profiles`, 'profile');
            onSnapshot(userProfileRef, async (docSnap) => {
                if (docSnap.exists() && docSnap.data().isAdmin) {
                    const profile = docSnap.data();
                    if (adminNameSpan) adminNameSpan.textContent = profile.companyName;

                    const usersCollectionRef = collection(db, `/artifacts/${appId}/users`);
                    const usersSnapshot = await getDocs(usersCollectionRef);
                    let totalUsers = 0;
                    let totalCompanies = new Set();
                    if (userListTableBody) userListTableBody.innerHTML = '';

                    for (const userDoc of usersSnapshot.docs) {
                        const profileDocRef = doc(db, userDoc.ref.path, 'user_profiles/profile');
                        const profileDocSnap = await getDoc(profileDocRef);
                        if (profileDocSnap.exists()) {
                            const userProfile = profileDocSnap.data();
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${userProfile.companyName || 'N/A'}</td>
                                <td>${userProfile.email || 'N/A'}</td>
                                <td>${userProfile.roleInCompany || 'N/A'}</td>
                                <td>${userProfile.squareMeterInFactory || 'N/A'}</td>
                                <td>${userProfile.isInvestor ? 'Yes' : 'No'}</td>
                                <td>${userDoc.id}</td>
                            `;
                            userListTableBody.appendChild(tr);
                            totalUsers++;
                            totalCompanies.add(userProfile.companyName);
                        }
                    }

                    if (totalUsersElem) totalUsersElem.textContent = totalUsers;
                    if (registeredCompaniesElem) registeredCompaniesElem.textContent = totalCompanies.size;

                    if (investorListGrid) {
                        investorListGrid.innerHTML = '';
                        for (const category in investorData) {
                            const categoryTitle = document.createElement('h3');
                            categoryTitle.className = 'col-span-full text-lg font-bold mt-4 mb-2';
                            categoryTitle.textContent = category;
                            investorListGrid.appendChild(categoryTitle);
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

                    if (fileUploadForm) {
                         fileUploadForm.addEventListener('submit', async (e) => {
                             e.preventDefault();
                             const fileInput = document.getElementById('investor-file-upload');
                             const file = fileInput.files[0];
                             if (!file) {
                                 showMessage("Please select a file to upload.", true);
                                 return;
                             }
                             const storageRef = ref(storage, `investor_files/${file.name}`);
                             try {
                                 await uploadBytes(storageRef, file);
                                 const downloadURL = await getDownloadURL(storageRef);
                                 await addDoc(collection(db, `/artifacts/${appId}/public/investor_files`), {
                                     fileName: file.name,
                                     downloadURL: downloadURL,
                                     uploadedAt: serverTimestamp()
                                 });
                                 showMessage("File uploaded successfully!");
                                 fileInput.value = '';
                             } catch (error) {
                                 console.error("File upload failed:", error);
                                 showMessage(`File upload failed: ${error.message}`, true);
                             }
                         });
                    }

                    const filesCollectionRef = collection(db, `/artifacts/${appId}/public/investor_files`);
                    if(uploadedFilesTableBody) {
                      onSnapshot(filesCollectionRef, (snapshot) => {
                          uploadedFilesTableBody.innerHTML = '';
                          snapshot.forEach(doc => {
                              const fileData = doc.data();
                              const date = fileData.uploadedAt ? new Date(fileData.uploadedAt.seconds * 1000).toLocaleDateString() : 'N/A';
                              const tr = document.createElement('tr');
                              tr.innerHTML = `
                                  <td>${fileData.fileName}</td>
                                  <td>${date}</td>
                                  <td><a href="${fileData.downloadURL}" target="_blank" class="text-green-500 hover:underline">Download</a></td>
                              `;
                              uploadedFilesTableBody.appendChild(tr);
                          });
                      });
                    }

                    if (inquiryListTableBody) {
                        inquiryListTableBody.innerHTML = `
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
                        if (totalInquiriesElem) totalInquiriesElem.textContent = 2; // Placeholder
                    }
                    
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    if (adminDashboardSection) adminDashboardSection.classList.remove('hidden');

                } else {
                    window.location.href = 'dashboard.html';
                }
            }, (error) => {
                 console.error("Error fetching admin profile:", error);
                 window.location.href = 'dashboard.html';
            });
        } else {
            window.location.href = 'portal.html';
        }
    });

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
}
