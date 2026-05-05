# ⚡ Backend Migration Quick Reference

## 🎯 What Changed

The School Management System backend has been refactored to standardize naming conventions. Here's what you need to know:

---

## 1️⃣ Academic Year Naming
**Old:** `academicSessionId` or `academicYear`  
**New:** `academicYearId`

### Where It's Used:
- Timetable queries: `?academicYearId=${id}`
- Class teacher assignments: `{ academicYearId: '...' }`
- All academic filtering operations

### Updated Code Example:
```typescript
// ✅ CORRECT - Use this now
const timetable = await timetableApi.getWeeklyTimetable(classId, sectionId, academicYearId);

// ❌ DEPRECATED - Don't use this
const timetable = await timetableApi.getWeeklyTimetable(classId, sectionId, academicSessionId);
```

---

## 2️⃣ Student Names
**Old:** `student.name` (single field)  
**New:** `student.firstName` + `student.lastName` (split fields)

### Where It's Used:
- Student displays
- Payment records
- Reports and exports
- UI labels

### Updated Code Example:
```typescript
// ✅ CORRECT - Use this now
<h1>{student.firstName} {student.lastName}</h1>

// ❌ DEPRECATED - Don't use this
<h1>{student.name}</h1>

// For avatars
<Avatar>{(student.firstName?.[0] || student.lastName?.[0] || 'S').toUpperCase()}</Avatar>
```

---

## 3️⃣ Student Class Information
**Old:** `student.classId` and `student.sectionId` (direct properties)  
**New:** `student.currentEnrollment.classId` and `student.currentEnrollment.sectionId`

### Why Changed:
Students can have multiple class enrollments over time. The `currentEnrollment` object tracks the historical enrollment information.

### Updated Code Example:
```typescript
// ✅ CORRECT - Use this now
<p>Class: {student.currentEnrollment?.classId?.name}</p>
<p>Section: {student.currentEnrollment?.sectionId?.name}</p>

// ❌ DEPRECATED - Don't use this
<p>Class: {student.classId?.name}</p>
<p>Section: {student.sectionId?.name}</p>
```

---

## 4️⃣ Class Teacher Assignments
**Old:** `academicYear` parameter  
**New:** `academicYearId` parameter

### Updated Code Example:
```typescript
// ✅ CORRECT - Use this now
const classTeacherForm = { teacherId, classId, sectionId, academicYearId };
await classTeacherApi.create(classTeacherForm);

// ❌ DEPRECATED - Don't use this
const classTeacherForm = { teacherId, classId, sectionId, academicYear };
await classTeacherApi.create(classTeacherForm);
```

---

## 📊 Files Already Updated

✅ All core files have been updated:

| Feature | File | Status |
|---------|------|--------|
| Timetable Types | `src/types/timetable.ts` | ✅ |
| Timetable Services | `src/services/timetableService.ts` | ✅ |
| Timetable Form | `src/components/academic/TimetableSlotForm.tsx` | ✅ |
| Fee Payments | `src/components/fee/FeePaymentForm.tsx` | ✅ |
| Dashboard | `src/components/dashboard/Phase5Widgets.tsx` | ✅ |
| Parent Portal | `src/pages/ParentStudentDetail.tsx` | ✅ |
| Teacher Assignments | `src/pages/TeacherAssignments.tsx` | ✅ |

---

## 🔍 How to Find Updated Patterns

### Search for Usage in Your Code:
```bash
# Find where academicYearId is used (new pattern)
grep -r "academicYearId" src/

# Find old pattern (should be minimal/none)
grep -r "academicSessionId" src/

# Check new name pattern usage
grep -r "firstName" src/ | grep -v node_modules
```

---

## ⚠️ Breaking Changes You Need to Know

### 1. **API Response Structure Changed**
**Before:**
```json
{
  "studentProfile": {
    "name": "John Doe",
    "classId": { "_id": "123", "name": "Class 10" },
    "sectionId": { "_id": "456", "name": "A" }
  }
}
```

**After:**
```json
{
  "studentProfile": {
    "firstName": "John",
    "lastName": "Doe",
    "currentEnrollment": {
      "classId": { "_id": "123", "name": "Class 10" },
      "sectionId": { "_id": "456", "name": "A" }
    }
  }
}
```

