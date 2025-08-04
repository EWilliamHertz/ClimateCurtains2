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

// --- Gemini API Configuration ---
const GEMINI_API_KEY = "AIzaSyBQeLMNbrjf8RPO01wipxS0JrWNyTv9az0";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

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
const storage = getStorage(app);

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
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const chatSendButton = document.getElementById('chat-send-button');

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

const emailTemplates = {
    'Venture Capital Firms': {
        subject: "Investment Opportunity: ClimateCurtainsAB - Revolutionizing Industrial Energy Efficiency",
        body: `Dear [Investor Name],

I am writing to you from ClimateCurtainsAB, a Swedish company at the forefront of industrial energy efficiency. We have developed a patented thermal curtain technology that delivers significant energy and cost savings to large-scale industrial clients.

Given [VC Firm Name]'s focus on [VC Focus], we believe our solution aligns perfectly with your investment thesis. Our technology has a proven track record, a strong ROI for clients, and a massive addressable market.

We are currently seeking investment to scale our production and expand our market reach. We would be delighted to share our investor deck and financial model with you.

Would you be available for a brief call next week to discuss this further?

Best regards,

Peter Hertz
CEO, ClimateCurtainsAB`
    },
    'Angel Investors and Syndicates': {
        subject: "Angel Investment Opportunity: ClimateCurtainsAB - Sustainable Impact & Strong Returns",
        body: `Dear [Investor Name],

I am Peter Hertz, the founder of ClimateCurtainsAB. We are on a mission to combat industrial energy waste with our innovative thermal curtain technology. Our solution not only saves our clients money but also makes a tangible impact on CO2 emissions.

As a [syndicate/angel investor] with a focus on sustainable technology, we believe our venture presents a compelling opportunity. We have a solid business model, a patented product, and are poised for significant growth.

We are looking for angel investors who share our vision and want to be part of a company with both strong financial returns and a positive environmental impact.

I would welcome the opportunity to discuss our plans with you. Please let me know if you would be open to a brief conversation.

Sincerely,

Peter Hertz
CEO, ClimateCurtainsAB`
    },
    'Corporate Venture Capital (CVC)': {
        subject: "Strategic Partnership & Investment: ClimateCurtainsAB & [VC Firm Name]",
        body: `Dear [Investor Name],

I am writing to you from ClimateCurtainsAB to explore a potential strategic partnership and investment opportunity with [VC Firm Name]. Our patented industrial thermal curtains offer a unique solution to reduce energy consumption in large facilities, a challenge that is highly relevant to your industry.

We see a strong synergy between our technology and your company's sustainability goals. A partnership could provide us with invaluable market access and industry expertise, while our solution could enhance your operational efficiency and sustainability credentials.

We are confident that our technology can deliver significant value to your business and would be eager to discuss a pilot project or a strategic investment.

I look forward to hearing from you.

Best regards,

Peter Hertz
CEO, ClimateCurtainsAB`
    },
    'Government Grants and Sustainable Funding Programs': {
        subject: "Application for [specific grant program]: ClimateCurtainsAB - Innovative Energy-Saving Technology",
        body: `Dear Sir/Madam,

On behalf of ClimateCurtainsAB, I am writing to express our strong interest in the [specific grant program]. As a Swedish company dedicated to climate solutions, our mission aligns perfectly with the goals of this program.

Our patented industrial thermal curtains are a game-changing innovation that addresses the urgent need for energy efficiency in the industrial sector. Our technology helps businesses significantly reduce their energy consumption and CO2 footprint, contributing directly to [specific policy goal, e.g., "energy efficiency targets" or "carbon reduction commitments"].

We have a scalable business model and a clear plan for market expansion. Funding from this program would be instrumental in accelerating our growth and maximizing our environmental impact.

We have attached our full proposal for your review and would be honored to be considered for this grant.

Thank you for your time and consideration.

Sincerely,

Peter Hertz
CEO, ClimateCurtainsAB`
    }
};

// --- Gemini Chat Functions ---
async function handleChatSubmit() {
    const userInput = chatInput.value.trim();
    if (!userInput) return;

    appendMessage(userInput, 'user');
    chatInput.value = '';
    chatSendButton.disabled = true;

    const thinkingBubble = appendMessage("Thinking...", 'ai', true);

    const currentEmail = emailDraftBody.value;
    const prompt = `You are an expert business communication assistant. Your task is to refine an email draft based on user instructions.
    
    Current Email Draft:
    ---
    ${currentEmail}
    ---
    
    User's instruction: "${userInput}"
    
    Based on the instruction, please provide a revised version of the email. Only output the full, revised email text, without any additional comments or explanations.`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }),
        });

        chatHistory.removeChild(thinkingBubble);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const revisedEmail = data.candidates[0].content.parts[0].text;
            emailDraftBody.value = revisedEmail;
            appendMessage("I've updated the email draft for you based on your instructions. How does it look?", 'ai');
        } else {
            throw new Error("No response from AI. The content may have been blocked.");
        }

    } catch (error) {
        console.error('Error with Gemini API:', error);
        if (thinkingBubble.parentNode) {
            chatHistory.removeChild(thinkingBubble);
        }
        appendMessage(`Sorry, an error occurred: ${error.message}. Please check your API key and network, then try again.`, 'ai');
    } finally {
        chatSendButton.disabled = false;
        chatInput.focus();
    }
}

function appendMessage(text, sender, isThinking = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    if (isThinking) {
        messageElement.classList.add('thinking');
    }
    
    const bubbleElement = document.createElement('div');
    bubbleElement.classList.add('message-bubble');
    bubbleElement.textContent = text;
    
    messageElement.appendChild(bubbleElement);
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageElement;
}


