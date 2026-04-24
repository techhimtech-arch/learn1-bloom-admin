# Student Assignment API Implementation

## Overview
Complete implementation of student assignment viewing and submission functionality with the following API endpoints:

## 🎯 Implemented API Endpoints

### 1. GET /api/v1/assignments - All Assignments for Student
**Purpose**: Fetch all published assignments for the logged-in student

**Implementation**: `studentAssignmentApi.getAll()`

**Parameters**:
- `page?: number` - Pagination page (default: 1)
- `limit?: number` - Items per page (default: 10)
- `status?: string` - Filter by status (e.g., "PUBLISHED")
- `subjectId?: string` - Filter by subject
- `sortBy?: string` - Sort field (dueDate, createdAt, title)
- `sortOrder?: string` - Sort order (asc, desc)

**Example Usage**:
```javascript
const response = await studentAssignmentApi.getAll({
  status: 'PUBLISHED',
  sortBy: 'dueDate',
  sortOrder: 'asc'
});
```

**Expected Response**:
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "id": "xyz123",
      "title": "Chapter 5 Math Problems",
      "description": "Solve all problems from exercise 5.1 to 5.5",
      "subjectId": {
        "id": "sub123",
        "name": "Mathematics",
        "code": "MATH"
      },
      "classId": {
        "id": "class123",
        "name": "10-A"
      },
      "sectionId": {
        "id": "section123",
        "name": "A"
      },
      "teacherId": {
        "id": "teacher123",
        "name": "Mr. Sharma",
        "email": "sharma@school.com"
      },
      "dueDate": "2026-04-30T23:59:59.000Z",
      "maxMarks": 100,
      "status": "PUBLISHED",
      "attachments": [
        {
          "filename": "assignment_5.pdf",
          "url": "https://..."
        }
      ],
      "createdAt": "2026-04-24T10:00:00.000Z"
    }
  ]
}
```

### 2. GET /api/v1/assignments/{assignmentId} - Single Assignment Details
**Purpose**: Fetch detailed information about a specific assignment

**Implementation**: `studentAssignmentApi.getById(assignmentId)`

**Example Usage**:
```javascript
const response = await studentAssignmentApi.getById('xyz123');
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "xyz123",
    "title": "Chapter 5 Math Problems",
    "description": "Solve all problems from exercise 5.1 to 5.5",
    "subjectId": {
      "name": "Mathematics"
    },
    "teacherId": {
      "name": "Mr. Sharma",
      "email": "sharma@school.com"
    },
    "dueDate": "2026-04-30T23:59:59.000Z",
    "maxMarks": 100,
    "status": "PUBLISHED",
    "allowLateSubmission": true,
    "lateSubmissionPenalty": 10,
    "attachments": [...],
    "createdAt": "2026-04-24T10:00:00.000Z"
  }
}
```

### 3. POST /api/v1/assignments/{assignmentId}/submit - Submit Assignment
**Purpose**: Submit an assignment with text and/or file attachment

**Implementation**: `studentAssignmentApi.submit(assignmentId, submissionData)`

**Request Body**:
```javascript
{
  submissionText: "Here is my assignment solution...",
  attachment: {
    filename: "solution.pdf",
    url: "https://..."
  },
  lateSubmissionReason: "Reason for late submission (if applicable)"
}
```

**Example Usage**:
```javascript
const response = await studentAssignmentApi.submit('xyz123', {
  submissionText: "My complete solution",
  attachment: {
    filename: "solution.pdf",
    url: "https://..."
  }
});
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Assignment submitted successfully",
  "data": {
    "id": "submission123",
    "assignmentId": "xyz123",
    "studentId": "student123",
    "submittedAt": "2026-04-25T14:30:00.000Z",
    "status": "SUBMITTED",
    "isLate": false
  }
}
```

## 🛠️ Frontend Implementation

### Components Created/Updated:

#### 1. StudentAssignmentApi Service (`src/pages/services/api.ts`)
- Added `studentAssignmentApi` with all three endpoints
- Proper TypeScript interfaces for type safety
- Error handling integrated

#### 2. StudentAssignments Component (`src/components/student/StudentAssignments.tsx`)
- Updated to use real API calls instead of mock data
- Real-time assignment fetching with loading states
- Assignment filtering and search functionality
- Status badges and due date calculations
- Integration with submission dialog

#### 3. AssignmentSubmissionDialog Component (`src/components/student/AssignmentSubmissionDialog.tsx`)
- Complete submission form with text and file upload
- Late submission reason field (shown when applicable)
- Form validation and error handling
- Success/error toast notifications

#### 4. StudentAssignmentsView Page (`src/pages/StudentAssignmentsView.tsx`)
- Updated to use new studentAssignmentApi
- Data transformation to match existing UI
- Maintains existing table layout and functionality

## 🎨 UI Features

### Assignment Display:
- **Stats Cards**: Total, Pending, Submitted counts
- **Search & Filter**: By title, subject, and status
- **Status Indicators**: Color-coded badges (Pending, Submitted, Late, Graded)
- **Due Date Warnings**: Visual alerts for overdue and due-soon assignments
- **Attachments**: Downloadable assignment files
- **Teacher Info**: Shows who assigned the work

### Submission Features:
- **Text Submission**: Rich text area for written answers
- **File Upload**: Support for PDF, DOC, images
- **Late Submission**: Automatic detection and reason field
- **Validation**: Ensures either text or file is provided
- **Feedback**: Success/error toast notifications

## 🔐 Authentication & Authorization

- **JWT Token**: Automatically attached via axios interceptors
- **Student Filtering**: API automatically returns only student's assignments
- **Class/Section**: Auto-filtered based on student enrollment
- **Status Filter**: Only PUBLISHED assignments visible to students

## 📱 Responsive Design

- **Mobile Optimized**: Cards layout for small screens
- **Table View**: Comprehensive data display on larger screens
- **Touch Friendly**: Large tap targets and proper spacing

## 🔄 Data Flow

1. **Load Assignments**: `GET /api/v1/assignments` on component mount
2. **Filter/Search**: Client-side filtering of fetched data
3. **View Details**: `GET /api/v1/assignments/{id}` for full details
4. **Submit Assignment**: `POST /api/v1/assignments/{id}/submit`
5. **Refresh Data**: Automatic refetch after successful submission

## 🧪 Testing

### Manual Testing Steps:
1. Login as student user
2. Navigate to Assignments page
3. Verify assignments load with correct data
4. Test search and filter functionality
5. Click on assignment to view details
6. Submit an assignment with text only
7. Submit an assignment with file attachment
8. Test late submission flow
9. Verify status updates after submission

### API Testing with curl:
```bash
# Get all assignments
curl -X GET "http://localhost:5000/api/v1/assignments?status=PUBLISHED&sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific assignment
curl -X GET "http://localhost:5000/api/v1/assignments/xyz123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit assignment
curl -X POST "http://localhost:5000/api/v1/assignments/xyz123/submit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionText": "My complete solution",
    "attachment": {
      "filename": "solution.pdf",
      "url": "https://..."
    }
  }'
```

## 🚀 Deployment Notes

- **Environment Variables**: Ensure `VITE_API_URL` is set correctly
- **CORS**: Backend must allow frontend origin
- **File Upload**: Backend needs file storage configuration
- **JWT**: Refresh token mechanism for extended sessions

## 📋 Future Enhancements

- **Draft Submissions**: Save work in progress
- **Multiple Files**: Support for multiple attachments
- **Submission History**: View previous submissions
- **Grades View**: Display marks once graded
- **Notifications**: Email/push for new assignments
- **Offline Mode**: Cache assignments for offline viewing
