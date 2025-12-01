# Flow Admin: Penjadwalan Instructor untuk Course

## Overview

Dokumentasi ini menjelaskan **flow lengkap** penjadwalan instructor dari sisi admin, termasuk penentuan ruang, hari, waktu, dan aspek terkait course serta pendaftaran siswa. Sistem menggunakan arsitektur microservices dengan **Admin Service** sebagai pusat kontrol untuk mengelola semua aspek penjadwalan.

### Arsitektur Sistem

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │    │  API Gateway    │    │  Admin Service  │
│                 │────│                 │────│                 │
│ - Dashboard     │    │ - Routing       │    │ - User Mgmt     │
│ - Management    │    │ - Auth          │    │ - Course Mgmt   │
│ - Scheduling    │    │ - Load Balance  │    │ - Schedule Mgmt │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (Supabase)    │
                    │                 │
                    │ - Users         │
                    │ - Courses       │
                    │ - Rooms         │
                    │ - Schedules     │
                    │ - Bookings      │
                    └─────────────────┘
```

### Services Yang Terlibat

- **Admin Service** (`admin/`): Pusat kontrol admin operations
- **Auth Service** (`auth/`): User management dan authentication
- **Course Service** (`course/`): Course dan instruktur management
- **Booking Service** (`booking/`): Schedule dan availability management
- **API Gateway** (`api-gateway/`): Routing dan orchestration

## Prerequisites

### Akses Admin

1. **Login sebagai Admin**
   ```bash
   # Gunakan akun admin untuk testing
   Email: k423@gmail.com
   Password: Kiana423
   ```

2. **API Base URL**
   ```
   Development: http://localhost:3000/api/admin
   Production: https://api.shemamusic.com/api/admin
   ```

3. **Authentication**
   - Semua endpoint admin memerlukan `Authorization: Bearer <token>`
   - Token didapat dari login admin

## Flow Step-by-Step: Penjadwalan Instructor

### Step 1: Admin Login ke Sistem

**Deskripsi:** Admin melakukan login untuk mendapatkan akses ke panel admin.

**Endpoint:** `POST /api/auth/login`
```
Content-Type: application/json

{
  "email": "k423@gmail.com",
  "password": "Kiana423"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-admin-token",
    "user": {
      "id": "admin-uuid",
      "email": "k423@gmail.com",
      "role": "admin"
    }
  }
}
```

### Step 2: Buat Instruktur Baru (jika belum ada)

**Deskripsi:** Admin membuat akun instruktur baru dengan spesialisasi dan detail yang diperlukan.

**Endpoint:** `POST /api/admin/instructor`
```
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "instructor@example.com",
  "full_name": "Jane Smith",
  "phone_number": "+628123456789",
  "wa_number": "+628123456789",
  "bio": "Experienced music instructor",
  "specialization": "Guitar, Piano"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-instructor",
      "email": "instructor@example.com",
      "full_name": "Jane Smith",
      "role": "instructor"
    },
    "profile": {
      "user_id": "uuid-instructor",
      "full_name": "Jane Smith",
      "email": "instructor@example.com",
      "wa_number": "+628123456789",
      "bio": "Experienced music instructor",
      "specialization": "Guitar, Piano",
      "created_at": "2025-12-02T10:00:00Z"
    },
    "message": "Instructor created successfully"
  }
}
```

**Endpoint CRUD Instructor Lengkap:**

| Method | Endpoint | Deskripsi |
|--------|----------|----------|
| GET | `/api/admin/instructor` | List semua instructor (dengan pagination) |
| GET | `/api/admin/instructor/:id` | Get instructor by user_id |
| POST | `/api/admin/instructor` | Create instructor baru |
| PUT | `/api/admin/instructor/:id` | Update instructor |
| DELETE | `/api/admin/instructor/:id` | Delete instructor |

### Step 3: Buat atau Pilih Room untuk Kelas

**Deskripsi:** Admin memastikan room tersedia untuk jadwal kelas. Jika belum ada, buat room baru.

**Endpoint:** `POST /api/admin/rooms` (jika membuat baru)
```
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Studio A",
  "capacity": 5,
  "location": "Floor 1",
  "equipment": ["Piano", "Microphone", "Amplifier"],
  "description": "Main practice room with full equipment"
}
```

**Atau lihat daftar room yang ada:** `GET /api/admin/rooms`

### Step 4: Setup Availability Room

**Deskripsi:** Admin mengatur jadwal availability room agar sesuai dengan operasional.

**Endpoint:** `POST /api/admin/rooms/{room_id}/availability`
```
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "schedule": [
    {
      "day_of_week": "monday",
      "start_time": "09:00",
      "end_time": "17:00",
      "is_available": true
    },
    {
      "day_of_week": "wednesday",
      "start_time": "09:00",
      "end_time": "17:00",
      "is_available": true
    }
  ]
}
```

### Step 5: Buat Course dan Assign Instructor

**Deskripsi:** Admin membuat course baru dan langsung assign instructor yang telah dibuat.

**Endpoint:** `POST /api/course`
```
X-Gateway-Request: true
X-User-Role: admin
Content-Type: application/json

