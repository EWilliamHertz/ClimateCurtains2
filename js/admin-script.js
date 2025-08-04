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

// Email templates for Gemini AI (simulated)
const emailTemplates = {
    'Venture Capital Firms': {
        subject: 'ClimateCurtainsAB: Award-Winning Energy Efficiency Technology Seeking Investment Partnership',
        body: `Dear [Investor Name],

I hope this email finds you well. I am reaching out because [VC Firm Name]'s focus on [VC Focus] aligns perfectly with our mission at ClimateCurtainsAB.

Founded in 2015 in Vänersborg, Sweden, ClimateCurtainsAB has developed patented energy-saving window solutions that significantly reduce heat loss in buildings. Our technology has been rigorously tested in collaboration with Chalmers University and supported by the Swedish Energy Agency, proving to save at least 15% of heating energy in typical Swedish homes—with even greater savings in buildings with larger windows or in harsher climates.

Key highlights that may interest you:
•Award-winning innovation: Winner of the Energy Globe National Award 2018, one of the world's most prestigious sustainability awards
•Proven technology: Independent testing confirms our patented roller blinds deliver significant energy savings
•Large addressable market: 30-50% of heating costs are due to heat loss through windows, representing approximately 5000 kWh in an average house annually
•Versatile application: Our solutions work for residential, commercial, and even listed historic buildings without requiring structural modifications
•Strong IP protection: Patented technology creates barriers to entry and potential for strategic acquisitions

We are currently seeking [funding amount/stage] to scale our operations and expand our market reach. Given [VC Firm Name]'s impressive portfolio of companies addressing climate challenges, particularly [mention a relevant portfolio company if applicable], we believe there could be strong strategic alignment between our organizations.

Would you be available for a brief call next week to discuss how ClimateCurtainsAB might fit within your investment thesis? I'm happy to provide our pitch deck and additional materials in advance.

Thank you for your consideration. I look forward to the possibility of working together to create a more energy-efficient future.

Best regards,

Peter Hertz Founder & CEO ClimateCurtainsAB [Contact Information]`
    },
    'Angel Investors and Syndicates': {
        subject: 'Energy-Saving Innovation with Proven Results - ClimateCurtainsAB Investment Opportunity',
        body: `Dear [Angel Investor/Syndicate Name],

I hope this message finds you well. As a [syndicate/angel investor] focused on climate solutions, I wanted to introduce you to ClimateCurtainsAB, an award-winning Swedish company revolutionizing energy efficiency in buildings.

Since our founding in 2015, we've developed patented window solutions that address a critical but often overlooked source of energy waste: windows account for 30-50% of heating costs in residential buildings and even more in commercial structures with extensive glazing. Our technology has been proven through rigorous testing with Chalmers University to save at least 15% of heating energy in typical homes.

What makes our solution particularly compelling for investors like you who understand climate impact:
•Immediate market application: Our product is market-ready and already helping customers save energy and money
•Recognition for excellence: Winner of the Energy Globe National Award 2018 from among projects in 180+ countries
•Versatile use cases: Compatible with both modern and historic buildings, including listed properties where traditional energy retrofits are restricted
•Strong validation: Developed in collaboration with Chalmers University and supported by the Swedish Energy Agency
•Significant impact potential: Buildings are empty 60-75% of the time, creating enormous energy-saving opportunities through our technology

We're seeking angel investment of [amount] to accelerate our growth and expand our market reach. As someone committed to backing impactful climate solutions, your expertise and network would be invaluable to our journey.

Would you be interested in learning more about this opportunity? I'd be delighted to share our detailed business plan and discuss how you might participate in our next funding round.

Thank you for considering this opportunity to support innovation that delivers both environmental impact and financial returns.

Warm regards,

Peter Hertz Founder & CEO ClimateCurtainsAB [Contact Information]`
    },
    'Corporate Venture Capital (CVC)': {
        subject: 'Strategic Partnership Opportunity: ClimateCurtainsAB\'s Energy-Saving Window Technology',
        body: `Dear [CVC Contact Name],

I hope this email finds you well. I'm reaching out because I see significant potential for strategic alignment between [Parent Company Name]'s commitment to [energy efficiency/sustainability/relevant focus area] and ClimateCurtainsAB's innovative window solutions.

ClimateCurtainsAB is a Swedish company founded in 2015 that has developed patented roller blind technology proven to significantly reduce heat loss through windows—which accounts for 30-50% of heating costs in buildings. Our solutions have been rigorously tested in collaboration with Chalmers University and supported by the Swedish Energy Agency, demonstrating energy savings of at least 15% in typical homes.

I believe our technology could complement [Parent Company Name]'s portfolio and strategic objectives in several ways:
•Product integration opportunities: Our technology could enhance your existing [relevant product lines or services]
•Shared customer base: Our solutions address the same [customer segment] that your company serves
•Technical validation: Our award-winning innovation (Energy Globe National Award 2018) could strengthen your company's sustainability offerings
•Market expansion: Partnership could accelerate entry into new market segments for both organizations
•ESG impact: Measurable energy savings contribute to corporate sustainability goals and reporting

Beyond capital, we value the industry expertise, technical validation, and market access that a strategic investor like [Parent Company Name] could provide. Your experience in [relevant expertise area] would be particularly valuable as we scale our operations.

Would you be interested in scheduling a conversation to explore potential synergies between our organizations? I'm happy to provide additional technical information and business metrics in advance.

Thank you for your consideration. I look forward to the possibility of building a mutually beneficial relationship.

Best regards,

Peter Hertz Founder & CEO ClimateCurtainsAB [Contact Information]`
    },
    'Government Grants and Sustainable Funding Programs': {
        subject: 'ClimateCurtainsAB Grant Application: Proven Energy Efficiency Technology Aligned with [Program Name] Objectives',
        body: `Dear [Program Officer Name],

I am writing to express ClimateCurtainsAB's interest in the [specific grant program] and to inquire about the application process for the upcoming funding cycle.

ClimateCurtainsAB is a Swedish company founded in 2015 that has developed patented window solutions to significantly reduce building energy consumption. Our technology directly addresses the [specific policy goal, e.g., "energy efficiency targets" or "carbon reduction commitments"] outlined in your program priorities.

Our achievements and alignment with your funding objectives include:
•Proven impact: Independent testing with Chalmers University confirms our technology saves at least 15% of heating energy in typical Swedish homes
•Recognition: Winner of the Energy Globe National Award 2018, highlighting our contribution to global sustainability
•Research collaboration: Ongoing partnership with Chalmers University and support from the Swedish Energy Agency
•Market readiness: Technology is fully developed and being implemented in residential and commercial buildings
•Broad applicability: Solutions work for both new construction and retrofits, including historically significant buildings where traditional energy improvements are restricted

The funding from [Program Name] would enable us to [specific use of funds, e.g., "scale production," "enter new markets," or "further enhance our technology"]. This aligns perfectly with your program's goal to [reference specific program objectives].

Could you please provide information on:
1.The timeline for the next application cycle
2.Specific eligibility requirements for our type of technology
3.Any preliminary materials we should prepare

We are committed to advancing [relevant policy goals] through practical innovation and would welcome the opportunity to discuss how our work aligns with your funding priorities.

Thank you for your consideration. I look forward to your guidance on next steps.

Sincerely,

Peter Hertz Founder & CEO ClimateCurtainsAB [Contact Information]`
    }
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

                    // Fetch and display investor list from Firestore
                    const investorsCollectionRef = collection(db, `/artifacts/${appId}/investors`);
                    if (investorListGrid) {
                        investorListGrid.innerHTML = '';
                        let investorIndex = 1;
                        // Using onSnapshot for real-time updates on investor list
                        onSnapshot(investorsCollectionRef, (snapshot) => {
                            investorListGrid.innerHTML = '';
                            let index = 1;
                            snapshot.forEach(doc => {
                                const investor = doc.data();
                                const card = document.createElement('div');
                                card.className = 'investor-card relative';
                                card.innerHTML = `
                                    <div class="flex items-center">
                                        <p class="font-bold mr-2">${index}.</p>
                                        <h3 class="flex-1">${investor.contact.split(',')[0]}</h3>
                                        <input type="checkbox" class="form-checkbox h-5 w-5 text-green-600 rounded">
                                    </div>
                                    <p><strong>Contact:</strong> ${investor.contact}</p>
                                    <p><strong>Email:</strong> <a href="mailto:${investor.email}">${investor.email}</a></p>
                                    <p><strong>Website:</strong> <a href="${investor.website}" target="_blank">${investor.website}</a></p>
                                    <p><strong>Focus:</strong> ${investor.focus}</p>
                                    <p><strong>Relevance:</strong> ${investor.relevance}</p>
                                    <div class="mt-4">
                                        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm" onclick="openModal('${investor.category}', ${JSON.stringify(investor).replace(/"/g, "'")})">Draft Email</button>
                                    </div>
                                `;
                                investorListGrid.appendChild(card);
                                index++;
                            });
                        });
                    }

                    // Handle add investor form submission
                    if (addInvestorForm) {
                        addInvestorForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const newInvestor = {
                                contact: document.getElementById('investor-contact').value,
                                email: document.getElementById('investor-email').value,
                                website: document.getElementById('investor-website').value,
                                focus: document.getElementById('investor-focus').value,
                                relevance: document.getElementById('investor-relevance').value,
                                category: document.getElementById('investor-category').value
                            };

                            const investorsCollectionRef = collection(db, `/artifacts/${appId}/investors`);
                            await addDoc(investorsCollectionRef, newInvestor);
                            showMessage("Investor added successfully!");
                            addInvestorForm.reset();
                        });
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
                                 await addDoc(collection(db, `/artifacts/${appId}/investor_files`), {
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
                    const filesCollectionRef = collection(db, `/artifacts/${appId}/investor_files`);
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
