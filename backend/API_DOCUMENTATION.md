# RoadRescue API Documentation

All routes are prefixed with `/api`.

---

## Authentication Endpoints

### 1. Register User
* **Method:** `POST`
* **Route:** `/auth/register`
* **Authentication Required:** No
* **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@gmail.com",
    "phone": "9876543210",
    "password": "Password123",
    "vehicleType": "Sedan",
    "vehicleNumber": "MH-12-XX-1234",
    "emergencyContact": "9876543211"
  }
  ```
* **Example Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-a1b2c3d4",
      "name": "John Doe",
      "email": "johndoe@gmail.com",
      "phone": "9876543210",
      "role": "user"
    }
  }
  ```
* **Possible Errors:**
  * `400 Bad Request` (Validation errors, e.g. email invalid, phone incorrect format).
  * `409 Conflict` (Email already exists).

### 2. Register Mechanic
* **Method:** `POST`
* **Route:** `/auth/mechanic/register`
* **Authentication Required:** No
* **Request Body:**
  ```json
  {
    "name": "Amit Patel",
    "email": "amit@roadrescue.in",
    "phone": "9876543212",
    "password": "Password123",
    "experienceYears": 8,
    "specialization": "Battery & Electrical"
  }
  ```
* **Example Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Registration successful. Your account is pending admin approval.",
    "mechanic": {
      "id": "mech-e5f6g7h8",
      "name": "Amit Patel",
      "email": "amit@roadrescue.in",
      "phone": "9876543212",
      "role": "mechanic",
      "status": "pending"
    }
  }
  ```
* **Possible Errors:**
  * `400 Bad Request` (Validation errors, e.g., missing fields).
  * `409 Conflict` (Email already exists).

### 3. User Login
* **Method:** `POST`
* **Route:** `/auth/login`
* **Authentication Required:** No
* **Request Body:**
  ```json
  {
    "email": "johndoe@gmail.com",
    "password": "Password123"
  }
  ```
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "user-a1b2c3d4",
      "name": "John Doe",
      "email": "johndoe@gmail.com",
      "phone": "9876543210",
      "vehicle_type": "Sedan",
      "vehicle_number": "MH-12-XX-1234",
      "profileImage": null,
      "role": "user"
    }
  }
  ```
* **Possible Errors:**
  * `401 Unauthorized` (Invalid email or password).
  * `403 Forbidden` (Account blocked, inactive, or pending).

### 4. Refresh Token
* **Method:** `POST`
* **Route:** `/auth/refresh`
* **Authentication Required:** No (requires refresh token in body)
* **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully.",
    "token": "eyJhbGciOiJIUzI1Ni...",
    "refreshToken": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
* **Possible Errors:**
  * `401 Unauthorized` (Revoked, blacklisted, or expired refresh token).

### 5. Logout
* **Method:** `POST`
* **Route:** `/auth/logout`
* **Authentication Required:** No (requires refresh token in body)
* **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logout successful."
  }
  ```

### 6. Get Current User (`/auth/me`)
* **Method:** `GET`
* **Route:** `/auth/me`
* **Authentication Required:** Yes (Bearer JWT)
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "user-a1b2c3d4",
      "name": "John Doe",
      "email": "johndoe@gmail.com",
      "phone": "9876543210",
      "role": "user",
      "vehicle_type": "Sedan",
      "vehicle_number": "MH-12-XX-1234",
      "status": "active",
      "profileImage": "/uploads/profile/profile-12345.png",
      "address": "123 Street",
      "city": "Ahmedabad",
      "vehicle": "Sedan"
    }
  }
  ```
* **Possible Errors:**
  * `401 Unauthorized` (Missing/expired token).

### 7. Update User Profile
* **Method:** `PUT`
* **Route:** `/auth/profile`
* **Authentication Required:** Yes (Bearer JWT)
* **Request Body:**
  ```json
  {
    "name": "Johnathan Doe",
    "phone": "9876543210",
    "address": "456 New Road",
    "city": "Mumbai",
    "vehicle": "SUV"
  }
  ```
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "user": {
      "id": "user-a1b2c3d4",
      "name": "Johnathan Doe",
      "email": "johndoe@gmail.com",
      "phone": "9876543210",
      "vehicle_type": "Sedan",
      "vehicle_number": "MH-12-XX-1234",
      "profileImage": null,
      "address": "456 New Road",
      "city": "Mumbai",
      "vehicle": "SUV"
    }
  }
  ```
* **Possible Errors:**
  * `401 Unauthorized` (Missing/expired token).
  * `400 Bad Request` (Validation errors).

### 8. Upload Profile Image
* **Method:** `POST`
* **Route:** `/auth/profile/image`
* **Authentication Required:** Yes (Bearer JWT)
* **Request Body:** Multipart/Form-data with field `profileImage` containing image file.
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile image uploaded successfully.",
    "imageUrl": "/uploads/profile/profile-1720642055-a1b2c3d4.png"
  }
  ```

### 9. Change Password
* **Method:** `PUT`
* **Route:** `/auth/change-password`
* **Authentication Required:** Yes (Bearer JWT)
* **Request Body:**
  ```json
  {
    "oldPassword": "Password123",
    "newPassword": "NewPassword123"
  }
  ```
* **Example Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password changed successfully."
  }
  ```
* **Possible Errors:**
  * `400 Bad Request` (Incorrect old password or validation errors).

---

## Admin Endpoints (All require admin Bearer JWT)

### 1. Dashboard Stats
* **Method:** `GET`
* **Route:** `/admin/dashboard`

### 2. User Management (CRUD)
* **List Users:** `GET /admin/users`
* **Get User:** `GET /admin/users/:id`
* **Update User Status:** `PUT /admin/users/:id` (Body: `{ "status": "blocked" | "active" | "inactive" }`)
* **Delete User:** `DELETE /admin/users/:id`

### 3. Mechanic Management (Approval workflow)
* **List Mechanics:** `GET /admin/mechanics`
* **Approve/Reject/Block Mechanic:** `PUT /admin/mechanics/:id` (Body: `{ "approval_status": "approved" | "rejected" | "blocked" }`)
* **Delete Mechanic:** `DELETE /admin/mechanics/:id`

---

## Bookings Endpoints

* **Create Booking:** `POST /api/bookings` (Auth Required)
* **List Bookings:** `GET /api/bookings` (Filtered: Users see own, Mechanics see assigned, Admins see all)
* **Get Booking Details:** `GET /api/bookings/:id` (Filtered ownership check)
* **Update Booking Status:** `PUT /api/bookings/:id` (Users can only Cancel; Mechanics can accept/complete; Admins can edit everything)
* **Delete Booking:** `DELETE /api/bookings/:id` (Admin Only)

---

## Chat & emergency Endpoints

* **Create Conversation:** `POST /api/chat/conversations`
* **Get Conversations:** `GET /api/chat/conversations` (Filtered)
* **Get Messages:** `GET /api/chat/conversations/:id/messages`
* **Send AI Chat message:** `POST /api/chat/chat` (Streaming connection)
* **Image Diagnostics:** `POST /api/chat/analyze-image`
* **Create Emergency (SOS):** `POST /api/emergency` (Public/User access allowed)
* **Emergency Management:** `GET /api/emergency`, `POST /api/emergency/assign`, `POST /api/emergency/status` (Admin Only)
