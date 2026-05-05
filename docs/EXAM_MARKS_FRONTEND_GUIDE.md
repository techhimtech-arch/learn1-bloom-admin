# 📝 Exam & Marks Entry: Frontend Integration Guide

This guide explains the architectural flow and exact API payloads required for building the **Marks Entry** and **Results** interfaces for Teachers and Admins.

The backend has recently been refactored to use a streamlined, **Enrollment-based Exam Architecture** to prevent the messy "student-id" bugs we used to have. 

---

## 🛠️ Step-by-Step Marks Entry Flow (For Teachers)

When a Teacher wants to enter marks for an Exam, the frontend should follow these 3 steps:

### Step 1: Fetch the Students for the Exam
Once the teacher selects an Exam (e.g., "Half Yearly Exam") and a Subject (e.g., "Maths"), you need to fetch the list of students who are eligible to take that exam. 

**API Request:**
```javascript
GET /api/v1/exams/<EXAM_ID>/students
```

**API Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "enrollment_id": "ENR12345",
      "student_id": "STU123",
      "student_name": "John Doe"
    },
    {
      "enrollment_id": "ENR12346",
      "student_id": "STU124",
      "student_name": "Jane Smith"
    }
  ]
}
```

> **UI Tip:** Render a table using this data. Column 1: `student_name`. Column 2: `<input type="number">` for the teacher to type the marks.

---

### Step 2: Save the Marks (Bulk Upsert)
When the teacher clicks "Save", gather all the inputs from the table and send them to the backend in one single API call. 

**API Request:**
```javascript
POST /api/v1/marks/bulk
```

**Required Payload Structure:**
```json
{
  "exam_id": "<EXAM_ID>",
  "marks": [
    {
      "enrollment_id": "ENR12345",  // From Step 1
      "subject_id": "<SUBJECT_ID>", // The subject the teacher is entering marks for
      "marks": 45                   // Number inputted by the teacher
    },
    {
      "enrollment_id": "ENR12346",
      "subject_id": "<SUBJECT_ID>",
      "marks": 38
    }
  ]
}
```

*Note: This API is an **Upsert**. If you send marks for a student who already has marks, it will update them. If it's the first time, it will insert them. You can safely call this API multiple times if a teacher makes a correction!*

---

## 📊 Step 3: Generating Results & Dashboards

If you are building the Admin Dashboard or Parent Portal where you need to show the final Report Card (Total Marks and Percentage), you do **NOT** need to calculate it on the frontend. The backend aggregates it for you dynamically.

**API Request:**
```javascript
GET /api/v1/results/<EXAM_ID>
```

**API Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "enrollment_id": "ENR12345",
      "student_name": "John Doe",
      "subject_marks": [
        {
          "subject_name": "Mathematics",
          "marks_obtained": 45
        },
        {
          "subject_name": "Science",
          "marks_obtained": 38
        }
      ],
      "total": 83,
      "percentage": 83.00
    }
  ]
}
```

### 💡 Summary of Endpoints Available:
1. `POST /api/v1/exams` (Create new exams)
2. `GET /api/v1/exams` (List all exams, supports `?class_id=X` filters)
3. `GET /api/v1/exams/:id/students` (Fetch students to draw the marks entry table)
4. `POST /api/v1/marks/bulk` (Save marks from the table)
5. `GET /api/v1/results/:examId` (View the final calculated report cards)
