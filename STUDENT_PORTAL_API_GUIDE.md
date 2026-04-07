# Student Portal - API Integration Guide

## 🔗 Complete API Reference

### Base URL
```
{VITE_API_URL}/api/v1
```

Default: `http://localhost:5000/api/v1`

Production: `https://your-sms-backend.com/api/v1`

## 📡 Endpoints Used

### 1. Dashboard
**Endpoint**: `GET /student/dashboard`

**Purpose**: Get overall student dashboard statistics

**Response**:
```json
{
  "data": {
    "attendance": {
      "present": 45,
      "total": 50,
      "percentage": 90
    },
    "assignments": {
      "pending": 3,
      "completed": 12,
      "total": 15
    },
    "exams": {
      "upcoming": 4,
      "completed": 8,
      "nextExam": "2026-04-20"
    },
    "announcements": {
      "unread": 2,
      "total": 25
    }
  }
}
```

**Integration**: `dashboardApi.getStudentStats()`

**Used In**: 
- `/dashboards/StudentDashboard.tsx`
- Dashboard overview section

---

### 2. Attendance
**Endpoint**: `GET /attendance/student/{studentId}`

**Purpose**: Fetch student's attendance records

**Query Parameters**:
- `month`: Optional, filter by month (YYYY-MM)
- `year`: Optional, filter by year

**Response**:
```json
{
  "data": [
    {
      "_id": "obj-id",
      "date": "2026-04-01",
      "status": "present",
      "remarks": null
    },
    {
      "_id": "obj-id",
      "date": "2026-04-02",
      "status": "absent",
      "remarks": "Sick leave"
    }
  ]
}
```

**Integration**: `attendanceApi.getByStudent(studentId)`

**Used In**: `/pages/StudentAttendance.tsx`

**Features**:
- Monthly filtering
- Status breakdown (present/absent/late/leave)
- Percentage calculation
- Alert for low attendance (<75%)

---

### 3. Results / Exams
**Endpoint**: `GET /results/student/{studentId}`

**Purpose**: Fetch student's exam results

**Query Parameters**:
- `examId`: Optional, filter by exam
- `status`: Optional (pass/fail)
- `sort`: Optional, sort order

**Response**:
```json
{
  "data": [
    {
      "_id": "result-id",
      "examId": "exam-id",
      "totalMarks": 100,
      "obtainedMarks": 85,
      "percentage": 85,
      "grade": "A",
      "status": "pass",
      "exam": {
        "name": "Mid Term",
        "examType": "theory",
        "startDate": "2026-03-15",
        "status": "completed",
        "isPublished": true
      },
      "subjectResults": [
        {
          "subjectName": "Mathematics",
          "marksObtained": 42,
          "maxMarks": 50,
          "grade": "A"
        }
      ]
    }
  ]
}
```

**Integration**: `examApi.getStudentResults(studentId, params)`

**Used In**: 
- `/pages/StudentResults.tsx`
- `/dashboards/StudentDashboard.tsx`

---

### 4. Fees / Payments
**Endpoint**: `GET /fees/student/{studentId}`

**Purpose**: Get student's fee structure and payment status

**Response**:
```json
{
  "data": [
    {
      "_id": "fee-id",
      "studentId": "student-id",
      "feeHead": "Tuition Fee",
      "amount": 10000,
      "paidAmount": 5000,
      "dueAmount": 5000,
      "dueDate": "2026-04-30",
      "frequency": "monthly",
      "status": "partial",
      "payments": [
        {
          "_id": "payment-id",
          "amount": 5000,
          "paymentDate": "2026-03-01",
          "paymentMode": "online",
          "transactionId": "TXN12345",
          "receiptNumber": "RCP001"
        }
      ]
    }
  ]
}
```

**Integration**: `feeApi.getStudentFees(studentId)`

**Used In**: 
- `/pages/StudentFeeManagement.tsx`
- `/dashboards/StudentDashboard.tsx`

**Additional Endpoints**:
- `feeApi.getPayments()` - Get payment history
- `feeApi.getReceipt(paymentId)` - Get receipt

---

### 5. Announcements
**Endpoint**: `GET /announcements`

**Purpose**: Fetch all announcements for students

