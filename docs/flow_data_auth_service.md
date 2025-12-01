# Flow Data Auth Service

Berdasarkan analisis kode, berikut adalah flow data lengkap dari auth service mulai dari user di frontend sampai selesai:

## Arsitektur Umum
- **Frontend**: Menggunakan Firebase Authentication SDK
- **Backend**: Auth service (port 3001) + Supabase database
- **API Gateway**: Mengekspos endpoint `/auth/*` dan proxy ke auth service
- **Authentication**: Firebase ID tokens (tidak menggunakan JWT custom)
- **Authorization**: Role-based (hanya admin yang bisa akses auth, siswa menggunakan course registration)
- **Runtime**: Semua service berjalan di Docker dengan Bun

## Flow Register Admin

1. **Frontend**: User mengisi form register (email, password, full_name, role: 'admin')
2. **Firebase Auth**: FE menggunakan `createUserWithEmailAndPassword()` untuk create user di Firebase
3. **Firebase Token**: Firebase return ID token via `user.getIdToken()`
4. **API Request**: FE kirim `POST /auth/register` dengan body:
   ```json
   {
     "idToken": "firebase_id_token",
     "full_name": "Nama Lengkap",
     "role": "admin",
     "phone_number": "optional",
     // ... other fields
   }
   ```
5. **API Gateway**: Proxy request ke auth service `/api/auth/register`
6. **Auth Service Processing**:
   - Validate input dengan Zod schema
   - Verify Firebase ID token menggunakan Firebase Admin SDK
   - Extract email dan firebase_uid dari token
   - Cek user sudah ada di `supabase.users` table by email (return 409 jika ada)
   - Create user di Supabase Auth menggunakan `supabase.auth.admin.createUser()`
   - Insert record ke `supabase.users` table dengan data lengkap
   - Publish event `user.registered` ke Kafka
7. **Response**: Return success dengan:
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "firebase_id_token", // sama dengan input
       "refreshToken": null,
       "user": { id, email, full_name, role, ... }
     }
   }
   ```

## Flow Login Admin

1. **Frontend**: User input email/password
2. **Firebase Auth**: FE menggunakan `signInWithEmailAndPassword()`, dapat ID token
3. **API Request**: FE kirim `POST /auth/login` dengan:
   ```json
   { "idToken": "firebase_id_token" }
   ```
4. **API Gateway**: Proxy ke auth service `/api/auth/login`
5. **Auth Service Processing**:
   - Verify Firebase token
   - Query `supabase.users` by email
   - Validasi role === 'admin' (return 403 jika bukan admin)
   - Update `last_login_at` di database
   - Publish event `user.logged_in` ke Kafka
6. **Response**: Return accessToken dan user data

## Flow Protected Routes (Admin Operations)

1. **Frontend**: Kirim request dengan header:
   ```
   Authorization: Bearer <firebase_id_token>
   ```
2. **API Gateway**:
   - `authMiddleware` verify Firebase token
   - Query `supabase.users` by `firebase_uid`
   - Attach user data ke context
   - `requireRole(['admin'])` cek role
3. **Proxy**: Forward ke service tujuan (admin, course, booking, dll.)
4. **Response**: Data dari service tujuan

## Flow Logout

1. **Frontend**: Kirim `POST /auth/logout` dengan Bearer token
2. **Auth Service**:
   - Verify token via middleware
   - Publish `user.logged_out` event ke Kafka
   - Return success (Firebase logout di-handle client-side)

## Flow Get Current User

1. **Frontend**: `GET /auth/me` dengan Bearer token
2. **Auth Service**: Middleware verify token, return user data dari context

## Error Handling
- **401**: Invalid/expired token, user not found
- **403**: Insufficient permissions (not admin)
- **409**: Duplicate email/phone
- **400**: Validation error
- **500**: Server error

## Keamanan & Fitur Khusus
- Firebase tokens auto-refresh via SDK
- Tidak ada server-side token refresh endpoint
- Token diverifikasi pada setiap request
- Events dipublish ke Kafka untuk monitoring
- Rollback mechanism jika gagal create di Supabase
- CORS configured untuk production

## Catatan Penting
- Auth service **hanya untuk admin**. Siswa menggunakan `/booking/register-course` di booking service
- Semua data tersimpan di Supabase schema `auth.*` dan `users` table
- Testing menggunakan data real dari Supabase remote
- Services berjalan di Docker, config via `docker-compose.yml`