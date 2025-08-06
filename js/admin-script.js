// --- Correct, full URL imports for browser compatibility ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot, query, orderBy, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// --- Firebase Configuration Provided by You ---
// Note: I've corrected the storageBucket to the standard '.appspot.com' format for SDK compatibility.
const firebaseConfig = {
    apiKey: "AIzaSyB7_Tdz7SGtcj-qN8Ro7uAmoVrPyuR5cqc",
    authDomain: "climatecurtainsab.firebaseapp.com",
    projectId: "climatecurtainsab",
    storageBucket: "climatecurtainsab.appspot.com", // Corrected for SDK
    messagingSenderId: "534408595576",
    appId: "1:534408595576:web:c73c886ab1ea1abd9e858d",
    measurementId: "G-3GNNYNJKM7"
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
            // If user is not an admin, sign them out and redirect
            await signOut(auth);
            window.location.replace('portal.html');
        }
    } else {
        // If no user is logged in, redirect
        window.location.replace('portal.html');
    }
});

function initializeAdminPanel() {
    setupTabs();
    listenForUsers();
    listenForInquiries();
    listenForInvestorFiles();
    listenForInvestors();
    
    // Attach all event listeners
    fileUploadForm.addEventListener('submit', handleFileUpload);
    investorForm.addEventListener('submit', handleAddInvestor);
    logoutButton.addEventListener('click', () => signOut(auth));
    editFileForm.addEventListener('submit', handleSaveFileDetails);
    cancelEditBtn.addEventListener('click', () => editFileModal.classList.add('hidden'));
    uploadedFilesContainer.addEventListener('click', handleFileActions);
    userListContainer.addEventListener('change', handleAdminToggle);
    investorListContainer.addEventListener('change', handleContactedToggle);
    investorListContainer.addEventListener('click', handleDraftEmailClick);
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

// --- ============================ ---
// ---      SITE MANAGEMENT       ---
// --- ============================ ---

// --- User Management ---
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

async function handleAdminToggle(e) {
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
}

// --- Contact Inquiries ---
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

// --- File Upload & Management ---
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
            uploadStatus.textContent = `Upload failed. Check console and storage rules. Error: ${error.code}`;
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

// --- ============================ ---
// ---    INVESTOR OUTREACH       ---
// --- ============================ ---

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
        categoryWrapper.innerHTML = `<h3 class="text-xl font-bold text-gray-700 mb-4 mt-6">${category}</h3>`;
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

async function handleContactedToggle(e) {
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
}

// --- ============================ ---
// ---       AI EMAIL DRAFTER     ---
// --- ============================ ---

function handleDraftEmailClick(e) {
    if (e.target.classList.contains('draft-email-btn')) {
        const investorData = JSON.parse(e.target.dataset.investor);
        openAiModal(investorData);
    }
}

function openAiModal(investor) {
    modalChatWindow.innerHTML = '';
    chatHistory = []; // Reset history for each new draft
    aiModal.classList.remove('hidden');

    const initialPrompt = `
        You are an expert investment outreach assistant for ClimateCurtainsAB, a Swedish company with a patented, award-winning industrial thermal curtain that saves significant energy.
        Your task is to draft a compelling, professional, and personalized outreach email to a potential investor.

        **Company Information:**
        - **Product:** Patented thermal curtains (ClimateCurtain®) for industrial buildings.
        - **Key Benefits:** Reduces energy costs, non-invasive installation, proven 18-month ROI.
        - **Achievements:** Winner of the Energy Globe Award for Sweden; key technology in the "Zero Island" project which cut CO2 by 78%.
        - **Goal:** Seeking USD 5-8 million in Series A funding for expansion into Asian markets.

        **Investor Information:**
        - **Contact Name:** ${investor.contactName}
        - **Firm Name:** ${investor.firmName}
        - **Firm's Focus:** ${investor.focus || 'Not specified'}
        - **Relevance:** ${investor.relevance || 'Not specified'}

        **Your Task:**
        1.  Start by generating an initial draft of the email.
        2.  The tone should be professional, confident, and concise.
        3.  Personalize the email by referencing the investor's firm and focus area.
        4.  Clearly state the investment opportunity and the call to action (e.g., a brief meeting).
        5.  Sign off as Peter Hertz, CEO of ClimateCurtainsAB.
        6.  After providing the draft, ask me for feedback or what I'd like to change.
    `;
    
    addMessageToChat('ai', `Hello! I'm preparing a draft email for ${investor.contactName} at ${investor.firmName}. Please give me a moment...`);
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
    // IMPORTANT: Replace with your actual Gemini API Key
    const apiKey = "YOUR_GEMINI_API_KEY"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    if (isInitial) {
        chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    } else {
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
            throw new Error(`API Error: ${response.statusText} - ${errorBody.error.message}`);
        }

        const result = await response.json();
        const aiResponse = result.candidates[0].content.parts[0].text;
        
        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        addMessageToChat('ai', aiResponse);

    } catch (error) {
        console.error("Gemini API Error:", error);
        addMessageToChat('ai', `Sorry, an error occurred: ${error.message}. Please ensure your API key is correct.`);
    } finally {
        modalLoading.classList.add('hidden');
    }
}

function addMessageToChat(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `p-3 rounded-lg max-w-[80%] w-fit text-left ${sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'}`;
    // Basic markdown-to-HTML conversion
    text = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italics
        .replace(/\n/g, '<br>');                      // Newlines
    messageElement.innerHTML = text;
    modalChatWindow.appendChild(messageElement);
    modalChatWindow.scrollTop = modalChatWindow.scrollHeight;
}
