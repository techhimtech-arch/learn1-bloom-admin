# Timetable API - Frontend Quick Reference

## Base URL
`/api/v1/timetable`

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Quick Endpoint Reference

| Method | Endpoint | Purpose | Permissions |
|--------|----------|---------|-------------|
| POST | `/` | Create single timetable | Admin |
| POST | `/bulk` | Create multiple entries | Admin |
| GET | `/class/:classId/section/:sectionId` | Get class timetable | Timetable Read |
| GET | `/weekly/class/:classId/section/:sectionId` | Get weekly grid format | Timetable Read |
| GET | `/teacher/:teacherId` | Get teacher timetable | Timetable Read |
| PUT | `/:id` | Update entry | Admin |
| DELETE | `/:id` | Delete entry | Admin |
| DELETE | `/class/:classId/section/:sectionId/session/:sessionId` | Delete all for class | Admin |

## Most Common Use Cases

### 1. Display Weekly Timetable Grid
```javascript
// Perfect for displaying a class timetable in a grid/table format
const classId = 'class123';
const sectionId = 'section123';
const academicSessionId = 'session123';

const response = await fetch(
  `/api/v1/timetable/weekly/class/${classId}/section/${sectionId}?academicSessionId=${academicSessionId}`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const { data } = await response.json();

// Response structure:
// {
//   MONDAY: [
//     {
//       periodNumber: 1,
//       startTime: "09:00",
//       endTime: "10:00",
//       subject: { _id, name, code },
//       teacher: { _id, name, email },
//       room: "A-101"
//     }
//   ],
//   TUESDAY: [ ... ],
//   // ... WEDNESDAY through SATURDAY
// }

// Usage in React:
const renderTimetable = (data) => {
  return Object.entries(data).map(([day, periods]) => (
    <div key={day} className="day-column">
      <h3>{day}</h3>
      {periods.map(period => (
        <div key={period.periodNumber} className="period">
          <p>{period.startTime} - {period.endTime}</p>
          <p>{period.subject.name}</p>
          <p>{period.teacher.name}</p>
          <p>Room: {period.room}</p>
        </div>
      ))}
    </div>
  ));
};
```

### 2. Get Student's Class Timetable
```javascript
const response = await fetch(
  `/api/v1/timetable/class/${classId}/section/${sectionId}?academicSessionId=${sessionId}`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const { data } = await response.json();
// Returns array of timetable entries, sorted by period number
// Each entry includes populated subject and teacher details
```

### 3. Get Teacher's Own Timetable
```javascript
const teacherId = req.user.userId; // Your own ID

const response = await fetch(
  `/api/v1/timetable/teacher/${teacherId}?academicSessionId=${sessionId}`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const { data } = await response.json();
// Returns array sorted by day and period number
// Includes class and section details
```

### 4. Get Teacher Timetable for Specific Day
```javascript
const response = await fetch(
  `/api/v1/timetable/teacher/${teacherId}?academicSessionId=${sessionId}&day=MONDAY`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const { data } = await response.json();
// Returns only Monday entries for that teacher
```

### 5. Create Timetable Entry (Admin)
```javascript
const newEntry = {
  classId: "class123",
  sectionId: "section123",
  day: "MONDAY",
  periodNumber: 1,
  subjectId: "subject123",
  teacherId: "teacher123",
  startTime: "09:00",
  endTime: "10:00",
  room: "A-101",
  academicSessionId: "session123",
  semester: "FIRST"
};

const response = await fetch('/api/v1/timetable', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(newEntry)
});

const result = await response.json();
if (result.success) {
  console.log('Created:', result.data);
} else {
  console.error('Error:', result.message);
}
```

### 6. Create Multiple Timetables (Bulk)
```javascript
const bulk = {
  academicSessionId: "session123",
  timetableSlots: [
    {
      classId: "class123",
      sectionId: "section123",
      day: "MONDAY",
      periodNumber: 1,
      subjectId: "subject123",
      teacherId: "teacher123",
      startTime: "09:00",
      endTime: "10:00"
    },
    {
      classId: "class123",
      sectionId: "section123",
      day: "MONDAY",
      periodNumber: 2,
      subjectId: "subject456",
      teacherId: "teacher456",
      startTime: "10:00",
      endTime: "11:00"
    }
    // ... more entries
  ]
};

const response = await fetch('/api/v1/timetable/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(bulk)
});
```