### 2. **Query Parameters Changed**
**Timetable API (Before):**
```
GET /api/v1/timetable/class/C1/section/S1?academicSessionId=ABC
```

**Timetable API (After):**
```
GET /api/v1/timetable/class/C1/section/S1?academicYearId=ABC
```

### 3. **POST/PUT Payloads Changed**
**Class Teacher Assignment (Before):**
```json
{
  "teacherId": "T1",
  "classId": "C1",
  "sectionId": "S1",
  "academicYear": "2025-26"
}
```

**Class Teacher Assignment (After):**
```json
{
  "teacherId": "T1",
  "classId": "C1",
  "sectionId": "S1",
  "academicYearId": "YEAR_ID_123"
}
```

---

## 🛡️ Backward Compatibility Status

### ✅ Currently Supported (Temporary Bridge)
The backend will **automatically convert** old names to new ones for a limited time:
- `academicSessionId` → converts to `academicYearId`
- Old `name` field → reconstructed from firstName/lastName

### ⏰ Timeline
- **Now:** Frontend fully migrated (this PR)
- **Next:** Backend bridge will be removed in a future release
- **Action:** Update now, don't wait for the bridge removal

---

## ✅ Validation Checklist

Before committing changes, ensure:

- [ ] All `academicSessionId` references replaced with `academicYearId`
- [ ] All `student.name` references replaced with `student.firstName` + `student.lastName`
- [ ] All class/section references use `currentEnrollment`
- [ ] No TypeScript errors: `npm run build` passes
- [ ] Tests pass if applicable
- [ ] Code review completed

---

## 🚀 Deployment Instructions

1. **Review Changes:** Check `BACKEND_MIGRATION_SUMMARY.md` for full details
2. **Build:** `npm run build` (should complete with no errors)
3. **Test:** Run manual tests on:
   - Timetable creation
   - Fee payment processing
   - Student detail view
   - Class teacher assignment
4. **Deploy:** Push to your deployment environment
5. **Monitor:** Watch browser console for warnings

---

## 💡 Tips for New Code

When writing new code, follow these patterns:

### For Student Data:
```typescript
// Always use this pattern
function displayStudent(student) {
  const name = `${student.firstName} ${student.lastName}`;
  const className = student.currentEnrollment?.classId?.name || 'N/A';
  const sectionName = student.currentEnrollment?.sectionId?.name || 'N/A';
  
  return `${name} - ${className} ${sectionName}`;
}
```

### For Academic Filters:
```typescript
// Always use academicYearId
async function fetchTimetable(classId, sectionId, academicYearId) {
  try {
    const response = await api.get('/timetable', {
      params: { classId, sectionId, academicYearId }  // ← Use this parameter name
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch timetable:', error);
  }
}
```

### For Teacher Assignments:
```typescript
// Use academicYearId consistently
async function assignClassTeacher(data) {
  const payload = {
    teacherId: data.teacherId,
    classId: data.classId,
    sectionId: data.sectionId,
    academicYearId: data.academicYearId  // ← Not academicYear
  };
  
  return await api.post('/class-teacher/assign', payload);
}
```

---

## 📞 Common Questions

**Q: Can I still use the old names?**  
A: Not recommended. Use the new standardized names. The backend bridge is temporary.

**Q: What if I find old code still using deprecated patterns?**  
A: Update it! All critical paths have been migrated. File an issue if you find any remaining.

**Q: Will the app break if I mix old and new patterns?**  
A: Currently no, thanks to the backend bridge. But this will break in the future.

**Q: How do I know if a student object has the new structure?**  
A: Check for `firstName`/`lastName` fields instead of `name` field.

---

## 📚 Related Documentation

- [BACKEND_MIGRATION_SUMMARY.md](BACKEND_MIGRATION_SUMMARY.md) - Full migration details
- [STUDENT_PORTAL_API_GUIDE.md](STUDENT_PORTAL_API_GUIDE.md) - Student API reference
- [TIMETABLE_API_QUICK_REFERENCE.md](TIMETABLE_API_QUICK_REFERENCE.md) - Timetable API details

---

**Last Updated:** May 5, 2026  
**Status:** ✅ Complete and Validated  
**Build:** ✅ Passing