**Query Parameters**:
- `audience`: Filter by audience (all, student, class)
- `published`: Filter by status (true/false)
- `type`: Filter by type (general, class, urgent, event)
- `priority`: Filter by priority (high, medium, low)

**Response**:
```json
{
  "data": [
    {
      "_id": "ann-id",
      "title": "Parent-Teacher Meeting",
      "description": "Meeting scheduled on April 15",
      "content": "Full announcement content here",
      "type": "event",
      "priority": "high",
      "audience": "all",
      "publishedDate": "2026-04-01T10:00:00Z",
      "expiryDate": "2026-04-30T23:59:59Z",
      "createdBy": "Admin Name",
      "attachments": [
        {
          "url": "/files/announcement-1.pdf",
          "name": "schedule.pdf"
        }
      ],
      "isRead": false
    }
  ]
}
```

**Integration**: `announcementApi.getAll(params)`

**Used In**: 
- `/pages/StudentAnnouncementsView.tsx`
- `/components/student/StudentAnnouncements.tsx`

---

### 6. Assignments
**Endpoint**: `GET /assignments`

**Purpose**: Fetch student's assignments

**Query Parameters**:
- `assignedTo`: Filter by student ID
- `status`: Filter by status (pending, submitted, late, graded)
- `subject`: Filter by subject
- `search`: Search by title

**Response**:
```json
{
  "data": [
    {
      "_id": "assignment-id",
      "title": "Mathematics Chapter 5",
      "subject": "Mathematics",
      "description": "Solve exercises 5.1 to 5.5",
      "dueDate": "2026-04-15T23:59:59Z",
      "assignedDate": "2026-04-01T10:00:00Z",
      "assignedBy": "Mr. Sharma",
      "status": "pending",
      "marks": {
        "obtained": null,
        "total": 20
      },
      "files": [
        {
          "url": "/files/assignment-1.pdf",
          "name": "problem-set.pdf"
        }
      ],
      "submissionDetails": {
        "submittedDate": null,
        "submittedFile": null
      }
    }
  ]
}
```

**Integration**: `assignmentApi.getAll(params)`

**Used In**: 
- `/pages/StudentAssignmentsView.tsx`
- `/components/student/StudentAssignments.tsx`

**Additional Endpoints**:
- `assignmentApi.submit(id, data)` - Submit assignment
- `assignmentApi.getSubmissions(id)` - Get submissions
- `assignmentApi.getById(id)` - Get single assignment

---

### 7. Timetable
**Endpoint**: `GET /timetable/class/{classId}/section/{sectionId}`

**Purpose**: Fetch class timetable

**Response**:
```json
{
  "data": {
    "_id": "timetable-id",
    "classId": "Class-X-A",
    "sectionId": "Section-A",
    "academicYear": "2025-2026",
    "days": [
      {
        "day": "Monday",
        "startTime": "08:00",
        "endTime": "08:45",
        "subject": "Mathematics",
        "teacher": "Mr. Sharma",
        "room": "A-101",
        "type": "lecture"
      },
      {
        "day": "Monday",
        "startTime": "08:45",
        "endTime": "09:30",
        "subject": "English",
        "teacher": "Ms. Gupta",
        "room": "A-102",
        "type": "lecture"
      }
    ]
  }
}
```

**Integration**: `timetableApi.getByClass(classId, sectionId)`

**Used In**: `/pages/StudentTimetableView.tsx`

---

### 8. Certificates
**Endpoint**: `GET /certificates/student/{studentId}`

**Purpose**: Get student's certificates

**Response**:
```json
{
  "data": [
    {
      "_id": "cert-id",
      "studentId": "student-id",
      "certificateType": "participation",
      "title": "Science Fair Participation",
      "issuedDate": "2026-03-20",
      "expiryDate": null,
      "certificateNumber": "CERT-2026-001",
      "downloadUrl": "/certificates/cert-001.pdf",
      "status": "issued",
      "description": "Participated in inter-school science fair"
    }
  ]
}
```

**Integration**: `certificateApi.getStudentCertificates(studentId)`

**Used In**: `/pages/StudentCertificates.tsx`

**Additional Endpoints**:
- `certificateApi.getById(id)` - Get certificate details
- `certificateApi.getAll()` - Get all certificates

