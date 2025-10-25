# Chemistry Voice Hub 🧪

Platform pesan anonim dan gallery dokumentasi untuk Chemistry Class. Dibangun dengan HTML, CSS, JavaScript, dan Firebase.

## ✨ Fitur

- 📝 **Kirim Pesan Anonim** - Siswa dapat mengirim pesan tanpa identitas
- 👨‍💼 **Panel Admin** - Moderasi pesan dan kelola konten
- 🖼️ **Gallery Dokumentasi** - Upload dan tampilkan foto kegiatan
- ❤️ **Like & Dislike** - Interaksi dengan notes dan foto
- 🔍 **Search & Filter** - Cari notes dengan mudah
- 🖼️ **Lightbox Gallery** - Lihat foto dalam mode layar penuh
- 🔐 **Firebase Authentication** - Login admin yang aman

## 🚀 Demo

[Live Demo](https://your-project.vercel.app) _(ganti dengan URL Anda)_

## 📋 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- Akun [Firebase](https://firebase.google.com/) (Spark Plan - Gratis)
- Akun [Vercel](https://vercel.com/) untuk deployment (opsional)
- Text editor (VS Code, Sublime, dll)
- Browser modern (Chrome, Firefox, Edge)

## 🛠️ Instalasi & Setup

### 1. Clone Repository

```bash
git clone https://github.com/username/chemistry-voice-hub.git
cd chemistry-voice-hub
```

Atau download ZIP dan extract.

### 2. Setup Firebase Project

#### A. Buat Project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Add Project"** atau **"Create a project"**
3. Masukkan nama project: `chemistry-voice-hub`
4. Ikuti wizard setup (Analytics opsional)
5. Klik **"Create Project"**

#### B. Daftarkan Web App

1. Di Firebase Console, klik icon **Web** (</>) 
2. Masukkan nickname: `Chemistry Voice Hub`
3. **Jangan** centang Firebase Hosting (kita pakai Vercel)
4. Klik **"Register app"**
5. **Copy** konfigurasi Firebase yang muncul:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

6. **Paste** konfigurasi ini ke file `script.js` (baris 13-21)

#### C. Enable Firestore Database

1. Di sidebar, klik **"Firestore Database"**
2. Klik **"Create database"**
3. Pilih **"Start in production mode"**
4. Pilih lokasi: **asia-southeast1** (Singapore) atau **asia-southeast2** (Jakarta)
5. Klik **"Enable"**

#### D. Setup Firestore Rules

1. Klik tab **"Rules"**
2. **Replace** semua rules dengan ini:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Approved notes - semua bisa read dan update (like/dislike)
    match /approvedNotes/{noteId} {
      allow read, update: if true;
      allow create, delete: if request.auth != null;
    }
    
    // Pending notes - semua bisa create dan read
    match /pendingNotes/{noteId} {
      allow read, create: if true;
      allow update, delete: if request.auth != null;
    }
    
    // Gallery - semua bisa read dan update (like/dislike)
    match /gallery/{imageId} {
      allow read, update: if true;
      allow create, delete: if request.auth != null;
    }
  }
}
```

3. Klik **"Publish"**

#### E. Enable Authentication

1. Di sidebar, klik **"Authentication"**
2. Klik **"Get started"**
3. Pilih **"Email/Password"**
4. Toggle **Enable** → **Save**

#### F. Buat Admin User

1. Klik tab **"Users"**
2. Klik **"Add user"**
3. Masukkan:
   - **Email**: `admin@chemistryvoicehub.com` (atau email Anda)
   - **Password**: `your-secure-password`
4. Klik **"Add user"**

#### G. Setup Authorized Domains (Opsional)

1. Klik tab **"Settings"** di Authentication
2. Scroll ke **"Authorized domains"**
3. Tambahkan domain Vercel Anda: `your-project.vercel.app`

### 3. Konfigurasi Local

#### Edit `script.js`

Buka `script.js` dan update Firebase config (baris 13-21):

```javascript
const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY",
    authDomain: "PASTE_YOUR_AUTH_DOMAIN",
    projectId: "PASTE_YOUR_PROJECT_ID",
    storageBucket: "PASTE_YOUR_STORAGE_BUCKET",
    messagingSenderId: "PASTE_YOUR_SENDER_ID",
    appId: "PASTE_YOUR_APP_ID",
    measurementId: "PASTE_YOUR_MEASUREMENT_ID"
};
```

#### Deploy via Website

1. Buka [vercel.com](https://vercel.com/)
2. Login dengan GitHub/GitLab/Bitbucket
3. Klik **"Add New Project"**
4. Import repository atau upload folder
5. Klik **"Deploy"**
6. Done! ✅

#### Deploy via CLI

```bash
vercel
```

Follow the prompts.

## 📁 Struktur File

```
chemistry-voice-hub/
├── index.html          # Halaman utama
├── style.css           # Styling
├── script.js           # Logic & Firebase integration
├── README.md           # Dokumentasi (file ini)
└── .gitignore          # Git ignore file
```

## 🔧 Konfigurasi

### Environment Variables (Opsional)

Untuk production, disarankan menggunakan environment variables:

1. Buat file `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. Tambahkan `.env` ke `.gitignore`

