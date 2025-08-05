import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';

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
const adminNameSpan = document.getElementById('admin-name');
const logoutButton = document.getElementById('logout-button');
const totalUsersElem = document.getElementById('total-users');
const registeredCompaniesElem = document.getElementById('registered-companies');
const totalInquiriesElem = document.getElementById('total-inquiries');
const userListTableBody = document.querySelector('#user-list-table tbody');
const inquiryListDiv = document.getElementById('inquiry-list');
const fileUploadForm = document.getElementById('file-upload-form');
const uploadStatusDiv = document.getElementById('upload-status');
const uploadedFilesList = document.getElementById('uploaded-files-list');
const investorProspectForm = document.getElementById('investor-prospect-form');
const investorProspectListDiv = document.getElementById('investor-prospect-list');


// --- Main Admin Logic ---

// Authentication Guard: Redirect if not an admin
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().isAdmin) {
            // User is an admin, proceed to load dashboard
            adminNameSpan.textContent = `Welcome, ${docSnap.data().companyName || 'Admin'}`;
            loadDashboardData();
        } else {
            // Not an admin, redirect to client dashboard
            window.location.replace('dashboard.html');
        }
    } else {
        // Not logged in, redirect to portal
        window.location.replace('portal.html');
    }
});

// Load all data for the dashboard
function loadDashboardData() {
    fetchUsersAndCompanies();
    fetchInquiries();
    listenForUploadedFiles();
    listenForInvestorProspects();
}

// Fetch and display all registered users
async function fetchUsersAndCompanies() {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const companyNames = new Set();
    userListTableBody.innerHTML = ''; // Clear existing list

    usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data();
        if (userData.companyName) {
            companyNames.add(userData.companyName);
        }
        const row = userListTableBody.insertRow();
        row.innerHTML = `
            <td class="p-3">${userData.companyName || 'N/A'}</td>
            <td class="p-3">${userData.email}</td>
            <td class="p-3">${userData.roleInCompany || 'N/A'}</td>
            <td class="p-3">${userData.isInvestor ? 'Yes' : 'No'}</td>
        `;
    });

    totalUsersElem.textContent = usersSnapshot.size;
    registeredCompaniesElem.textContent = companyNames.size;
}

// Fetch and display contact inquiries
async function fetchInquiries() {
    const inquiriesSnapshot = await getDocs(collection(db, 'inquiries'));
    inquiryListDiv.innerHTML = ''; // Clear existing list

    totalInquiriesElem.textContent = inquiriesSnapshot.size;

    inquiriesSnapshot.forEach(inqDoc => {
        const inquiry = inqDoc.data();
        const card = document.createElement('div');
        card.className = 'border border-gray-200 p-4 rounded-lg';
        card.innerHTML = `
            <h4 class="font-bold">${inquiry.subject}</h4>
            <p class="text-sm text-gray-600">From: ${inquiry.name} (${inquiry.email})</p>
            <p class="mt-2">${inquiry.message}</p>
        `;
        inquiryListDiv.appendChild(card);
    });
}

// Handle Investor Document Uploads
fileUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('investor-file-upload');
    const file = fileInput.files[0];
    if (!file) return;

    uploadStatusDiv.textContent = 'Uploading...';
    const storageRef = ref(storage, `investor_documents/${file.name}`);
    
    try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Save file reference to Firestore
        await addDoc(collection(db, 'investor_files'), {
            fileName: file.name,
            downloadURL: downloadURL,
            uploadedAt: serverTimestamp()
        });
        
        uploadStatusDiv.textContent = 'Upload successful!';
        fileUploadForm.reset();
    } catch (error) {
        console.error("Upload failed:", error);
        uploadStatusDiv.textContent = `Upload failed: ${error.message}`;
    }
});

// Listen for real-time updates to uploaded files
function listenForUploadedFiles() {
    const filesRef = collection(db, 'investor_files');
    onSnapshot(filesRef, (snapshot) => {
        uploadedFilesList.innerHTML = '';
        snapshot.forEach(doc => {
            const fileData = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<a href="${fileData.downloadURL}" target="_blank" class="text-blue-500 hover:underline">${fileData.fileName}</a>`;
            uploadedFilesList.appendChild(li);
        });
    });
}

// Handle Investor Prospect Form
investorProspectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('investor-name').value;
    const category = document.getElementById('investor-category').value;

    await addDoc(collection(db, 'investor_prospects'), {
        name,
        category,
        contacted: false,
        notes: ''
    });
    investorProspectForm.reset();
});

// Listen for real-time updates to investor prospects
function listenForInvestorProspects() {
    const prospectsRef = collection(db, 'investor_prospects');
    onSnapshot(prospectsRef, (snapshot) => {
        investorProspectListDiv.innerHTML = '';
        snapshot.forEach(doc => {
            const prospect = doc.data();
            const id = doc.id;
            const card = document.createElement('div');
            card.className = 'border p-3 rounded-lg flex flex-col space-y-2';
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold">${prospect.name} <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${prospect.category}</span></span>
                    <div class="flex items-center">
                        <label for="contacted-${id}" class="text-sm mr-2">Contacted:</label>
                        <input type="checkbox" id="contacted-${id}" ${prospect.contacted ? 'checked' : ''} data-id="${id}">
                    </div>
                </div>
                <textarea data-id="${id}" class="w-full border p-2 rounded-lg text-sm" placeholder="Add notes...">${prospect.notes}</textarea>
                <button class="save-note-btn bg-gray-200 hover:bg-gray-300 text-xs py-1 px-2 rounded-lg self-end" data-id="${id}">Save Note</button>
            `;
            investorProspectListDiv.appendChild(card);
        });
    });
}

// Event delegation for saving notes and updating checkboxes
investorProspectListDiv.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.matches('input[type="checkbox"]')) {
        const prospectRef = doc(db, 'investor_prospects', id);
        await updateDoc(prospectRef, { contacted: target.checked });
    }
    
    if (target.matches('.save-note-btn')) {
        const noteText = document.querySelector(`textarea[data-id="${id}"]`).value;
        const prospectRef = doc(db, 'investor_prospects', id);
        await updateDoc(prospectRef, { notes: noteText });
        alert('Note saved!');
    }
});


// Logout functionality
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.replace('portal.html');
    } catch (error) {
        console.error("Logout failed:", error);
    }
});