---

### 9. Subjects
**Endpoint**: `GET /subjects` or `GET /subjects/class/{classId}`

**Purpose**: Get subjects for filtering and reference

**Integration**: `subjectApi.getAll()` or `subjectApi.getByClass(classId)`

**Used In**: 
- Study Materials filtering
- Assignments filtering
- Results display

---

## 🔐 Authentication

### Token Management
```javascript
// Access token stored in localStorage
localStorage.getItem('accessToken')

// Refresh token stored
localStorage.getItem('refreshToken')

// User info stored
localStorage.getItem('user')
```

### Request Headers
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Auto-Refresh Flow
```
Request fails with 401
↓
Interceptor catches error
↓
Send refresh token
↓
Get new access token
↓
Update localStorage
↓
Retry original request
```

---

## 📊 Error Handling

### API Response Format
```json
{
  "success": true/false,
  "data": {},
  "message": "Error message if applicable",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes
- `401`: Unauthorized (token expired/invalid)
- `403`: Forbidden (permission denied)
- `404`: Not Found (resource doesn't exist)
- `500`: Server Error

### Handling in Components
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: async () => {
    try {
      const response = await api.fetch();
      return response.data?.data || [];
    } catch (err) {
      // Automatically handled by React Query
      throw err;
    }
  },
});

if (error) {
  return <Alert>Failed to load data</Alert>;
}
```

---

## 🔄 Data Caching Strategy

### React Query Configuration
```typescript
{
  staleTime: 5 * 60 * 1000,      // Data valid for 5 minutes
  gcTime: 10 * 60 * 1000,        // Keep in cache for 10 minutes
  refetchOnWindowFocus: false,   // Don't refetch on window focus
  retry: 1,                       // Retry failed requests once
}
```

### Cache Keys
```typescript
// Format: [module, userId, filters]
['student-attendance', userId, month]
['student-assignments', userId, status]
['student-results', userId, examId]
['student-announcements', userId]
```

---

## 🚀 Performance Tips

### Optimize Data Fetching
1. Use query parameters to filter on backend
2. Don't fetch all data then filter client-side
3. Implement pagination for large datasets
4. Cache responses appropriately

### Example: Wrong
```typescript
// Fetches all assignments, filters client-side
const allAssignments = fetchAll();
const filtered = allAssignments.filter(a => a.status === 'pending');
```

### Example: Right
```typescript
// Backend filters by status
const response = await assignmentApi.getAll({ status: 'pending' });
```

---

## 📝 Testing API Calls

### Using Browser Console
```javascript
// Test API endpoint
const response = await fetch('/api/v1/student/dashboard', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
const data = await response.json();
console.log(data);
```

### Using React DevTools
1. Install React Query DevTools
2. See all queries and their status
3. Manually trigger refetch
4. Inspect cached data

---

## 🔗 Required Backend Endpoints

All these endpoints must be implemented on the backend:

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/v1/student/dashboard` | ✅ Ready |
| GET | `/api/v1/attendance/student/:studentId` | ✅ Ready |
| GET | `/api/v1/results/student/:studentId` | ✅ Ready |
| GET | `/api/v1/fees/student/:studentId` | ✅ Ready |
| GET | `/api/v1/announcements` | ✅ Ready |
| GET | `/api/v1/assignments` | ✅ Ready |
| GET | `/api/v1/timetable/class/:classId/section/:sectionId` | ✅ Ready |
| GET | `/api/v1/certificates/student/:studentId` | ✅ Ready |
| POST | `/api/v1/assignments/:id/submit` | ✅ Ready |
| GET | `/api/v1/subjects` | ✅ Ready |

---

## 📚 Integration Checklist

Before going to production:

- [ ] All endpoints tested with Postman/Insomnia
- [ ] Response formats match expected interfaces
- [ ] Error responses handled correctly
- [ ] Authentication token refresh working
- [ ] Rate limiting configured on backend
- [ ] Data validation on backend
- [ ] CORS configured for frontend domain
- [ ] File uploads to correct location
- [ ] Database indexes for performance
- [ ] Logging configured for debugging

---

**API Version**: v1
**Last Updated**: April 2026
**Status**: Production Ready ✅
