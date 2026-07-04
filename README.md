# 🎖️ Kostum Paskibra — Sewa & Jahit Kostum

Website penyewaan dan pembuatan kostum paskibra. Foto & detail produk dikelola
lewat **dashboard admin** dan langsung tampil di **landing page**.

Arsitektur **terpisah** frontend & backend:

```
┌────────────────────────┐      HTTP/JSON      ┌────────────────────────┐
│  Frontend (React+Vite)  │  ───────────────▶  │  Backend (Go REST API)  │  ──▶  MySQL (Laragon)
│  http://localhost:5173  │   proxy /api,/uploads  │  http://localhost:8080  │       db: kostum_paskibra
└────────────────────────┘  ◀───────────────  └────────────────────────┘
```

- **Backend:** Go (net/http, routing bawaan Go 1.22) + MySQL (`go-sql-driver/mysql`)
- **Frontend:** React 18 + React Router + Vite (dev server nge-proxy ke Go → "sinkron" & bebas CORS)
- **Database:** MySQL di Laragon (dibuat & migrasi otomatis saat backend start)
- **Desain:** modern, elegan, responsive (tema Merah-Putih Indonesia)

## Prasyarat

- **Laragon** dengan **MySQL berjalan** (default: user `root`, tanpa password)
- **Go 1.22+** — https://go.dev/dl/
- **Node.js 18+** & npm (Laragon sudah menyertakan Node)

## Menjalankan (dev)

Cara cepat — dari folder `d:\kostum`:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Atau manual, di **dua terminal**:

**Terminal 1 — Backend**
```powershell
cd d:\kostum\backend
go run .
```
Backend otomatis: membuat database `kostum_paskibra`, migrasi tabel, dan mengisi 4 produk contoh.

**Terminal 2 — Frontend**
```powershell
cd d:\kostum\frontend
npm install   # sekali saja
npm run dev
```

Buka:
- **Website** → http://localhost:5173
- **Admin** → http://localhost:5173/admin — login `admin` / `admin123`

## Build produksi

```powershell
# Frontend → menghasilkan folder dist/ (file statis)
cd d:\kostum\frontend && npm run build

# Backend → binary tunggal
cd d:\kostum\backend && go build -o backend.exe .
```
Sajikan `frontend/dist/` lewat web server / reverse proxy, arahkan `/api` & `/uploads` ke backend.

## REST API

| Method | Endpoint                | Akses  | Keterangan                     |
|--------|-------------------------|--------|--------------------------------|
| POST   | `/api/auth/login`       | publik | login → `{ token }`            |
| POST   | `/api/auth/logout`      | admin  | logout                         |
| GET    | `/api/products`         | publik | daftar (filter `?kategori=`)   |
| GET    | `/api/products/{id}`    | publik | detail                         |
| POST   | `/api/products`         | admin  | tambah                         |
| PUT    | `/api/products/{id}`    | admin  | ubah                           |
| DELETE | `/api/products/{id}`    | admin  | hapus                          |
| POST   | `/api/upload`           | admin  | upload foto (multipart `foto`) |
| POST   | `/api/messages`         | publik | kirim pesan kontak             |
| GET    | `/api/messages`         | admin  | daftar pesan                   |
| DELETE | `/api/messages/{id}`    | admin  | hapus pesan                    |

Autentikasi admin: kirim header `Authorization: Bearer <token>`.

## Konfigurasi

Backend membaca environment variable (lihat `backend/.env.example`). Default cocok
untuk Laragon. Contoh mengganti password DB & admin (PowerShell):

```powershell
$env:DB_PASS = "passwordku"; $env:ADMIN_PASS = "rahasia"; go run .
```

## Struktur Proyek

```
kostum/
├── backend/                 # Go REST API + MySQL
│   ├── main.go              # routing, CORS, konfigurasi
│   ├── handlers.go          # handler JSON, auth (bearer token), upload
│   ├── db.go                # koneksi MySQL, migrasi, query, seed
│   ├── models.go            # struct Product & Message
│   ├── .env.example
│   └── uploads/             # foto produk (dibuat otomatis)
├── frontend/                # React + Vite
│   ├── vite.config.js       # proxy /api & /uploads → :8080
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── api.js           # klien fetch + token
│       ├── styles.css       # desain modern responsive
│       ├── components/AdminLayout.jsx
│       └── pages/           # Landing, AdminLogin, AdminDashboard, AdminProductForm
├── start-dev.ps1            # jalankan backend + frontend sekaligus
└── README.md
```

## Catatan Keamanan (produksi)

- Ganti `ADMIN_PASS` & set password MySQL.
- Jalankan di belakang HTTPS; batasi `CORS_ORIGIN` ke domain frontend.
- Password admin saat ini dibandingkan plain — untuk produksi gunakan hash (bcrypt).
