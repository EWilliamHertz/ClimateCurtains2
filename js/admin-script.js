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
const storage = getStorage(app);

// --- DOM Elements ---
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

// --- Hardcoded Data ---
const investorData = {
    'Venture Capital Firms': [{
        contact: 'Christian Hernandez, Partner', email: 'info@2150.vc', website: 'https://www.2150.vc', 
        focus: 'Climate tech', relevance: 'Focuses on urban solutions'
    }],
    'Angel Investors': [{
        contact: 'Climate Angels', email: 'climate@coreangels.com', website: 'https://www.coreangels.com/coreangelsclimate', 
        focus: 'Climate innovation', relevance: 'Pan-European angel group'
    }]
};
const emailTemplates = {
    'Venture Capital Firms': { subject: "Investment: ClimateCurtainsAB", body: "Dear [Investor Name],\n\n..." },
    'Angel Investors': { subject: "Angel Opportunity: ClimateCurtainsAB", body: "Dear [Investor Name],\n\n..." }
};

// --- Main Auth Flow ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userProfileRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists() && docSnap.data().isAdmin) {
            // User is an admin, initialize the page
            loadingSpinner.classList.add('hidden');
            adminDashboardSection.classList.remove('hidden');
            adminNameSpan.textContent = docSnap.data().companyName || docSnap.data().firstName;
            initializeAdminDashboard();
        } else {
            // Not an admin, redirect
            alert("Access Denied. You are not an administrator.");
            window.location.href = 'portal.html';
        }
    } else {
        // Not logged in, redirect
        window.location.href = 'portal.html';
    }
});

// --- Admin Dashboard Initialization ---
function initializeAdminDashboard() {
    fetchUsers();
    fetchInquiries();
    populateInvestorList();
    setupEventListeners();
}

async function fetchUsers() {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    userListTableBody.innerHTML = '';
    const companyNames = new Set();
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${data.companyName || 'N/A'}</td>
            <td>${data.firstName}</td>
            <td>${data.lastName}</td>
            <td>${data.email}</td>
            <td>${data.isInvestor ? 'Yes' : 'No'}</td>
            <td>${doc.id}</td>
        `;
        userListTableBody.appendChild(tr);
        if(data.companyName) companyNames.add(data.companyName);
    });
    totalUsersElem.textContent = usersSnapshot.size;
    registeredCompaniesElem.textContent = companyNames.size;
}

async function fetchInquiries() {
    const inquiriesSnapshot = await getDocs(collection(db, 'inquiries'));
    inquiryListTableBody.innerHTML = '';
    totalInquiriesElem.textContent = inquiriesSnapshot.size;
    inquiriesSnapshot.forEach(doc => {
        const data = doc.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td>${data.name}</td>
            <td>${data.subject}</td>
            <td><a href="#">View</a></td>
        `;
        inquiryListTableBody.appendChild(tr);
    });
}

function populateInvestorList() {
    investorListGrid.innerHTML = '';
    for (const category in investorData) {
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'col-span-full text-lg font-bold mt-4 mb-2';
        categoryTitle.textContent = category;
        investorListGrid.appendChild(categoryTitle);
        investorData[category].forEach(investor => {
            const card = document.createElement('div');
            card.className = 'investor-card bg-white p-4 rounded-lg shadow';
            card.innerHTML = `
                <h3 class="font-bold text-green-600">${investor.contact}</h3>
                <p><strong>Email:</strong> <a href="mailto:${investor.email}" class="text-blue-500 hover:underline">${investor.email}</a></p>
                <button onclick="openModal('${category}', ${JSON.stringify(investor).replace(/"/g, "'")})" class="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Draft Email</button>
            `;
            investorListGrid.appendChild(card);
        });
    }
}

function setupEventListeners() {
    logoutButton.addEventListener('click', () => signOut(auth));
    
    fileUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('investor-file-upload');
        const file = fileInput.files[0];
        if (!file) { alert("Please select a file."); return; }

        const storageRef = ref(storage, `investor_files/${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await addDoc(collection(db, 'public/investor_files'), {
                fileName: file.name,
                downloadURL: downloadURL,
                uploadedAt: serverTimestamp()
            });
            alert("File uploaded successfully!");
            fileInput.value = '';
        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        }
    });
}

// Make modal functions globally accessible
window.openModal = function(category, investor) {
    const template = emailTemplates[category];
    investorNameModal.textContent = investor.contact.split(',')[0];
    emailDraftBody.value = template.body.replace('[Investor Name]', investor.contact.split(',')[0]);
    sendEmailLink.href = `mailto:${investor.email}?subject=${encodeURIComponent(template.subject)}`;
    emailModal.style.display = 'block';
};

window.closeModal = function() {
    emailModal.style.display = 'none';
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tabs button').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`#tab-button-${tabName}`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    document.getElementById(`${tabName}-tab-content`).classList.remove('hidden');
};
