import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

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
const investorForm = document.getElementById('investor-form');
const investorListContainer = document.getElementById('investor-list-container');
const aiModal = document.getElementById('ai-modal');
const closeModalButton = document.getElementById('close-modal-button');
const modalChatWindow = document.getElementById('modal-chat-window');
const modalInputForm = document.getElementById('modal-input-form');
const modalUserInput = document.getElementById('modal-user-input');
const modalLoading = document.getElementById('modal-loading');

// --- Email Templates ---
const emailTemplates = {
    "Venture Capital Firms": `Subject: ClimateCurtainsAB: Award-Winning Energy Efficiency Technology Seeking Investment Partnership\n\nDear [Investor Name],\n\nI hope this email finds you well. I am reaching out because [Investor Firm Name]'s focus on [Investor Focus] aligns perfectly with our mission at ClimateCurtainsAB...\n\nBest regards,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB`,
    "Angel Investors and Syndicates": `Subject: Energy-Saving Innovation with Proven Results - ClimateCurtainsAB Investment Opportunity\n\nDear [Investor Name],\n\nAs a syndicate focused on climate solutions, I wanted to introduce you to ClimateCurtainsAB, an award-winning Swedish company...\n\nWarm regards,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB`,
    "Corporate Venture Capital (CVC)": `Subject: Strategic Partnership Opportunity: ClimateCurtainsAB's Energy-Saving Window Technology\n\nDear [Investor Name],\n\nI'm reaching out because I see significant potential for strategic alignment between [Investor Firm Name]'s commitment to sustainability and ClimateCurtainsAB's innovative window solutions...\n\nBest regards,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB`,
    "Government Grants and Sustainable Funding Programs": `Subject: ClimateCurtainsAB Grant Application: Proven Energy Efficiency Technology Aligned with [Investor Firm Name] Objectives\n\nDear [Investor Name],\n\nI am writing to express ClimateCurtainsAB's interest in the [Investor Firm Name] and to inquire about the application process...\n\nSincerely,\n[Admin Name]\n[Admin Role]\nClimateCurtainsAB`
};

// --- Authentication ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().isAdmin) {
            adminProfile = docSnap.data();
            adminNameSpan.textContent = `Welcome, ${adminProfile.companyName || 'Admin'}`;
            initializeAdminPanel();
        } else {
            window.location.replace('dashboard.html');
        }
    } else {
        window.location.replace('portal.html');
    }
});

function initializeAdminPanel() {
    setupTabs();
    listenForInvestors();
    investorForm.addEventListener('submit', handleAddInvestor);
    logoutButton.addEventListener('click', () => signOut(auth));
    closeModalButton.addEventListener('click', () => aiModal.classList.add('hidden'));
    modalInputForm.addEventListener('submit', handleAiChatSubmit);
}

// --- Tab Management ---
function setupTabs() {
    tabInvestorOutreach.addEventListener('click', () => {
        contentSiteManagement.classList.add('hidden');
        contentInvestorOutreach.classList.remove('hidden');
        tabSiteManagement.classList.remove('active');
        tabInvestorOutreach.classList.add('active');
    });
    tabSiteManagement.addEventListener('click', () => {
        contentInvestorOutreach.classList.add('hidden');
        contentSiteManagement.classList.remove('hidden');
        tabInvestorOutreach.classList.remove('active');
        tabSiteManagement.classList.add('active');
    });
}

// --- Investor CRM Logic ---
async function handleAddInvestor(e) {
    e.preventDefault();
    const formData = new FormData(investorForm);
    const investorData = Object.fromEntries(formData.entries());
    investorData.createdAt = serverTimestamp();
    
    try {
        // *** FIX: Changed 'investors' to 'investor_prospects' to match security rules ***
        await addDoc(collection(db, 'investor_prospects'), investorData);
        investorForm.reset();
    } catch (error) {
        console.error("Error adding investor:", error);
        alert("Failed to add investor. Check console and security rules.");
    }
}

function listenForInvestors() {
    // *** FIX: Changed 'investors' to 'investor_prospects' to match security rules ***
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
                <h4 class="text-lg font-bold">${investor.firmName}</h4>
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

// --- AI Email Drafter Logic ---
investorListContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('draft-email-btn')) {
        const investorData = JSON.parse(e.target.dataset.investor);
        openAiModal(investorData);
    }
});

function openAiModal(investor) {
    modalChatWindow.innerHTML = '';
    chatHistory = [];
    aiModal.classList.remove('hidden');

    let template = emailTemplates[investor.category] || "Please write a professional outreach email.";
    template = template.replace('[Investor Name]', investor.contactName)
                       .replace(/\[Investor Firm Name\]/g, investor.firmName)
                       .replace('[Investor Focus]', investor.focus)
                       .replace(/\[Admin Name\]/g, adminProfile.companyName) // Assuming companyName is user's name
                       .replace(/\[Admin Role\]/g, adminProfile.roleInCompany);

    const initialPrompt = `Hello, I am ${adminProfile.companyName}, the ${adminProfile.roleInCompany} of ClimateCurtainsAB. I am drafting an email to ${investor.contactName} of ${investor.firmName}, which is a ${investor.category}. Please help me.

Here is a first draft based on a template:
---
${template}
---
Would you like me to research the investor's website (${investor.website}) and help you tailor this email to them?`;

    addMessageToChat('ai', 'Hello! I am your AI assistant. I have prepared a draft email for you. How would you like to proceed?');
    
    // Start the conversation with the initial prompt
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
    
    // IMPORTANT: Replace with your actual API key
    const apiKey = "AIzaSyBQeLMNbrjf8RPO01wipxS0JrWNyTv9az0";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    if (isInitial) {
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
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
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        const aiResponse = result.candidates[0].content.parts[0].text;
        
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
    messageElement.className = `p-3 rounded-lg max-w-[80%] ${sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'}`;
    // Basic markdown to HTML conversion
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    text = text.replace(/\n/g, '<br>'); // Newlines
    messageElement.innerHTML = text;
    modalChatWindow.appendChild(messageElement);
    modalChatWindow.scrollTop = modalChatWindow.scrollHeight;
}
