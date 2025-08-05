import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot, query, orderBy, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyB7_Tdz7SGtcj-qN8Ro7uAmoVrPyuR5cqc",
    authDomain: "climatecurtainsab.firebaseapp.com",
    projectId: "climatecurtainsab",
    storageBucket: "climatecurtainsab.appspot.com",
    messagingSenderId: "534408595576",
    appId: "1:534408595576:web:c73c886ab1ea1abd9e858d"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Global Admin State ---
let adminProfile = {};
let chatHistory = [];

// --- DOM Elements ---
const adminNameSpan = document.getElementById('admin-name');
const logoutButton = document.getElementById('logout-button');
const tabSiteManagement = document.getElementById('tab-site-management');
const tabInvestorOutreach = document.getElementById('tab-investor-outreach');
const contentSiteManagement = document.getElementById('content-site-management');
const contentInvestorOutreach = document.getElementById('content-investor-outreach');
const userListContainer = document.getElementById('user-list-container');
const inquiriesListContainer = document.getElementById('inquiries-list-container');
const fileUploadForm = document.getElementById('file-upload-form');
const fileInput = document.getElementById('file-input');
const uploadProgressContainer = document.getElementById('upload-progress-container');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadStatus = document.getElementById('upload-status');
const investorForm = document.getElementById('investor-form');
const investorListContainer = document.getElementById('investor-list-container');
const uploadedFilesContainer = document.getElementById('uploaded-files-container');
const editFileModal = document.getElementById('edit-file-modal');
const editFileForm = document.getElementById('edit-file-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const aiModal = document.getElementById('ai-modal');
const closeModalButton = document.getElementById('close-modal-button');
const modalChatWindow = document.getElementById('modal-chat-window');
const modalInputForm = document.getElementById('modal-input-form');
const modalUserInput = document.getElementById('modal-user-input');
const modalLoading = document.getElementById('modal-loading');

// --- Authentication & Initialization ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().isAdmin) {
            adminProfile = docSnap.data();
            adminNameSpan.textContent = `Welcome, ${adminProfile.companyName || 'Admin'}`;
            initializeAdminPanel();
        } else {
            await signOut(auth);
            window.location.replace('portal.html');
        }
    } else {
        window.location.replace('portal.html');
    }
});

function initializeAdminPanel() {
    setupTabs();
    listenForUsers();
    listenForInquiries();
    listenForInvestorFiles();
    fileUploadForm.addEventListener('submit', handleFileUpload);
    listenForInvestors();
    investorForm.addEventListener('submit', handleAddInvestor);
    logoutButton.addEventListener('click', () => signOut(auth));
    editFileForm.addEventListener('submit', handleSaveFileDetails);
    cancelEditBtn.addEventListener('click', () => editFileModal.classList.add('hidden'));
    uploadedFilesContainer.addEventListener('click', handleFileActions);
    closeModalButton.addEventListener('click', () => aiModal.classList.add('hidden'));
    modalInputForm.addEventListener('submit', handleAiChatSubmit);
}

// --- Tab Management ---
function setupTabs() {
    const tabs = [tabSiteManagement, tabInvestorOutreach];
    const contents = [contentSiteManagement, contentInvestorOutreach];
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.add('hidden'));
            tab.classList.add('active');
            contents[index].classList.remove('hidden');
        });
    });
}

// --- Site Management ---
function listenForUsers() {
    const q = query(collection(db, 'users'), orderBy('registeredAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        userListContainer.innerHTML = '';
        if (snapshot.empty) {
            userListContainer.innerHTML = '<p class="text-gray-500">No registered users found.</p>';
            return;
        }
        snapshot.forEach(docSnap => {
            const user = { id: docSnap.id, ...docSnap.data() };
            const userCard = document.createElement('div');
            userCard.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg';
            userCard.innerHTML = `
                <div>
                    <p class="font-semibold">${user.companyName || 'No Company Name'}</p>
                    <p class="text-sm text-gray-600">${user.email}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium">${user.isAdmin ? 'Admin' : 'User'}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" class="admin-toggle" data-id="${user.id}" ${user.isAdmin ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
            userListContainer.appendChild(userCard);
        });
    });
}

userListContainer.addEventListener('change', async (e) => {
    if (e.target.classList.contains('admin-toggle')) {
        const userId = e.target.dataset.id;
        const newAdminStatus = e.target.checked;
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { isAdmin: newAdminStatus });
        } catch (error) {
            console.error("Error updating admin status:", error);
            alert("Failed to update admin status.");
            e.target.checked = !newAdminStatus;
        }
    }
});

function listenForInquiries() {
    const q = query(collection(db, 'inquiries'), orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
        inquiriesListContainer.innerHTML = '';
        if (snapshot.empty) {
            inquiriesListContainer.innerHTML = '<p class="text-gray-500">No inquiries yet.</p>';
            return;
        }
        snapshot.forEach(docSnap => {
            const inquiry = docSnap.data();
            const date = inquiry.timestamp ? new Date(inquiry.timestamp.seconds * 1000).toLocaleString() : 'N/A';
            const inquiryCard = document.createElement('div');
            inquiryCard.className = 'border border-gray-200 p-4 rounded-lg';
            inquiryCard.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">${inquiry.subject}</h4>
                    <span class="text-xs text-gray-500">${date}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">From: ${inquiry.name} (${inquiry.email})</p>
                <p class="bg-gray-50 p-2 rounded text-sm">${inquiry.message.replace(/\n/g, '<br>')}</p>
            `;
            inquiriesListContainer.appendChild(inquiryCard);
        });
    });
}