### 7. Update Timetable Entry (Admin)
```javascript
const timetableId = "timetable123";
const updates = {
  day: "TUESDAY",
  periodNumber: 2,
  startTime: "10:00",
  endTime: "11:00"
};

const response = await fetch(`/api/v1/timetable/${timetableId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(updates)
});

const result = await response.json();
// Conflict validation runs automatically
```

### 8. Delete Entry (Admin)
```javascript
const timetableId = "timetable123";

const response = await fetch(`/api/v1/timetable/${timetableId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});

const result = await response.json();
if (result.success) {
  console.log('Entry deleted');
}
```

## Error Handling

All endpoints return standardized error responses:

```javascript
{
  "success": false,
  "statusCode": 400,
  "message": "Teacher conflict: Teacher is already assigned during MONDAY period 2"
}
```

**Common Errors**:
- **400 - Conflict**: Teacher/class already has entry at that time
- **400 - Bad Request**: Missing or invalid required fields
- **401 - Unauthorized**: Missing or invalid token
- **403 - Forbidden**: Insufficient permissions for operation
- **404 - Not Found**: Resource doesn't exist
- **500 - Server Error**: Internal server error

## Query Parameter Options

### Valid Days
- MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY

### Valid Semesters
- FIRST, SECOND

### Time Format
- Must be 24-hour format: "HH:MM" (e.g., "09:00", "14:30")

### Valid Period Numbers
- 1-12

## Response Structure

All successful responses follow this format:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Description of operation",
  "data": {
    // Endpoint-specific data
  }
}
```

## Frontend Component Examples

### React Hook for Fetching Timetable
```javascript
import { useEffect, useState } from 'react';

function useTimetable(classId, sectionId, sessionId) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await fetch(
          `/api/v1/timetable/weekly/class/${classId}/section/${sectionId}?academicSessionId=${sessionId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );
        const result = await response.json();
        
        if (result.success) {
          setTimetable(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [classId, sectionId, sessionId]);

  return { timetable, loading, error };
}

// Usage
function TimetableGrid() {
  const { timetable, loading, error } = useTimetable(classId, sectionId, sessionId);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="timetable-grid">
      {Object.entries(timetable).map(([day, periods]) => (
        <div key={day} className="day-column">
          <h3>{day}</h3>
          {periods.map(period => (
            <div key={period.periodNumber} className="period-slot">
              {/* Render period details */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Handling Conflicts
```javascript
async function saveTimetable(data) {
  try {
    const response = await fetch('/api/v1/timetable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      // Show user-friendly error message
      if (result.message.includes('Teacher conflict')) {
        showAlert('⚠️ This teacher is already teaching another class at this time');
      } else if (result.message.includes('Class conflict')) {
        showAlert('⚠️ This class already has a subject scheduled at this time');
      } else {
        showAlert(`Error: ${result.message}`);
      }
      return false;
    }

    showAlert('✓ Timetable saved successfully');
    return true;
  } catch (error) {
    showAlert(`Network error: ${error.message}`);
    return false;
  }
}
```

## Testing with Postman/cURL

### Create Entry
```bash
curl -X POST http://localhost:5000/api/v1/timetable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "classId": "class123",
    "sectionId": "section123",
    "day": "MONDAY",
    "periodNumber": 1,
    "subjectId": "subject123",
    "teacherId": "teacher123",
    "startTime": "09:00",
    "endTime": "10:00",
    "academicSessionId": "session123"
  }'
```

### Get Weekly Timetable
```bash
curl -X GET "http://localhost:5000/api/v1/timetable/weekly/class/class123/section/section123?academicSessionId=session123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Points for Frontend Developers

1. **Always include academicSessionId** - Most endpoints require it as a query parameter
2. **Week format is best for grids** - Use `/weekly/...` endpoint for table/grid display
3. **Conflict errors are normal** - They help maintain data integrity
4. **Times must be 24-hour format** - "09:00", not "9:00"
5. **Teachers can only see own timetables** - They'll get 403 if trying to access others
6. **Sorting is automatic** - Results come pre-sorted by day and period
7. **All timestamps in UTC** - Be aware of timezone conversions

## Additional Resources

- [Full API Documentation](./TIMETABLE_MANAGEMENT_MODULE.md)
- [Model Schema](../src/models/Timetable.js)
- [Controller Implementation](../src/controllers/timetableController.js)
- [Service Layer](../src/services/timetableService.js)
