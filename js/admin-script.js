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
    getDocs,
    addDoc,
    serverTimestamp,
    getDoc
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';

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
const storage = getStorage(app);
const appId = firebaseConfig.projectId;

// DOM elements
const messageBox = document.getElementById('message-box');
const loadingSpinner = document.getElementById('loading');
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
const logoutButton = document.getElementById('logout-button');
const emailModal = document.getElementById('email-modal');
const investorNameModal = document.getElementById('investor-name-modal');
const emailDraftBody = document.getElementById('email-draft-body');
const sendEmailLink = document.getElementById('send-email-link');
const addInvestorForm = document.getElementById('add-investor-form');

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

let currentInvestor = null;

// Function to open the email drafting modal
function openModal(category, investor) {
    const template = emailTemplates[category];
    if (!template) {
        showMessage("No template found for this investor category.", true);
        return;
    }
    
    // Dynamic content for the email draft
    const recipientName = investor.contact.split(',')[0].trim();
    const companyName = category.includes('Venture Capital') ? category : investor.contact.split(',')[1] ? investor.contact.split(',')[1].trim() : category;
    
    const subject = template.subject.replace(/\[VC Firm Name\]/g, companyName).replace(/\[Investor Name\]/g, recipientName);
    const body = template.body.replace(/\[Investor Name\]/g, recipientName)
                             .replace(/\[VC Firm Name\]/g, companyName)
                             .replace(/\[VC Focus\]/g, investor.focus)
                             .replace(/\[syndicate\/angel investor\]/g, category.includes('Syndicates') ? 'syndicate' : 'angel investor')
                             .replace(/\[specific grant program\]/g, 'EIC Accelerator')
                             .replace(/\[specific policy goal, e.g., "energy efficiency targets" or "carbon reduction commitments"\]/g, 'energy efficiency targets');

    // Populate the modal
    investorNameModal.textContent = recipientName;
    emailDraftBody.value = body;
    sendEmailLink.href = `mailto:${investor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    emailModal.style.display = "block";
}
window.openModal = openModal;

// Function to close the modal
function closeModal() {
    emailModal.style.display = "none";
}
window.closeModal = closeModal;

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

// Tab switching logic
window.switchTab = (tabName) => {
    const tabs = document.querySelectorAll('.tabs button');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`#tab-button-${tabName}`).classList.add('active');

    document.getElementById('users-tab-content').classList.add('hidden');
    document.getElementById('investors-tab-content').classList.add('hidden');
    document.getElementById('inquiries-tab-content').classList.add('hidden');
    document.getElementById('files-tab-content').classList.add('hidden');
    document.getElementById(`${tabName}-tab-content`).classList.remove('hidden');
};

async function handleAdminPage() {
    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            const userProfileRef = doc(db, `/artifacts/${appId}/users/${user.uid}/user_profiles`, 'profile');
            onSnapshot(userProfileRef, async (docSnap) => {
                if (docSnap.exists() && docSnap.data().isAdmin) {
                    const profile = docSnap.data();
                    if (adminNameSpan) adminNameSpan.textContent = profile.companyName;

                    // Fetch and display all users
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
                                <td>${userProfile.firstName || 'N/A'}</td>
                                <td>${userProfile.lastName || 'N/A'}</td>
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

                    // Populate investor list
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

                    // Handle file upload
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

                    // Fetch and display uploaded files
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

                    // Dummy inquiry data for now
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
            });
        } else {
            window.location.href = 'portal.html';
        }
    });

    // Logout functionality for admin page
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

document.addEventListener('DOMContentLoaded', () => {
    handleAdminPage();
});