function handleFileUpload(e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return;

    const storageRef = ref(storage, `investor-documents/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadProgressContainer.classList.remove('hidden');
            uploadProgressBar.style.width = progress + '%';
            uploadStatus.textContent = `Uploading... ${progress.toFixed(0)}%`;
        }, 
        (error) => {
            console.error("Upload failed:", error);
            uploadStatus.textContent = `Upload failed.`;
        }, 
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'investor_files'), {
                fileName: file.name,
                description: "",
                downloadURL: downloadURL,
                storagePath: uploadTask.snapshot.ref.fullPath,
                uploadedAt: serverTimestamp()
            });
            uploadStatus.textContent = `Upload complete!`;
            fileUploadForm.reset();
            setTimeout(() => { 
                uploadProgressContainer.classList.add('hidden'); 
                uploadStatus.textContent = '';
            }, 3000);
        }
    );
}

function listenForInvestorFiles() {
    const q = query(collection(db, 'investor_files'), orderBy('uploadedAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        uploadedFilesContainer.innerHTML = '';
        if (snapshot.empty) {
            uploadedFilesContainer.innerHTML = '<p class="text-gray-500 text-sm">No files uploaded yet.</p>';
            return;
        }
        snapshot.forEach(docSnap => {
            const file = { id: docSnap.id, ...docSnap.data() };
            const fileElement = document.createElement('div');
            fileElement.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg';
            fileElement.innerHTML = `
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm truncate">${file.fileName}</p>
                    <p class="text-xs text-gray-500 truncate">${file.description || "No description"}</p>
                </div>
                <div class="flex space-x-2 ml-4">
                    <button class="edit-file-btn text-blue-500 hover:text-blue-700" data-id="${file.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-file-btn text-red-500 hover:text-red-700" data-id="${file.id}" data-path="${file.storagePath}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            uploadedFilesContainer.appendChild(fileElement);
        });
    });
}

async function handleFileActions(e) {
    const button = e.target.closest('button');
    if (!button) return;

    const fileId = button.dataset.id;

    if (button.classList.contains('delete-file-btn')) {
        const storagePath = button.dataset.path;
        if (confirm('Are you sure you want to permanently delete this file?')) {
            try {
                const fileRef = ref(storage, storagePath);
                await deleteObject(fileRef);
                await deleteDoc(doc(db, 'investor_files', fileId));
            } catch (error) {
                console.error("Error deleting file:", error);
                alert("Could not delete file.");
            }
        }
    }

    if (button.classList.contains('edit-file-btn')) {
        const docRef = doc(db, 'investor_files', fileId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const fileData = docSnap.data();
            document.getElementById('edit-file-id').value = fileId;
            document.getElementById('edit-file-name').value = fileData.fileName;
            document.getElementById('edit-file-description').value = fileData.description || '';
            editFileModal.classList.remove('hidden');
        }
    }
}

async function handleSaveFileDetails(e) {
    e.preventDefault();
    const fileId = document.getElementById('edit-file-id').value;
    const newName = document.getElementById('edit-file-name').value;
    const newDescription = document.getElementById('edit-file-description').value;

    const docRef = doc(db, 'investor_files', fileId);
    try {
        await updateDoc(docRef, {
            fileName: newName,
            description: newDescription
        });
        editFileModal.classList.add('hidden');
    } catch (error) {
        console.error("Error updating file details:", error);
        alert("Failed to save changes.");
    }
}

