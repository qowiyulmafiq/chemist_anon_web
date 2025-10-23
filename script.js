// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA8cQId-Wnwuo56efQuwSeQGxZEY5-YqbE",
    authDomain: "chemistry-voice-hub.firebaseapp.com",
    projectId: "chemistry-voice-hub",
    storageBucket: "chemistry-voice-hub.firebasestorage.app",
    messagingSenderId: "132800280681",
    appId: "1:132800280681:web:6a3b02f5fb540f93498af8",
    measurementId: "G-Z006B6ZWG4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data variables
let approvedNotes = [];
let pendingNotes = [];
let gallery = [];
let isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

// Search functionality
let searchTimeout;

function searchNotes() {
    const query = document.getElementById('search-notes').value.toLowerCase();
    const filteredNotes = approvedNotes.filter(note => 
        note.text.toLowerCase().includes(query)
    );
    renderApprovedNotes(filteredNotes);
}

// Real-time search with debounce
document.getElementById('search-notes').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchNotes, 300);
});

// Firebase Functions

// Load approved notes from Firestore
async function loadApprovedNotes() {
    try {
        const notesRef = collection(db, 'approvedNotes');
        const q = query(notesRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        approvedNotes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderApprovedNotes();
        updateStats();
    } catch (error) {
        console.error('Error loading approved notes:', error);
    }
}

// Load pending notes from Firestore
async function loadPendingNotes() {
    try {
        const notesRef = collection(db, 'pendingNotes');
        const q = query(notesRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        pendingNotes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        if (isAdminLoggedIn) {
            renderPendingNotes();
        }
        updateStats();
    } catch (error) {
        console.error('Error loading pending notes:', error);
    }
}

// Load gallery from Firestore
async function loadGallery() {
    try {
        const galleryRef = collection(db, 'gallery');
        const q = query(galleryRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        
        gallery = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderGallery();
        if (isAdminLoggedIn) {
            renderGalleryAdmin();
        }
        updateStats();
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Submit new note
async function submitNote(text) {
    try {
        const noteData = {
            text: text,
            date: new Date().toLocaleString('id-ID'),
            timestamp: Date.now()
        };
        
        await addDoc(collection(db, 'pendingNotes'), noteData);
        await loadPendingNotes();
        return { success: true };
    } catch (error) {
        console.error('Error submitting note:', error);
        return { success: false, error };
    }
}

// Approve note
async function approveNote(noteId) {
    try {
        const note = pendingNotes.find(n => n.id === noteId);
        if (!note) return;
        
        // Add to approved notes
        const approvedData = {
            text: note.text,
            date: note.date,
            timestamp: note.timestamp,
            likes: 0,
            dislikes: 0
        };
        
        await addDoc(collection(db, 'approvedNotes'), approvedData);
        
        // Delete from pending
        await deleteDoc(doc(db, 'pendingNotes', noteId));
        
        // Reload data
        await loadPendingNotes();
        await loadApprovedNotes();
    } catch (error) {
        console.error('Error approving note:', error);
        alert('Gagal menyetujui note!');
    }
}

// Reject note
async function rejectNote(noteId) {
    try {
        await deleteDoc(doc(db, 'pendingNotes', noteId));
        await loadPendingNotes();
    } catch (error) {
        console.error('Error rejecting note:', error);
        alert('Gagal menolak note!');
    }
}

// Delete approved note
async function deleteApprovedNote(noteId) {
    if (!confirm('Apakah Anda yakin ingin menghapus note ini?')) return;
    
    try {
        await deleteDoc(doc(db, 'approvedNotes', noteId));
        await loadApprovedNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Gagal menghapus note!');
    }
}

// Toggle like for note
async function toggleLike(noteId, type) {
    const btn = event.target.closest('button');
    btn.classList.add('debounce-active');
    
    try {
        const collectionName = type === 'note' ? 'approvedNotes' : 'gallery';
        const list = type === 'note' ? approvedNotes : gallery;
        const item = list.find(i => i.id === noteId);
        
        if (!item) return;
        
        let newLikes = item.likes || 0;
        let newDislikes = item.dislikes || 0;
        let newUserAction = item.userAction;
        
        if (newUserAction === 'like') {
            newLikes--;
            newUserAction = null;
        } else {
            if (newUserAction === 'dislike') newDislikes--;
            newLikes++;
            newUserAction = 'like';
        }
        
        // Update Firestore
        const itemRef = doc(db, collectionName, noteId);
        await updateDoc(itemRef, {
            likes: newLikes,
            dislikes: newDislikes,
            userAction: newUserAction
        });
        
        // Update local data
        item.likes = newLikes;
        item.dislikes = newDislikes;
        item.userAction = newUserAction;
        
        if (type === 'note') renderApprovedNotes();
        else renderGallery();
    } catch (error) {
        console.error('Error toggling like:', error);
    }
    
    setTimeout(() => btn.classList.remove('debounce-active'), 500);
}

// Toggle dislike
async function toggleDislike(noteId, type) {
    const btn = event.target.closest('button');
    btn.classList.add('debounce-active');
    
    try {
        const collectionName = type === 'note' ? 'approvedNotes' : 'gallery';
        const list = type === 'note' ? approvedNotes : gallery;
        const item = list.find(i => i.id === noteId);
        
        if (!item) return;
        
        let newLikes = item.likes || 0;
        let newDislikes = item.dislikes || 0;
        let newUserAction = item.userAction;
        
        if (newUserAction === 'dislike') {
            newDislikes--;
            newUserAction = null;
        } else {
            if (newUserAction === 'like') newLikes--;
            newDislikes++;
            newUserAction = 'dislike';
        }
        
        // Update Firestore
        const itemRef = doc(db, collectionName, noteId);
        await updateDoc(itemRef, {
            likes: newLikes,
            dislikes: newDislikes,
            userAction: newUserAction
        });
        
        // Update local data
        item.likes = newLikes;
        item.dislikes = newDislikes;
        item.userAction = newUserAction;
        
        if (type === 'note') renderApprovedNotes();
        else renderGallery();
    } catch (error) {
        console.error('Error toggling dislike:', error);
    }
    
    setTimeout(() => btn.classList.remove('debounce-active'), 500);
}

// Upload image as Base64 to Firestore (NO STORAGE NEEDED)
async function uploadImage(file, desc) {
    try {
        // Convert file to Base64
        const base64 = await fileToBase64(file);
        
        // Add to Firestore
        const galleryData = {
            src: base64, // Store as Base64 string
            desc: desc,
            likes: 0,
            dislikes: 0,
            uploader: 'admin',
            uploadDate: new Date().toLocaleString('id-ID'),
            timestamp: Date.now()
        };
        
        await addDoc(collection(db, 'gallery'), galleryData);
        await loadGallery();
        
        return { success: true };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error };
    }
}

// Helper function to convert file to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Delete gallery item
async function deleteGalleryItem(itemId) {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
    
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'gallery', itemId));
        
        await loadGallery();
        
        // Show success message
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = 'Foto berhasil dihapus!';
        document.getElementById('gallery-admin').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        alert('Gagal menghapus foto!');
    }
}

// Render Functions

function renderApprovedNotes(notes = null) {
    const container = document.getElementById('approved-notes');
    const notesToRender = notes || approvedNotes;
    
    if (notesToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>${notes ? 'Tidak ada hasil pencarian' : 'Belum ada notes'}</h3>
                <p>${notes ? 'Coba dengan kata kunci lain' : 'Notes yang disetujui akan muncul di sini'}</p>
            </div>
        `;
        return;
    }
    
    const sortedNotes = [...notesToRender].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    container.innerHTML = sortedNotes.map(note => `
        <div class="card">
            <div class="note-text">${note.text}</div>
            <div class="note-date"><i class="far fa-clock"></i> ${note.date}</div>
            <div class="interaction-bar">
                <div>
                    <button class="like-btn ${note.userAction === 'like' ? 'active' : ''}" onclick="window.toggleLike('${note.id}', 'note')">
                        <i class="fas fa-heart"></i> ${note.likes || 0}
                    </button>
                    <button class="dislike-btn ${note.userAction === 'dislike' ? 'active' : ''}" onclick="window.toggleDislike('${note.id}', 'note')">
                        <i class="fas fa-thumbs-down"></i> ${note.dislikes || 0}
                    </button>
                </div>
                <div>
                    <span class="badge"><i class="fas fa-check-circle"></i> Disetujui</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderGallery() {
    const container = document.getElementById('public-gallery');
    
    if (gallery.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>Belum ada foto</h3>
                <p>Foto dokumentasi akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = gallery.map(item => `
        <div class="gallery-item">
            <img src="${item.src}" alt="Dokumentasi">
            <div class="gallery-caption">
                <p>${item.desc}</p>
                <div class="interaction-bar">
                    <button class="like-btn ${item.userAction === 'like' ? 'active' : ''}" onclick="window.toggleLike('${item.id}', 'gallery')">
                        <i class="fas fa-heart"></i> ${item.likes || 0}
                    </button>
                    <button class="dislike-btn ${item.userAction === 'dislike' ? 'active' : ''}" onclick="window.toggleDislike('${item.id}', 'gallery')">
                        <i class="fas fa-thumbs-down"></i> ${item.dislikes || 0}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderGalleryAdmin() {
    const container = document.getElementById('gallery-admin');
    
    if (gallery.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>Belum ada foto di gallery</h3>
                <p>Foto yang diupload akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = gallery.map(item => `
        <div class="gallery-item">
            <img src="${item.src}" alt="Dokumentasi">
            <div class="gallery-caption">
                <p>${item.desc} <span class="admin-badge">Admin</span></p>
                <div class="interaction-bar">
                    <div>
                        <span><i class="fas fa-heart"></i> ${item.likes || 0}</span>
                        <span><i class="fas fa-thumbs-down"></i> ${item.dislikes || 0}</span>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="window.deleteGalleryItem('${item.id}')" title="Hapus Foto">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPendingNotes() {
    const container = document.getElementById('pending-notes');
    
    if (pendingNotes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Tidak ada notes menunggu</h3>
                <p>Semua notes telah dimoderasi</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingNotes.map(note => `
        <div class="card">
            <div class="note-text">${note.text}</div>
            <div class="note-date"><i class="far fa-clock"></i> ${note.date}</div>
            <div class="interaction-bar">
                <button class="btn btn-success" onclick="window.approveNote('${note.id}')">
                    <i class="fas fa-check"></i> Setujui
                </button>
                <button class="btn btn-danger" onclick="window.rejectNote('${note.id}')">
                    <i class="fas fa-times"></i> Tolak
                </button>
            </div>
        </div>
    `).join('');
}

function renderApprovedNotesAdmin() {
    const container = document.getElementById('approved-notes-admin');
    
    if (approvedNotes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>Belum ada notes disetujui</h3>
                <p>Notes yang disetujui akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = approvedNotes.map(note => `
        <div class="card">
            <div class="note-text">${note.text}</div>
            <div class="note-date"><i class="far fa-clock"></i> ${note.date}</div>
            <div class="interaction-bar">
                <div>
                    <span><i class="fas fa-heart"></i> ${note.likes || 0}</span>
                    <span><i class="fas fa-thumbs-down"></i> ${note.dislikes || 0}</span>
                </div>
                <button class="btn btn-danger btn-small" onclick="window.deleteApprovedNote('${note.id}')">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// Tab navigation
function showTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'home') renderApprovedNotes();
    if (tabId === 'history') renderGallery();
    if (tabId === 'admin') {
        updateStats();
        if (isAdminLoggedIn) {
            renderPendingNotes();
            renderApprovedNotesAdmin();
            renderGalleryAdmin();
        }
    }
}

function updateStats() {
    document.getElementById('total-notes').textContent = approvedNotes.length;
    document.getElementById('pending-notes-count').textContent = pendingNotes.length;
    document.getElementById('total-images').textContent = gallery.length;
}

function checkAdmin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === 'Ketupel 2 periode') {
        isAdminLoggedIn = true;
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminFeatures();
    } else {
        alert('Password admin salah!');
    }
}

function showAdminFeatures() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('upload-panel').style.display = 'block';
    
    updateStats();
    renderPendingNotes();
    renderApprovedNotesAdmin();
    renderGalleryAdmin();
}

function hideAdminFeatures() {
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('upload-panel').style.display = 'none';
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    sessionStorage.removeItem('adminLoggedIn');
    hideAdminFeatures();
    document.getElementById('admin-password').value = '';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Load all data from Firebase
    await loadApprovedNotes();
    await loadPendingNotes();
    await loadGallery();
    
    // Character counter for note form
    document.getElementById('note-text').addEventListener('input', function() {
        document.getElementById('char-count').textContent = this.value.length;
    });
    
    // File upload info
    document.getElementById('image-upload').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            document.getElementById('file-info').textContent = 
                `File: ${file.name} (${fileSize} MB)`;
        } else {
            document.getElementById('file-info').textContent = 'Maksimal 5MB';
        }
    });
    
    // Show admin panel if already logged in
    if (isAdminLoggedIn) {
        showAdminFeatures();
    } else {
        hideAdminFeatures();
    }
});

// Note form submission
document.getElementById('note-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const text = document.getElementById('note-text').value.trim();
    
    if (text.length === 0) {
        alert('Note tidak boleh kosong!');
        return;
    }
    
    if (text.length > 500) {
        alert('Note terlalu panjang! Maksimal 500 karakter.');
        return;
    }
    
    document.getElementById('loading-send').style.display = 'block';
    
    const result = await submitNote(text);
    
    document.getElementById('loading-send').style.display = 'none';
    
    if (result.success) {
        document.getElementById('success-alert').style.display = 'block';
        document.getElementById('note-form').reset();
        document.getElementById('char-count').textContent = '0';
        
        setTimeout(() => {
            document.getElementById('success-alert').style.display = 'none';
        }, 5000);
        
        if (isAdminLoggedIn) updateStats();
    } else {
        alert('Gagal mengirim note. Coba lagi!');
    }
});

// Image upload form
document.getElementById('upload-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const file = document.getElementById('image-upload').files[0];
    const desc = document.getElementById('image-desc').value.trim();
    
    if (!file) {
        alert('Pilih file gambar terlebih dahulu!');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 5MB.');
        return;
    }
    
    if (desc.length === 0) {
        alert('Deskripsi foto tidak boleh kosong!');
        return;
    }
    
    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div class="spinner"></div><p>Mengupload foto...</p>';
    document.getElementById('upload-form').prepend(loadingDiv);
    
    const result = await uploadImage(file, desc);
    
    loadingDiv.remove();
    
    if (result.success) {
        document.getElementById('upload-form').reset();
        document.getElementById('file-info').textContent = 'Maksimal 5MB';
        
        if (isAdminLoggedIn) updateStats();
        
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = 'Foto berhasil diupload!';
        document.getElementById('upload-form').prepend(alert);
        setTimeout(() => alert.remove(), 3000);
    } else {
        alert('Gagal mengupload foto. Coba lagi!');
    }
});

// Export functions to window for onclick handlers
window.showTab = showTab;
window.searchNotes = searchNotes;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.checkAdmin = checkAdmin;
window.logoutAdmin = logoutAdmin;
window.approveNote = approveNote;
window.rejectNote = rejectNote;
window.deleteApprovedNote = deleteApprovedNote;
window.deleteGalleryItem = deleteGalleryItem;