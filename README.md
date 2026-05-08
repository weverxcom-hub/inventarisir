# UNIGAMALANG Inventory - Sistem Inventaris & Pengadaan

Sistem Manajemen Inventaris dan Pengadaan untuk **Universitas Gajayana Malang (UNIGAMALANG)**.
Menggunakan Google Sheets sebagai database dan Google Drive untuk penyimpanan file.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons
- **Auth**: NextAuth.js (Credentials Provider, JWT strategy)
- **Database**: Google Sheets API v4
- **Storage**: Google Drive API v3
- **QR Code**: qrcode + qrcode.react

## Fitur

### Peran & Akses
| Role | Akses |
|------|-------|
| **Staff** | Lihat inventaris, ajukan pengadaan, upload foto nota |
| **Approver** | Setujui/tolak pengadaan |
| **Admin** | CRUD inventaris, kelola pengguna, selesaikan pengadaan |

### Modul
- **Dashboard**: Statistik inventaris & pengadaan
- **Inventaris**: CRUD barang dengan auto-ID `UGMALANG-INV-[YEAR]-[001]`
- **Pengadaan**: Form pengajuan + upload nota ke Google Drive
- **Persetujuan**: Dashboard approval untuk Approver/Admin
- **Pengguna**: Manajemen user (Admin only)
- **Detail Item**: Halaman publik untuk scan QR code
- **Print Label**: Cetak stiker 5cm x 3cm (Logo + Nama + ID + QR)

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

Karena belum ada user, tambahkan baris pertama di sheet **Users** secara manual:

1. Buka Google Spreadsheet
2. Di sheet **Users**, isi baris pertama:
   - Name: `Admin`
   - Email: `admin@unigamalang.ac.id`
   - Password: *(hash bcrypt, generate di https://bcrypt-generator.com/)*
   - Role: `Admin`

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
│   │   ├── inventory/            # CRUD inventaris
│   │   ├── procurement/          # CRUD pengadaan
│   │   ├── upload/               # Upload file ke Drive
│   │   └── users/                # CRUD pengguna
│   ├── dashboard/
│   │   ├── inventory/            # Halaman inventaris
│   │   ├── procurement/          # Halaman pengadaan
│   │   ├── approvals/            # Halaman persetujuan
│   │   └── users/                # Halaman kelola user
│   ├── item/[id]/                # Detail item (public)
│   └── login/                    # Halaman login
├── components/
│   ├── LoadingSpinner.tsx
│   ├── Providers.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── google.ts                 # Google Sheets/Drive helpers
│   └── session.ts                # Server-side session helpers
├── types/
│   ├── index.ts                  # Type definitions
│   └── next-auth.d.ts            # NextAuth type augmentation
└── middleware.ts                  # Role-based route protection
```