{
  "name": "Piano Beginner Course",
  "description": "Learn basic piano skills",
  "instrument": "piano",
  "level": "beginner",
  "duration_weeks": 12,
  "sessions_per_week": 2,
  "price": 1500000,
  "instructor_id": "uuid-instructor",
  "max_students": 5,
  "prerequisites": "No prior experience needed",
  "objectives": ["Basic piano techniques", "Simple songs"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "course_id": "uuid-course",
    "name": "Piano Beginner Course",
    "instructor_id": "uuid-instructor",
    "created_at": "2025-11-30T10:00:00Z"
  }
}
```

### Step 6: Buat Class Schedule untuk Course

**Deskripsi:** Admin membuat jadwal kelas dengan assign instructor dan room untuk course yang telah dibuat.

**Endpoint:** `POST /api/admin/schedules`
```
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "course_id": "uuid-course",
  "instructor_id": "uuid-instructor",
  "room_id": "uuid-room",
  "schedule": [
    {
      "day_of_week": "monday",
      "start_time": "14:00",
      "end_time": "15:30",
      "duration": 90
    },
    {
      "day_of_week": "wednesday",
      "start_time": "14:00",
      "end_time": "15:30",
      "duration": 90
    }
  ],
  "start_date": "2025-12-01",
  "end_date": "2025-12-31",
  "max_students": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule_id": "uuid-schedule",
    "course_id": "uuid-course",
    "instructor_id": "uuid-instructor",
    "room_id": "uuid-room",
    "schedule": [...],
    "created_at": "2025-11-30T10:00:00Z"
  }
}
```

### Step 7: Monitor Pendaftaran Siswa

**Deskripsi:** Admin memantau pendaftaran siswa yang masuk untuk course.

**Endpoint:** `GET /api/admin/courses` (untuk melihat daftar course dan status pendaftaran)

**Atau:** `GET /api/admin/dashboard` (untuk overview)

### Step 8: Approve/Reject Pendaftaran Siswa

**Deskripsi:** Ketika siswa mendaftar course, admin menyetujui atau menolak pendaftaran berdasarkan availability dan kriteria lain.

**Endpoint Approve:** `POST /api/admin/courses/{course_id}/approve`
```
Authorization: Bearer <admin_token>
```

**Endpoint Reject:** `POST /api/admin/courses/{course_id}/reject`
```
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Room not available at requested time"
}
```

### Step 9: Update Schedule jika Diperlukan

**Deskripsi:** Jika ada perubahan jadwal atau instructor, admin dapat mengupdate schedule yang sudah dibuat.

**Endpoint:** `PUT /api/admin/schedules/{schedule_id}`
```
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "room_id": "new-room-uuid",
  "instructor_id": "new-instructor-uuid",
  "schedule": [
    {
      "day_of_week": "tuesday",
      "start_time": "15:00",
      "end_time": "16:30"
    }
  ]
}
```

### Step 10: Monitor dan Manage Bookings

**Deskripsi:** Admin memantau bookings yang telah dikonfirmasi dan mengelola jika ada perubahan.

**Endpoint:** `GET /api/admin/bookings`

**Untuk confirm booking:** `POST /api/booking/{id}/confirm`

**Untuk cancel booking:** `POST /api/booking/{id}/cancel`

## Data Flow dan Relationships

```
Users (Instructor)
├── instructor_profiles
└── courses (assigned to)

Courses
├── instructor_id → Users
├── class_schedules
└── enrollments

Rooms
├── room_availability
└── class_schedules (assigned to)

Class Schedules
├── course_id → Courses
├── instructor_id → Users
├── room_id → Rooms
├── day_of_week, start_time, end_time
└── bookings (student slots)
```

## Real-time Updates

Ketika admin melakukan perubahan:
1. Database updated
2. Kafka events published (jika ada)
3. WebSocket notifications sent to frontend
4. Frontend updates availability display
5. Siswa mendapat notifikasi perubahan jadwal

## Error Handling

### Common Errors:
- **INSTRUCTOR_NOT_AVAILABLE**: Instructor sudah memiliki jadwal di waktu tersebut
- **ROOM_NOT_AVAILABLE**: Room sudah dipesan di waktu tersebut
- **SCHEDULE_CONFLICT**: Konflik jadwal dengan schedule lain
- **COURSE_NOT_FOUND**: Course ID tidak valid
- **AUTH_INSUFFICIENT_PERMISSIONS**: User bukan admin

### Conflict Resolution:
1. Check availability sebelum assign
2. Use conflict detection service
3. Suggest alternative times/rooms
4. Manual override untuk admin

## Testing Flow

Untuk testing flow ini:
1. Gunakan akun admin: k423@gmail.com / Kiana423
2. Buat instruktur baru
3. Buat course dengan instructor_id
4. Buat schedule via POST /api/admin/schedules
5. Daftar sebagai siswa
6. Approve dari admin
7. Verify booking created

## Notes

- Endpoint `POST /api/admin/schedules` mungkin belum diimplementasi di kode saat ini, tapi didokumentasikan untuk future implementation
- Schedule bisa juga dibuat otomatis saat course di-approve dengan siswa pertama
- Admin dapat mengubah instructor/room pada schedule kapan saja
- Semua perubahan akan trigger real-time updates ke frontend