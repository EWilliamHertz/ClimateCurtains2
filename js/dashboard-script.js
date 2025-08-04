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
    getDocs
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

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

const loadingSpinner = document.getElementById('loading');
const dashboardView = document.getElementById('dashboard-view');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const investorResourcesSection = document.getElementById('investor-resources');
const investorFilesList = document.getElementById('investor-files-list');

onAuthStateChanged(auth, (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                loadingSpinner.classList.add('hidden');
                dashboardView.classList.remove('hidden');
                const profile = docSnap.data();
                welcomeMessage.textContent = `Welcome, ${profile.companyName}!`;
                document.getElementById('dashboard-company-name').textContent = profile.companyName;
                document.getElementById('dashboard-role').textContent = profile.roleInCompany;
                document.getElementById('dashboard-sqm').textContent = profile.squareMeterInFactory;
                document.getElementById('dashboard-investor').textContent = profile.isInvestor ? 'Yes' : 'No';
                document.getElementById('dashboard-linkedin').href = profile.linkedinProfile;
                document.getElementById('dashboard-linkedin').textContent = profile.linkedinProfile;
                document.getElementById('dashboard-uid').textContent = user.uid;

                if (profile.isInvestor) {
                    investorResourcesSection.classList.remove('hidden');
                    getDocs(collection(db, "public/investor_files")).then(snapshot => {
                        investorFilesList.innerHTML = '';
                        snapshot.forEach(fileDoc => {
                            const fileData = fileDoc.data();
                            const fileItem = document.createElement('div');
                            fileItem.className = 'flex justify-between items-center bg-white p-4 rounded-lg shadow-sm';
                            fileItem.innerHTML = `<span class="font-semibold">${fileData.fileName}</span><a href="${fileData.downloadURL}" target="_blank" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Download</a>`;
                            investorFilesList.appendChild(fileItem);
                        });
                    });
                }
            } else {
                console.log("No such document!");
                signOut(auth);
            }
        });
    } else {
        window.location.href = 'portal.html';
    }
});

logoutButton.addEventListener('click', () => {
    signOut(auth);
});