3. Update `script.js`:

```javascript
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    // ... dst
};
```

## Cara Menggunakan

### Sebagai User (Siswa)

1. **Kirim Pesan Anonim:**
   - Klik tab **"Kirim Note"**
   - Tulis pesan (max 500 karakter)
   - Klik **"Kirim Note"**
   - Pesan akan menunggu moderasi admin

2. **Like/Dislike Notes:**
   - Lihat notes di tab **"Beranda"**
   - Klik ❤️ untuk like, 👎 untuk dislike
   - Klik lagi untuk membatalkan

3. **Lihat Gallery:**
   - Klik tab **"History"**
   - Klik foto untuk lihat layar penuh
   - Tekan ESC atau klik X untuk tutup

### Sebagai Admin

1. **Login:**
   - Klik tab **"Admin"**
   - Masukkan email & password
   - Klik **"Masuk"**

2. **Moderasi Notes:**
   - Lihat pending notes di panel **"Moderasi Notes"**
   - Klik **"Setujui"** untuk approve
   - Klik **"Tolak"** untuk reject

3. **Kelola Notes:**
   - Lihat approved notes di panel **"Kelola Notes Disetujui"**
   - Klik **"Hapus"** untuk menghapus note

4. **Upload Foto:**
   - Scroll ke panel **"Upload Foto"**
   - Pilih file gambar (max 5MB)
   - Tulis deskripsi
   - Klik **"Upload Foto"**

5. **Kelola Gallery:**
   - Lihat semua foto di panel **"Kelola Gallery Foto"**
   - Klik **"Hapus"** untuk menghapus foto

6. **Logout:**
   - Klik **"Logout Admin"** di bawah

## 🔒 Keamanan

### Firestore Security Rules

Rules yang digunakan memastikan:
- ✅ Semua orang bisa kirim note
- ✅ Hanya admin (authenticated) yang bisa approve/delete
- ✅ Semua orang bisa like/dislike
- ✅ Hanya admin yang bisa upload/delete foto

### Firebase Authentication

- Admin login menggunakan email & password
- Password di-hash oleh Firebase
- Session management otomatis
- Auto-logout setelah inactive

### Best Practices

1. **Jangan commit `.env` file** ke Git
2. **Ganti password admin** secara berkala
3. **Monitor Firebase Usage** di Console
4. **Enable reCAPTCHA** untuk mencegah spam (opsional)

## 🐛 Troubleshooting

### Error: "Firebase App named '[DEFAULT]' already exists"

**Solusi:** Hapus script Firebase duplicate di HTML. Hanya boleh ada 1 inisialisasi Firebase.

### Error: "Missing or insufficient permissions"

**Solusi:** Cek Firestore Rules. Pastikan rules sudah di-publish dengan benar.

### Navbar tidak berfungsi

**Solusi:** Pastikan script.js di-load sebagai module:
```html
<script type="module" src="script.js"></script>
```

### Foto tidak ter-upload

**Solusi:** 
- Cek ukuran file (max 5MB)
- Cek apakah admin sudah login
- Cek browser console untuk error

### Login gagal terus

**Solusi:**
- Pastikan email & password benar
- Cek di Firebase Console → Authentication → Users
- Cek browser console untuk error detail

## 🔄 Update & Maintenance

### Update Firebase Config

Jika ganti project Firebase:
1. Copy config baru dari Firebase Console
2. Update di `script.js`
3. Re-deploy

### Backup Data

**Export Firestore Data:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Export
firebase firestore:export backup-folder
```
