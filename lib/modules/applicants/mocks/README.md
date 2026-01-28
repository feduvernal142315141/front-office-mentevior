# 🎭 Applicants Mock Data

This directory contains **temporary mock data** to test the Applicants UI before backend endpoints are ready.

---

## 📦 Mock Data Included

### `applicants.mock.ts`
- **5 realistic applicant records** with complete data
- Different certifications: BCBA, BCaBA, RBT
- Mix of read/unread statuses
- Complete professional experiences, references, languages, availability
- Document attachments simulation

---

## 🚀 How to Remove Mocks and Connect to Real Backend

When the backend endpoints are ready, follow these steps:

### Step 1️⃣: Update Service File
Open: `lib/modules/applicants/services/applicants.service.ts`

**Change this:**
```typescript
const USE_MOCK_DATA = true // Set to false when backend is ready
```

**To this:**
```typescript
const USE_MOCK_DATA = false // Backend is now ready!
```

### Step 2️⃣: (Optional) Delete Mock Files
Once everything works with the real backend, you can delete:
- `lib/modules/applicants/mocks/applicants.mock.ts`
- `lib/modules/applicants/mocks/README.md`

And remove mock imports from:
```typescript
// Delete these lines from applicants.service.ts
import { MOCK_APPLICANTS, delay, filterApplicants, filterByReadStatus, sortApplicants } from "../mocks/applicants.mock"

const USE_MOCK_DATA = false
let mockApplicantsState = [...MOCK_APPLICANTS]

// Delete all blocks marked with:
// ============================================================================
// MOCK IMPLEMENTATION - DELETE THIS BLOCK WHEN BACKEND IS READY
// ============================================================================
```

---

## 🔌 Required Backend Endpoints

### 1. Get Applicants (Paginated)
```
GET /applicants?page=1&pageSize=10&filters[]=...
```

**Response:**
```json
{
  "entities": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "emailAddress": "john@example.com",
      "phoneNumber": "(555) 123-4567",
      "currentCertification": "BCBA",
      "licenseNumber": "FL-BCBA-12345",
      "licenseExpirationDate": "2025-12-31",
      "isRead": false,
      "createdAt": "2024-01-26T10:00:00Z",
      // ... all other fields from Applicant type
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

### 2. Get Single Applicant
```
GET /applicants/:id
```

**Response:**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  // ... all applicant fields
}
```

### 3. Mark as Read
```
PUT /applicants/:id/mark-as-read
```

**Request Body:**
```json
{
  "applicantId": "uuid",
  "isRead": true
}
```

**Response:**
```json
{
  "message": "Applicant marked as read successfully"
}
```

---

## 📝 Notes

- Mock data includes realistic ABA/therapy industry information
- All dates are in ISO 8601 format
- Phone numbers follow US format
- Documents are placeholder URLs (#)
- Applicants are sorted by creation date (newest first)
- Search filters work on firstName, lastName, and emailAddress
- Status filters work on isRead field

---

## 🧪 Testing Features with Mock

You can test:
- ✅ Table listing with pagination
- ✅ Search by name/email
- ✅ Filter by read/unread status
- ✅ View applicant details
- ✅ Auto-mark as read when viewing
- ✅ Badge "NEW" for unread applicants
- ✅ Bold text for unread applicants
- ✅ Loading states
- ✅ Empty states
- ✅ All form sections in detail view
- ✅ Document downloads (simulated)
- ✅ Professional experiences (multiple)
- ✅ Professional references (multiple)
- ✅ Languages with proficiency levels
- ✅ Availability grid

---

**Created by:** AI Assistant  
**Purpose:** Temporary mock data for UI development  
**Status:** 🟡 Active - Remove when backend is ready