// --- Core Admin Functions ---

function openModal(category, investor) {
    const template = emailTemplates[category];
    if (!template) {
        showMessage("No template found for this investor category.", true);
        return;
    }
    
    const recipientName = investor.contact.split(',')[0].trim();
    const companyName = category.includes('Venture Capital') ? category : investor.contact.split(',')[1] ? investor.contact.split(',')[1].trim() : category;
    
    const subject = template.subject.replace(/\[VC Firm Name\]/g, companyName).replace(/\[Investor Name\]/g, recipientName);
    const body = template.body.replace(/\[Investor Name\]/g, recipientName)
                             .replace(/\[VC Firm Name\]/g, companyName)
                             .replace(/\[VC Focus\]/g, investor.focus)
                             .replace(/\[syndicate\/angel investor\]/g, category.includes('Syndicates') ? 'syndicate' : 'angel investor')
                             .replace(/\[specific grant program\]/g, 'EIC Accelerator')
                             .replace(/\[specific policy goal, e.g., "energy efficiency targets" or "carbon reduction commitments"\]/g, 'energy efficiency targets');

    investorNameModal.textContent = recipientName;
    emailDraftBody.value = body;
    sendEmailLink.href = `mailto:${investor.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Reset chat history
    chatHistory.innerHTML = `
        <div class="chat-message ai">
            <div class="message-bubble">Hello! I can help you tailor this email to ${recipientName}. What would you like to change or add?</div>
        </div>`;
    
    emailModal.style.display = "block";
}
window.openModal = openModal;

function closeModal() {
    emailModal.style.display = "none";
}
window.closeModal = closeModal;

function showMessage(msg, isError = false) {
    if (!messageBox) return;
    messageBox.textContent = msg;
    messageBox.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
    messageBox.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

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

async function fetchInquiries() {
    try {
        const inquiriesCollectionRef = collection(db, 'inquiries');
        const inquiriesSnapshot = await getDocs(inquiriesCollectionRef);
        if (inquiryListTableBody) inquiryListTableBody.innerHTML = '';
        let inquiryCount = 0;
        inquiriesSnapshot.forEach(inquiryDoc => {
            const inquiryData = inquiryDoc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${inquiryData.timestamp ? new Date(inquiryData.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                <td>${inquiryData.company || inquiryData.name || 'N/A'}</td>
                <td>${inquiryData.subject || 'N/A'}</td>
                <td>${inquiryData.status || 'New'}</td>
                <td><a href="#">View</a></td>
            `;
            inquiryListTableBody.appendChild(tr);
            inquiryCount++;
        });
        if (totalInquiriesElem) totalInquiriesElem.textContent = inquiryCount;
    } catch (error) {
        console.error("Error fetching inquiries:", error);
    }
}

async function fetchUsers() {
    try {
        const usersCollectionRef = collection(db, `users`);
        const usersSnapshot = await getDocs(usersCollectionRef);
        let totalUsers = 0;
        const companyNames = new Set();
        if (userListTableBody) userListTableBody.innerHTML = '';
        
        for (const userDoc of usersSnapshot.docs) {
            const userProfile = userDoc.data();
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
            if (userProfile.companyName) {
                companyNames.add(userProfile.companyName);
            }
        }
        
        if (totalUsersElem) totalUsersElem.textContent = totalUsers;
        if (registeredCompaniesElem) registeredCompaniesElem.textContent = companyNames.size;
    } catch (error) {
        console.error("Error fetching users:", error);
        if (totalUsersElem) totalUsersElem.textContent = 'Error';
        if (registeredCompaniesElem) registeredCompaniesElem.textContent = 'Error';
    }
}

async function handleAdminPage() {
    onAuthStateChanged(auth, async (user) => {
        if (user && !user.isAnonymous) {
            const userProfileRef = doc(db, `users`, user.uid);
            try {
                const docSnap = await getDoc(userProfileRef);
                if (docSnap.exists() && docSnap.data().isAdmin) {
                    // User is an admin, show the dashboard.
                    loadingSpinner.classList.add('hidden');
                    adminDashboardSection.classList.remove('hidden');

                    const profile = docSnap.data();
                    if (adminNameSpan) adminNameSpan.textContent = profile.companyName;

                    await fetchUsers();
                    await fetchInquiries();

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
                                    <button onclick="openModal('${category}', ${JSON.stringify(investor).replace(/"/g, "'")})" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-2">Draft Email</button>
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
                                 await addDoc(collection(db, `public/investor_files`), {
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

                    const filesCollectionRef = collection(db, `public/investor_files`);
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

                } else {
                     // User is logged in, but not an admin. Redirect to user dashboard.
                    showMessage("Access Denied. You are not an administrator.", true);
                    if (!window.location.pathname.includes('dashboard.html')) {
                        setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
                    }
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
                 // If there's an error (e.g., profile not found), sign out and redirect
                await signOut(auth);
                if (!window.location.pathname.includes('portal.html')) {
                    window.location.href = 'portal.html';
                }
            }
        } else {
            // No user is signed in, redirect to the portal.
            if (!window.location.pathname.includes('portal.html')) {
                window.location.href = 'portal.html';
            }
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // The onAuthStateChanged listener will handle the redirect.
            } catch (error) {
                console.error("Logout failed:", error);
                showMessage(`Logout failed: ${error.message}`, true);
            }
        });
    }

    if (chatSendButton) {
        chatSendButton.addEventListener('click', handleChatSubmit);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatSubmit();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    handleAdminPage();
});