// --- Investor Outreach ---
async function handleAddInvestor(e) {
    e.preventDefault();
    const formData = new FormData(investorForm);
    const investorData = Object.fromEntries(formData.entries());
    investorData.createdAt = serverTimestamp();
    investorData.contacted = false;
    
    try {
        await addDoc(collection(db, 'investor_prospects'), investorData);
        investorForm.reset();
    } catch (error) {
        console.error("Error adding investor:", error);
        alert("Failed to add investor.");
    }
}

function listenForInvestors() {
    const q = query(collection(db, 'investor_prospects'), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
        const investorsByCategory = {};
        snapshot.forEach(doc => {
            const investor = { id: doc.id, ...doc.data() };
            if (!investorsByCategory[investor.category]) {
                investorsByCategory[investor.category] = [];
            }
            investorsByCategory[investor.category].push(investor);
        });
        renderInvestorList(investorsByCategory);
    });
}

function renderInvestorList(investorsByCategory) {
    investorListContainer.innerHTML = '';
    for (const category in investorsByCategory) {
        const categoryWrapper = document.createElement('div');
        categoryWrapper.innerHTML = `<h3 class="text-xl font-bold text-gray-700 mb-4">${category}</h3>`;
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
        
        investorsByCategory[category].forEach(investor => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow-md flex flex-col';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="text-lg font-bold">${investor.firmName}</h4>
                    <div class="flex items-center space-x-2">
                         <label for="contacted-${investor.id}" class="text-sm">Contacted</label>
                         <input type="checkbox" id="contacted-${investor.id}" data-id="${investor.id}" class="contacted-toggle h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" ${investor.contacted ? 'checked' : ''}>
                    </div>
                </div>
                <p class="text-sm text-gray-600">${investor.contactName}</p>
                <a href="${investor.website}" target="_blank" class="text-blue-500 text-sm hover:underline">${investor.website}</a>
                <div class="mt-2 text-sm space-y-1">
                    <p><strong>Focus:</strong> ${investor.focus || 'N/A'}</p>
                    <p><strong>Relevance:</strong> ${investor.relevance || 'N/A'}</p>
                </div>
                <button data-investor='${JSON.stringify(investor)}' class="draft-email-btn mt-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg w-full mt-4">Draft Email with AI</button>
            `;
            grid.appendChild(card);
        });
        
        categoryWrapper.appendChild(grid);
        investorListContainer.appendChild(categoryWrapper);
    }
}

investorListContainer.addEventListener('change', async (e) => {
    if (e.target.classList.contains('contacted-toggle')) {
        const investorId = e.target.dataset.id;
        const isContacted = e.target.checked;
        try {
            const investorRef = doc(db, 'investor_prospects', investorId);
            await updateDoc(investorRef, { contacted: isContacted });
        } catch (error) {
            console.error("Error updating contacted status:", error);
            e.target.checked = !isContacted;
        }
    }
});

// --- ============================ ---
// ---       AI EMAIL DRAFTER     ---
// --- ============================ ---
// This section remains the same as before...
investorListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('draft-email-btn')) {
        const investorData = JSON.parse(e.target.dataset.investor);
        openAiModal(investorData);
    }
});
// (The functions openAiModal, handleAiChatSubmit, callGeminiAPI, addMessageToChat, and emailTemplates are unchanged and omitted for brevity)
const emailTemplates = {
    "Venture Capital Firms": `Subject: ClimateCurtainsAB: Award-Winning Energy Efficiency Technology Seeking Investment Partnership\n\nDear [Investor Name],\n\nI hope this email finds you well. I am reaching out because [Investor Firm Name]'s focus on [Investor Focus] aligns perfectly with our mission at ClimateCurtainsAB.\n\nFounded in 2015 in Vänersborg, Sweden, ClimateCurtainsAB has developed patented energy-saving window solutions that significantly reduce heat loss in buildings. Our technology has been rigorously tested in collaboration with Chalmers University and supported by the Swedish Energy Agency, proving to save at least 15% of heating energy in typical Swedish homes—with even greater savings in buildings with larger windows or in harsher climates.\n\nKey highlights that may interest you:\n• Award-winning innovation: Winner of the Energy Globe National Award 2018, one of the world's most prestigious sustainability awards\n• Proven technology: Independent testing confirms our patented roller blinds deliver significant energy savings\n• Large addressable market: 30-50% of heating costs are due to heat loss through windows, representing approximately 5000 kWh in an average house annually\n• Versatile application: Our solutions work for residential, commercial, and even listed historic buildings without requiring structural modifications\n• Strong IP protection: Patented technology creates barriers to entry and potential for strategic acquisitions\n\nWe are currently seeking [funding amount/stage] to scale our operations and expand our market reach. Given [Investor Firm Name]'s impressive portfolio of companies addressing climate challenges, particularly [mention a relevant portfolio company if applicable], we believe there could be strong strategic alignment between our organizations.\n\nWould you be available for a brief call next week to discuss how ClimateCurtainsAB might fit within your investment thesis? I'm happy to provide our pitch deck and additional materials in advance.\n\nThank you for your consideration. I look forward to the possibility of working together to create a more energy-efficient future.\n\nBest regards,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB\n[Contact Information]`,
    "Angel Investors and Syndicates": `Subject: Energy-Saving Innovation with Proven Results - ClimateCurtainsAB Investment Opportunity\n\nDear [Investor Name],\n\nI hope this message finds you well. As a [syndicate/angel investor] focused on climate solutions, I wanted to introduce you to ClimateCurtainsAB, an award-winning Swedish company revolutionizing energy efficiency in buildings.\n\nSince our founding in 2015, we've developed patented window solutions that address a critical but often overlooked source of energy waste: windows account for 30-50% of heating costs in residential buildings and even more in commercial structures with extensive glazing. Our technology has been proven through rigorous testing with Chalmers University to save at least 15% of heating energy in typical homes.\n\nWhat makes our solution particularly compelling for investors like you who understand climate impact:\n• Immediate market application: Our product is market-ready and already helping customers save energy and money\n• Recognition for excellence: Winner of the Energy Globe National Award 2018 from among projects in 180+ countries\n• Versatile use cases: Compatible with both modern and historic buildings, including listed properties where traditional energy retrofits are restricted\n• Strong validation: Developed in collaboration with Chalmers University and supported by the Swedish Energy Agency\n• Significant impact potential: Buildings are empty 60-75% of the time, creating enormous energy-saving opportunities through our technology\n\nWe're seeking angel investment of [amount] to accelerate our growth and expand our market reach. As someone committed to backing impactful climate solutions, your expertise and network would be invaluable to our journey.\n\nWould you be interested in learning more about this opportunity? I'd be delighted to share our detailed business plan and discuss how you might participate in our next funding round.\n\nThank you for considering this opportunity to support innovation that delivers both environmental impact and financial returns.\n\nWarm regards,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB\n[Contact Information]`,
    "Corporate Venture Capital (CVC)": `Subject: Strategic Partnership Opportunity: ClimateCurtainsAB's Energy-Saving Window Technology\n\nDear [Investor Name],\n\nI hope this email finds you well. I'm reaching out because I see significant potential for strategic alignment between [Investor Firm Name]'s commitment to [energy efficiency/sustainability/relevant focus area] and ClimateCurtainsAB's innovative window solutions.\n\nClimateCurtainsAB is a Swedish company founded in 2015 that has developed patented roller blind technology proven to significantly reduce heat loss through windows—which accounts for 30-50% of heating costs in buildings. Our solutions have been rigorously tested in collaboration with Chalmers University and supported by the Swedish Energy Agency, demonstrating energy savings of at least 15% in typical homes.\n\nI believe our technology could complement [Investor Firm Name]'s portfolio and strategic objectives in several ways:\n• Product integration opportunities: Our technology could enhance your existing [relevant product lines or services]\n• Shared customer base: Our solutions address the same [customer segment] that your company serves\n• Technical validation: Our award-winning innovation (Energy Globe National Award 2018) could strengthen your company's sustainability offerings\n• Market expansion: Partnership could accelerate entry into new market segments for both organizations\n• ESG impact: Measurable energy savings contribute to corporate sustainability goals and reporting\n\nBeyond capital, we value the industry expertise, technical validation, and market access that a strategic investor like [Investor Firm Name] could provide. Your experience in [relevant expertise area] would be particularly valuable as we scale our operations.\n\nWould you be interested in scheduling a conversation to explore potential synergies between our organizations? I'm happy to provide additional technical information and business metrics in advance.\n\nThank you for your consideration. I look forward to the possibility of building a mutually beneficial relationship.\n\nBest regards,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB\n[Contact Information]`,
    "Government Grants and Sustainable Funding Programs": `Subject: ClimateCurtainsAB Grant Application: Proven Energy Efficiency Technology Aligned with [Program Name] Objectives\n\nDear [Investor Name],\n\nI am writing to express ClimateCurtainsAB's interest in the [specific grant program] and to inquire about the application process for the upcoming funding cycle.\n\nClimateCurtainsAB is a Swedish company founded in 2015 that has developed patented window solutions to significantly reduce building energy consumption. Our technology directly addresses the [specific policy goal, e.g., \"energy efficiency targets\" or \"carbon reduction commitments\"] outlined in your program priorities.\n\nOur achievements and alignment with your funding objectives include:\n• Proven impact: Independent testing with Chalmers University confirms our technology saves at least 15% of heating energy in typical Swedish homes\n• Recognition: Winner of the Energy Globe National Award 2018, highlighting our contribution to global sustainability\n• Research collaboration: Ongoing partnership with Chalmers University and support from the Swedish Energy Agency\n• Market readiness: Technology is fully developed and being implemented in residential and commercial buildings\n• Broad applicability: Solutions work for both new construction and retrofits, including historically significant buildings where traditional energy improvements are restricted\n\nThe funding from [Program Name] would enable us to [specific use of funds, e.g., \"scale production,\" \"enter new markets,\" or \"further enhance our technology\"]. This aligns perfectly with your program's goal to [reference specific program objectives].\n\nCould you please provide information on:\n1. The timeline for the next application cycle\n2. Specific eligibility requirements for our type of technology\n3. Any preliminary materials we should prepare\n\nWe are committed to advancing [relevant policy goals] through practical innovation and would welcome the opportunity to discuss how our work aligns with your funding priorities.\n\nThank you for your consideration. I look forward to your guidance on next steps.\n\nSincerely,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB\n[Contact Information]`
};

function openAiModal(investor) {
    modalChatWindow.innerHTML = '';
    chatHistory = [];
    aiModal.classList.remove('hidden');

    let template = emailTemplates[investor.category] || "Please write a professional outreach email.";
    
    // Replace all placeholders in the template
    template = template.replace(/\[Investor Name\]/g, investor.contactName)
                       .replace(/\[VC Firm Name\]|\[Angel Investor\/Syndicate Name\]|\[Parent Company Name\]|\[Program Name\]/g, investor.firmName)
                       .replace(/\[specific focus area, e.g., "climate tech solutions" or "sustainable urban environments"\]/g, investor.focus)
                       .replace(/\[Admin Name\]/g, adminProfile.companyName) // Using company name as admin name
                       .replace(/\[Admin Role\]/g, adminProfile.roleInCompany)
                       .replace(/\[Contact Information\]/g, adminProfile.email); // Assuming admin has email in profile

    const initialPrompt = `You are an expert investment outreach assistant for a company called ClimateCurtainsAB.
Your task is to help me, ${adminProfile.companyName}, the ${adminProfile.roleInCompany} of ClimateCurtainsAB, draft a compelling email to ${investor.contactName} of ${investor.firmName}.

First, research their website: ${investor.website}.
Based on your research, rewrite the following email draft to be highly personalized and persuasive. Tailor it to their specific investment thesis, mention relevant portfolio companies if you find any, and clearly explain why ClimateCurtainsAB is a strong strategic fit for them. Make the email concise and impactful.

Here is the base template to improve:
---
${template}
---
Please provide only the rewritten, complete email as your response.`;

    addMessageToChat('ai', `Hello ${adminProfile.companyName}! I'm drafting a personalized email to ${investor.contactName}. I will research their website and tailor the message. Please wait a moment...`);
    
    callGeminiAPI(initialPrompt, true);
}

async function handleAiChatSubmit(e) {
    e.preventDefault();
    const userInput = modalUserInput.value.trim();
    if (!userInput) return;
    
    addMessageToChat('user', userInput);
    modalUserInput.value = '';
    
    await callGeminiAPI(userInput);
}

async function callGeminiAPI(prompt, isInitial = false) {
    modalLoading.classList.remove('hidden');
    
    const apiKey = "AIzaSyBQeLMNbrjf8RPO01wipxS0JrWNyTv9az0";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    if (isInitial) {
        // For the first turn, we only send the initial, detailed prompt
        chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    } else {
        // For subsequent turns, we add the user's new message
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error Body:", errorBody);
            throw new Error(`API Error: ${response.statusText} - ${errorBody.error.message}`);
        }

        const result = await response.json();
        const aiResponse = result.candidates[0].content.parts[0].text;
        
        // Add the AI's response to the history for context in the next turn
        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        addMessageToChat('ai', aiResponse);

    } catch (error) {
        console.error("Gemini API Error:", error);
        addMessageToChat('ai', `Sorry, I encountered an error: ${error.message}`);
    } finally {
        modalLoading.classList.add('hidden');
    }
}

function addMessageToChat(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `p-3 rounded-lg max-w-[80%] w-fit ${sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'}`;
    // Basic markdown to HTML conversion
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    text = text.replace(/\n/g, '<br>'); // Newlines
    messageElement.innerHTML = text;
    modalChatWindow.appendChild(messageElement);
    modalChatWindow.scrollTop = modalChatWindow.scrollHeight;
}
