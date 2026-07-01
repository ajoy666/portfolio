# Backend Scaffold — Portfolio API

## Stack
- Laravel 11
- Laravel Sanctum (auth)
- Storage: `public` disk (local, bisa diganti S3 nanti)

---

## Setup

```bash
composer create-project laravel/laravel backend
cd backend

# Install Sanctum
composer require laravel/sanctum
php artisan install:api

# Copy semua file scaffold ke project
# Lalu jalankan migration
php artisan migrate

# Buat storage symlink
php artisan storage:link

# Buat admin user pertama
php artisan tinker
> \App\Models\User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password')]);
```

---

## Struktur File yang Perlu Dikopy

```
database/migrations/    → semua file migration
app/Models/             → pisahkan dari _all_models.php ke file masing-masing
app/Http/Resources/     → pisahkan dari _all_resources.php ke file masing-masing
app/Http/Controllers/Api/ → semua controller
routes/api.php          → replace file routes/api.php
```

> Catatan: File `_all_models.php` dan `_all_resources.php` digabung untuk kemudahan baca.
> Saat copy ke project, pisah ke file masing-masing sesuai nama class-nya.

---

## CORS (penting untuk React)

Di `config/cors.php`:
```php
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
// atau pakai wildcard untuk dev: ['*']
```

---

## Endpoints Summary

### Public (no auth)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/v1/about` | Data profil + CV URL |
| GET | `/api/v1/skills` | Skills grouped by category |
| GET | `/api/v1/social-links` | Social links aktif |
| GET | `/api/v1/projects` | Projects published |
| GET | `/api/v1/projects/{slug}` | Detail project + screenshots |
| POST | `/api/v1/contact` | Submit form contact |
| POST | `/api/v1/auth/login` | Login dashboard |

### Admin (Bearer token)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/v1/admin/auth/me` | Info user login |
| POST | `/api/v1/admin/auth/logout` | Logout |
| PUT | `/api/v1/admin/about` | Update profil |
| POST | `/api/v1/admin/about/cv` | Upload CV (PDF) |
| DELETE | `/api/v1/admin/about/cv` | Hapus CV |
| GET/POST/PUT/DELETE | `/api/v1/admin/projects` | CRUD projects |
| POST | `/api/v1/admin/projects/{id}/screenshots` | Upload screenshots |
| PATCH | `/api/v1/admin/projects/{id}/screenshots/reorder` | Reorder screenshots |
| PATCH | `/api/v1/admin/screenshots/{id}/thumbnail` | Set thumbnail |
| DELETE | `/api/v1/admin/screenshots/{id}` | Hapus screenshot |
| GET/POST/PUT/DELETE | `/api/v1/admin/skills` | CRUD skills |
| GET/POST/PUT/DELETE | `/api/v1/admin/skill-categories` | CRUD kategori skill |
| GET/POST/PUT/DELETE | `/api/v1/admin/social-links` | CRUD social links |
| GET | `/api/v1/admin/contacts` | List pesan masuk |
| GET | `/api/v1/admin/contacts/{id}` | Detail pesan (auto-read) |
| PATCH | `/api/v1/admin/contacts/{id}/status` | Update status pesan |
| DELETE | `/api/v1/admin/contacts/{id}` | Hapus pesan |
```