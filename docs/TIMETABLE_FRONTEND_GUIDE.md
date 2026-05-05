# 📅 Timetable Module: Frontend Integration Guide

This guide explains the architectural flow, exact API requests, and JSON payloads required to build the Timetable creation interface correctly without crashing the browser or sending invalid data.

## 🎯 The Problem You Were Facing
Showing *all* subjects and *all* teachers in a single dropdown is incorrect. In a real school, teachers are specifically mapped to subjects for specific classes via `TeacherAssignments`. 

If you show all teachers, an admin could accidentally assign a "P.E. Teacher" to teach "Advanced Physics", and the backend will reject it or the data will be corrupt.

---

## 🛠️ Step-by-Step Implementation Flow

### Step 1: Fetch Only Assigned Subjects & Teachers
When the user selects a **Class** and **Section** to create a timetable, do **NOT** fetch all subjects/teachers. Instead, fetch the active assignments for that specific class.

**API Request:**
```javascript
GET /api/v1/teacher-assignments?classId=<ClassID>&sectionId=<SectionID>&academicYearId=<YearID>
```

**API Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "subjectId": { "_id": "SUB1", "name": "Mathematics" },
      "teacherId": { "_id": "TEA1", "name": "Ravi Kumar" }
    },
    {
      "subjectId": { "_id": "SUB2", "name": "Science" },
      "teacherId": { "_id": "TEA2", "name": "Neha Sharma" }
    }
  ]
}
```

### Step 2: Build Contextual Dropdowns (React/JS Logic)
Using the array returned above, you should populate the Period dropdowns:

1. **Subject Dropdown**: Extract only the unique `subjectId` items from the array. The user will only see "Mathematics" and "Science".
2. **Teacher Auto-Select**: When the user selects "Mathematics" from the Subject dropdown, your frontend should look up the array and **automatically select** (or filter the dropdown to) "Ravi Kumar".

---

## 🚀 Saving the Timetable (The Payload)

Once the user has filled out the grid, you need to send the data to the bulk creation API.

**API Request:**
```javascript
POST /api/v1/timetable/bulk
```

**Required Payload Structure:**
```json
{
  "academicYearId": "65b2a...",  // Required at root level
  "timetableSlots": [
    {
      "classId": "65a1b...",
      "sectionId": "65a1c...",
      "day": "MONDAY",           // Must be a string (e.g., MONDAY, TUESDAY)
      "periodNumber": 1,         // Must be a number between 1 and 12
      "subjectId": "SUB1",
      "teacherId": "TEA1",
      "startTime": "08:00",      // Format: HH:MM
      "endTime": "08:45"         // Format: HH:MM
    },
    {
      "classId": "65a1b...",
      "sectionId": "65a1c...",
      "day": "MONDAY",
      "periodNumber": 2,
      "subjectId": "SUB2",
      "teacherId": "TEA2",
      "startTime": "08:45",
      "endTime": "09:30"
    }
    // ... add more slots for all days/periods
  ]
}
```

### ⚠️ Important Backend Validations to Keep in Mind:
1. **Teacher Conflict Check**: If you send a payload where "Ravi Kumar" is assigned to Period 1 for Class 10A, but he is already assigned to Period 1 for Class 9B on the same day, the backend will return a `400 Bad Request` with `"Teacher conflict"`.
2. **Class Conflict Check**: You cannot assign two different subjects to the same Class/Section during the exact same period and day.
3. **Number Constraints**: `periodNumber` must be a valid integer between `1` and `12`.
4. **Time Format**: `startTime` and `endTime` must strictly be formatted as `HH:MM` (e.g. `09:00`, not `9 AM`).
