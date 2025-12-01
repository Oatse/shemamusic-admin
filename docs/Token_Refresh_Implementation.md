# Token Refresh Implementation

## Overview
Implementasi automatic token refresh untuk Firebase authentication. Sistem ini memastikan bahwa token tidak akan invalid karena expired, dengan secara otomatis merefresh token ketika diperlukan.

## Endpoint
- **Method**: `POST`
- **URL**: `/api/auth/refresh`
- **Base URL**: `https://api.shemamusic.my.id`

## Implementasi

### File: `src/services/api.ts`

Token refresh diimplementasikan menggunakan Axios interceptor pada response level.

#### Cara Kerja:

1. **Request Interceptor**: Menambahkan token ke header `Authorization: Bearer {token}` untuk setiap request

2. **Response Interceptor**: 
   - Mendeteksi ketika server mengembalikan status `401 (Unauthorized)`
   - Otomatis memanggil endpoint `/api/auth/refresh`
   - Menyimpan token baru ke `localStorage`
   - Mengulangi request yang gagal dengan token baru

3. **Queue Management**:
   - Menangani multiple requests yang terjadi secara bersamaan
   - Mencegah multiple refresh token requests
   - Semua pending requests akan ditunggu sampai token baru diterima

4. **Fallback**:
   - Jika refresh token gagal, user akan di-redirect ke halaman login
   - Token dan user data dihapus dari localStorage

## Flow Diagram

```
Request API
    ↓
Token Valid?
    ├─ Yes → Response returned
    └─ No (401)
        ↓
   First time refresh?
        ├─ No → Queue request
        └─ Yes → Call /api/auth/refresh
             ↓
        Refresh Success?
             ├─ Yes → Save new token → Process queue → Retry original request
             └─ No → Clear storage → Redirect to login
```

## Token Storage
- **Key**: `token`
- **Storage**: `localStorage`
- **Format**: Firebase ID Token (JWT)

## User Data Storage
- **Key**: `user`
- **Storage**: `localStorage`
- **Format**: JSON string

## Error Handling

### Scenario 1: Token Expired
```
Original Request (with expired token)
    ↓ (401 response)
Automatic Refresh
    ↓ (success)
New Token Saved
    ↓
Original Request Retried (with new token)
    ↓
Success Response
```

### Scenario 2: Refresh Token Failed
```
Original Request (with expired token)
    ↓ (401 response)
Automatic Refresh
    ↓ (failed)
Clear localStorage
    ↓
Redirect to /login
```

## Code Example

Tidak perlu melakukan perubahan di setiap halaman/component. Semua API calls akan otomatis:
- Menambahkan token ke header
- Merefresh token jika expired
- Mengulangi request dengan token baru

```typescript
// Di component atau page
try {
  const response = await api.get('/api/instructors');
  // Jika token expired, sistem akan otomatis merefresh dan retry
  console.log(response.data);
} catch (error) {
  // Error hanya akan terjadi jika refresh juga gagal
  console.error(error);
}
```

## Testing

Untuk testing token refresh:

1. **Tunggu token expire** (dapat disesuaikan di backend)
2. **Buat API request** dengan token expired
3. **Sistem akan otomatis**:
   - Detect 401 response
   - Call refresh endpoint
   - Retry original request
   - Jika berhasil, request akan complete tanpa user notice

## Security Notes

- Token disimpan di `localStorage` (accessible dari JavaScript)
- Untuk production, pertimbangkan menggunakan `httpOnly` cookies
- Refresh token logic berjalan secara transparan untuk user
- Jika refresh gagal, user akan perlu login kembali

## Implementation Date
December 1, 2025

## Related Files
- `src/services/api.ts` - Axios configuration dengan refresh logic
- `src/pages/Login.tsx` - Login page yang menyimpan token
