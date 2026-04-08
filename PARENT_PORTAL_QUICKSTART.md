# ⚡ Parent Portal - Quick Start Guide

## 🚀 **5-Minute Start Guide**

### **1. Start Backend (Port 5000)**
```bash
cd /path/to/SMS_backend
npm install  # Only first time
npm start
# Should see: "Server running on port 5000"
```

### **2. Start Frontend (Port 8081)**
```bash
cd /path/to/learn1-bloom-admin
npm install  # Only first time
npm run dev
# Should see: "VITE v... ready in ...ms"
# Open: http://localhost:8081
```

### **3. Test Parent Login**
1. Go to http://localhost:8081
2. Login with parent credentials
3. You should see your dashboard with children

### **4. View Child Details**
1. Click any child card
2. See 5 tabs: Attendance, Fees, Results, Announcements, Timetable
3. Each tab shows relevant data from backend

---

## 📋 **What Works**

✅ **Parent Login** - Email & password authentication  
✅ **View Children** - List of all linked children  
✅ **Attendance Tab** - Days, present/absent, percentage, records  
✅ **Fees Tab** - Total, paid, due, payment history  
✅ **Results Tab** - Exams, marks, grades, subject-wise  
✅ **Announcements Tab** - Class announcements with priority  
✅ **Timetable Tab** - Daily schedule with subjects & teachers  
✅ **Auto Refresh** - Automatic token refresh on expiry  
✅ **Error Handling** - Proper 401, 403, 404 errors  
✅ **Responsive** - Works on mobile, tablet, desktop

---

## 🔍 **Troubleshooting**

### ❌ "Connection refused on port 5000"
→ Backend not running. Run `npm start` in SMS_backend folder.

### ❌ "Cannot find module..."
→ Run `npm install` first.

### ❌ "Port 8081 already in use"
→ Kill the process or use different port with `npm run dev -- --port 8082`

### ❌ "Login credentials don't work"
→ Check if parent account exists in database.

### ❌ "No data showing in tabs"
→ Data might not exist for this student. Check backend database.

### ❌ "Access Denied on child detail"
→ Parent not linked to this student. Admin must link them first.

---

## 📁 **Key Files**

```
src/
├── pages/
│   ├── ParentDashboard.tsx      → Dashboard page
│   └── ParentStudentDetail.tsx   → 5 tabs implementation
├── services/
│   └── api.ts                     → API endpoints (updated)
└── contexts/
    └── AuthContext.tsx            → Authentication logic
```

---

## 🧪 **Test API Endpoints**

```bash
# Get parent dashboard
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/parent/dashboard

# Get child attendance
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/parent/children/STUDENT_ID/attendance

# Get child fees
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/parent/children/STUDENT_ID/fees
```

---

## 📊 **Data Format Examples**

### **Attendance Response**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDays": 30,
      "presentDays": 25,
      "absentDays": 3,
      "percentage": 83.33
    },
    "records": [
      {
        "date": "2024-04-07",
        "status": "present",
        "remarks": ""
      }
    ]
  }
}
```

### **Fees Response**
```json
{
  "success": true,
  "data": {
    "totalFee": 50000,
    "paidAmount": 30000,
    "dueAmount": 20000,
    "feeHeads": [
      {
        "name": "Tuition Fee",
        "amount": 50000,
        "paidAmount": 30000,
        "dueAmount": 20000,
        "status": "partial"
      }
    ]
  }
}
```

---

## ✨ **Quick Commands**

```bash
# Build for production
npm run build

# Type check
npx tsc --noEmit

# Format code
npm run format

# Check for warnings
npm run lint
```

---

## 🎯 **Features at a Glance**

| Feature | Status | Location |
|---------|--------|----------|
| Parent Login | ✅ | src/pages/auth/Login.tsx |
| Dashboard | ✅ | src/pages/ParentDashboard.tsx |
| Attendance Tab | ✅ | src/pages/ParentStudentDetail.tsx |
| Fees Tab | ✅ | src/pages/ParentStudentDetail.tsx |
| Results Tab | ✅ | src/pages/ParentStudentDetail.tsx |
| Announcements Tab | ✅ | src/pages/ParentStudentDetail.tsx |
| Timetable Tab | ✅ | src/pages/ParentStudentDetail.tsx |
| Error Handling | ✅ | src/services/api.ts |
| Responsive Design | ✅ | All components |

---

## 🚀 **That's it!**

Parent portal is ready to use. Both parents and admins can now:
- Parents: View their children's attendance, fees, results, announcements, timetable
- Admins: Link parents to students and manage the system

**Happy coding!** 💻✨
