# UNIGAMALANG Inventory - Sistem Inventaris & Pengadaan

Sistem Manajemen Inventaris dan Pengadaan untuk **Universitas Gajayana Malang (UNIGAMALANG)**.
Menggunakan Google Sheets sebagai database dan Google Drive untuk penyimpanan file.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons
- **Auth**: NextAuth.js (Credentials Provider, JWT strategy)
- **Database**: Google Sheets API v4 (dengan auth client di-cache)
- **Storage**: Google Drive API v3
- **Validation**: Zod (validasi runtime di setiap endpoint)
- **Notifications**: Sonner (toast)
- **QR Code**: qrcode.react (di-render client-side dari URL kanonik)

## Fitur

### Peran & Akses
| Role | Akses |
|------|-------|
| **Staff** | Lihat inventaris, ajukan pengadaan, upload foto nota |
| **Approver** | Setujui/tolak pengadaan |
| **Admin** | CRUD inventaris, kelola pengguna, selesaikan pengadaan |

### Modul
- **Dashboard**: Statistik inventaris & pengadaan
- **Inventaris**: CRUD barang dengan auto-ID `UGMALANG-INV-[YEAR]-[001]`,
  filter per **Kategori** & **Kondisi**, **Export CSV**, dan upload **foto
  item / nota pembelian** ke Google Drive
- **Pengadaan**: Form pengajuan + upload nota ke Google Drive, filter per
  **status** (Pending / Approved / Rejected / Completed)
- **Persetujuan**: Dashboard approval untuk Approver/Admin
- **Pengguna**: Manajemen user (Admin only)
- **Detail Item**: Halaman publik untuk scan QR code (QR di-render
  client-side dari URL — tidak menyimpan DataURL di Sheet)
- **Print Label**: Cetak stiker 5cm x 3cm (Logo + Nama + ID + QR)

### Optimasi
- Auth Google API di-cache pada level modul (tidak parse JSON tiap request)
- Validasi Zod terpadu di semua endpoint POST/PUT
- Wrapper `apiHandler()` + `requireRoles()` untuk error handling konsisten
- Toast notifikasi (Sonner) menggantikan `alert()` & silent catches
- Endpoint REST konsisten: `/api/inventory/[id]`, `/api/users/[email]`
- Validasi env vars saat dibutuhkan (lazy)
- Pembatasan upload: 10 MB, hanya gambar / PDF

## Setup

### 1. Google Cloud Console

1. Buat project di [Google Cloud Console](https://console.cloud.google.com/)
2. Aktifkan **Google Sheets API** dan **Google Drive API**
3. Buat **Service Account** dan download JSON key
4. Catat `client_email` dari JSON key

### 2. Google Spreadsheet

1. Buat spreadsheet baru di Google Sheets
2. Buat 3 sheet dengan nama dan header berikut:

**Sheet: Users**
| Name | Email | Password | Role |
|------|-------|----------|------|

**Sheet: Inventory**
| Item_ID | Name | Category | Quantity | Location | Condition | Photo_URL | Receipt_URL | QR_URL | Created_At |
|---------|------|----------|----------|----------|-----------|-----------|-------------|--------|------------|

**Sheet: Procurement**
| Request_ID | Requestor_Name | Item_Name | Quantity | Estimated_Price | Status | Nota_Photo_Drive_ID | Created_At |
|------------|----------------|-----------|----------|-----------------|--------|---------------------|------------|

3. Share spreadsheet dengan `client_email` Service Account (Editor)
4. Catat Spreadsheet ID dari URL

### 3. Google Drive Folder

1. Buat folder di Google Drive untuk menyimpan foto nota
2. Share folder dengan `client_email` Service Account (Editor)
3. Catat Folder ID dari URL

### 4. Environment Variables

```bash
cp .env.example .env.local
```

Isi semua variabel di `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate dengan: openssl rand -base64 32>
GOOGLE_SERVICE_ACCOUNT_KEY=<isi dengan JSON key Service Account>
GOOGLE_SPREADSHEET_ID=<ID spreadsheet>
GOOGLE_DRIVE_FOLDER_ID=<ID folder Drive>
```

### 5. Buat User Admin Pertama

Setelah aplikasi berjalan, gunakan endpoint **`POST /api/bootstrap`** untuk
membuat akun admin pertama (hanya berfungsi saat sheet `Users` masih kosong):

```bash
curl -X POST http://localhost:3000/api/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@unigamalang.ac.id",
    "password": "rahasia-yang-kuat"
  }'
```

Atau cek terlebih dahulu apakah bootstrap masih dibutuhkan:

```bash
curl http://localhost:3000/api/bootstrap
```

> Setelah ada minimal satu user, endpoint ini akan menolak permintaan baru
> demi keamanan. Tambahkan user tambahan lewat menu **Pengguna** di dashboard.

### 6. Jalankan Aplikasi

```bash
npm install
npm run dev
```

Buka http://localhost:3000 dan login dengan akun admin.

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── bootstrap/            # Seed admin pertama
│   │   ├── inventory/            # GET / POST  (collection)
│   │   │   └── [id]/             # GET / PUT / DELETE (resource)
│   │   ├── procurement/          # CRUD pengadaan
│   │   ├── upload/               # Upload file ke Drive (10 MB, image/PDF)
│   │   └── users/                # GET / POST  (collection)
│   │       └── [email]/          # PUT / DELETE (resource)
│   ├── dashboard/                # Halaman inventaris/pengadaan/dll.
│   ├── item/[id]/                # Detail item (public, QR client-side)
│   └── login/                    # Halaman login
├── components/
│   ├── ConfirmDialog.tsx         # Reusable confirm dialog
│   ├── LoadingSpinner.tsx
│   ├── Providers.tsx             # SessionProvider + Toaster
│   └── Sidebar.tsx
├── lib/
│   ├── api.ts                    # apiHandler / requireRoles / parseJson
│   ├── auth.ts                   # NextAuth config
│   ├── env.ts                    # Validasi env vars (lazy)
│   ├── fetcher.ts                # apiFetch dengan toast error
│   ├── google.ts                 # Google Sheets/Drive helpers (cached)
│   ├── session.ts                # Server-side session helpers
│   └── validation.ts             # Skema Zod
├── types/
│   ├── index.ts                  # Type definitions
│   └── next-auth.d.ts            # NextAuth type augmentation
└── middleware.ts                  # Role-based route protection
```
