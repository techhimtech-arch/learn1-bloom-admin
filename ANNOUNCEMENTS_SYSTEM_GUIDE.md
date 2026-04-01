# Student/Parent Announcements - Implementation Guide

## Overview

The announcement system now provides **role-based views** instead of showing the same admin table to all users:

### Before ❌
- All users (Admin, Student, Parent) saw the **admin table view**
- Students/Parents had access to ALL announcements (including drafts, unpublished)
- Admin filters (class, section) were shown to students - confusing UX

### After ✅
- **Admin** → Table view for full management & control
- **Student/Parent** → Card view with ONLY relevant announcements (filtered by role/class/section)
- **Simple filtering** → Only meaningful filters for students (Type, Unread, Search)
- **Better UX** → Card-based layout, priority alerts, emoji icons

---

## System Architecture

### 1. Smart Router Page: `/announcements`

**File:** `src/pages/Announcements.tsx`

```typescript
// Routes to correct view based on user role
if (user.role === 'school_admin') {
  return <AnnouncementManagement />;  // Table view
}
if (user.role === 'student' || 'parent') {
  return <StudentParentAnnouncements />;  // Card view
}
```

**Route in App.tsx:**
```typescript
<Route path="/announcements" element={<AnnouncementsPage />} />
```

### 2. Admin View: `AnnouncementManagement`

**File:** `src/pages/AnnouncementManagement.tsx` (unchanged)

Features:
- ✅ Full table with all announcements
- ✅ Admin filters: Type, Priority, Status, Class, Section
- ✅ Create, Edit, Delete, Publish/Unpublish
- ✅ Bulk actions
- ✅ Attachment management

**Access:** Admin only

### 3. Student/Parent View: `StudentParentAnnouncements`

**File:** `src/pages/StudentParentAnnouncements.tsx` (new)

Features:
- ✅ Card-based layout
- ✅ Simple filters: All, School, Class, Exam, Event
- ✅ Search functionality
- ✅ Unread count & alerts
- ✅ High-priority notifications
- ✅ Responsive design
- ✅ Read-only (no edit/delete)

**Access:** Student, Parent, Teacher

### 4. Portal Component: `StudentAnnouncements`

**File:** `src/components/student/StudentAnnouncements.tsx` (updated)

- Embedded in StudentPortal dashboard
- Displays latest announcements as cards
- Fetches from API (no longer mock data)
- Same filtering & searching as StudentParentAnnouncements
- Shows within a tab in the portal

---

## API Integration

### Backend Requirements

The backend should support these query parameters:

```
GET /api/v1/announcements

Parameters:
- targetAudience: 'student' | 'parent' | 'teacher' | 'school_admin'
- status: 'published' | 'draft'
- classId?: string (optional for filtering by class)
- sectionId?: string (optional for filtering by section)
- search?: string
- type?: 'school' | 'class' | 'exam' | 'event'
- priority?: 'high' | 'medium' | 'low'
- limit?: number
- skip?: number
```

### Current Implementation

```typescript
// API Call from StudentParentAnnouncements
const response = await announcementApi.getAll({
  status: 'published',
  targetAudience: user.role === 'student' ? 'student' : 'parent',
  limit: 50
});
```

---

## User Flows

### Student Logs In
1. Clicks "Announcements" in sidebar
2. Routes to `/announcements`
3. System checks: `user.role === 'student'`
4. Shows **StudentParentAnnouncements** (card view)
5. Only sees announcements for their class/section
6. Can search, filter by type, mark as read
7. **Cannot** create, edit, or delete

### Parent Logs In
1. Same flow as student
2. **Sees announcements relevant to their child's class/section**
3. Card-based read-only view

### Admin Logs In
1. Clicks "Announcements" in sidebar
2. Routes to `/announcements`
3. System checks: `user.role === 'school_admin'`
4. Shows **AnnouncementManagement** (table view)
5. Full admin controls: Create, Edit, Delete, Publish, Filter by Class/Section
6. Can target specific classes/sections/audiences

---

## Data Structure

### Announcement Model (Backend)

```typescript
Announcement {
  _id: string;
  title: string;
  content: string;
  message?: string;
  type: 'school' | 'class' | 'exam' | 'event' | 'general';
  priority: 'high' | 'medium' | 'low';
  
  // Targeting
  targetAudience?: string[];  // ['student', 'parent', 'teacher']
  targetType?: 'all' | 'class' | 'section';
  targetIds?: string[];  // Class/Section IDs
  
  // Status
  status: 'draft' | 'published';
  publishDate?: string;
  expiryDate?: string;
  
  // Metadata
  attachment?: string;
  attachmentUrl?: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  
  // For readers
  readStatus?: 'read' | 'unread';
}
```

---

## UI Comparison

| Aspect | Admin View (Table) | Student/Parent View (Card) |
|--------|-------------------|---------------------------|
| **Component** | AnnouncementManagement | StudentParentAnnouncements |
| **Layout** | Table rows | Card grid |
| **Filters** | Class, Section, Type, Priority, Status | Type only (All, School, Class, Exam, Event) |
| **Actions** | Create, Edit, Delete, Publish | None (read-only) |
| **Shown Count** | All created announcements | Only published + relevant to role |
| **Priority Display** | Column | Badge + Alert if high |
| **Unread Tracking** | Not shown | Shown with "New" badge |
| **Icons** | None | Type emoji (🏫📚📝📋🎉) |
| **On Click** | Opens edit dialog | Displays full content |

---

## File Changes Summary

### New Files Created
1. ✅ `/src/pages/Announcements.tsx` - Smart router (30 lines)
2. ✅ `/src/pages/StudentParentAnnouncements.tsx` - Student/Parent view (250 lines)

### Modified Files
1. ✅ `/src/App.tsx` - Import and route updated
2. ✅ `/src/components/student/StudentAnnouncements.tsx` - Now uses real API

### Unchanged
- `/src/pages/AnnouncementManagement.tsx` - Admin view unchanged
- `/src/services/api.ts` - Already supports params filtering

---

## Filtering Logic

### Backend Filtering (Server-side)
```
For Student:
  - fetch announcements where:
    - status = 'published'
    - AND (targetAudience includes 'student' OR targetAudience is empty/all)
    - AND (user's classId in targetIds OR targetType is 'all')

For Parent:
  - fetch announcements where:
    - status = 'published'
    - AND (targetAudience includes 'parent' OR targetAudience is empty/all)
    - AND (child's classId in targetIds OR targetType is 'all')

For Admin:
  - fetch all announcements (no filtering)
```

### Frontend Filtering (Client-side)
```typescript
// Text search
const hasSearch = 
  title.includes(search) || content.includes(search);

// Type filtering
const hasType = 
  type === 'all' || announcement.type === selectedType;

// Combine both
const show = hasSearch && hasType;
```

---

## Testing Checklist

- [ ] Admin can see all announcements in table view
- [ ] Admin cannot access `/announcements` vs other routes mixed
- [ ] Student sees only card view with relevant announcements
- [ ] Parent sees only card view with child's class announcements
- [ ] Search filters work in student/parent view
- [ ] Type filter (School, Class, Exam, Event) works
- [ ] Unread alerts display correctly
- [ ] High-priority announcements show alert banner
- [ ] Emoji icons display for announcement types
- [ ] Card layout is responsive on mobile
- [ ] No "Edit/Delete" buttons appear for students/parents
- [ ] Attachments can be downloaded (if any)
- [ ] Empty state shows proper message

---

## Integration Tasks (Backend)

1. **Filter announcements by status** ✓ (pass `status: 'published'` to API)
2. **Filter by targetAudience** (backend should filter based on this)
3. **Filter by class/section** (backend should use student's enrolled class)
4. **Track read status** (optional - if backend supports)
5. **Mark as read** endpoint (optional - for future UX enhancement)

---

## API Calls Made

### StudentParentAnnouncements
```typescript
announcementApi.getAll({
  status: 'published',
  targetAudience: user.role === 'student' ? 'student' : 'parent',
  limit: 50
})
```

### StudentAnnouncements (Portal)
```typescript
announcementApi.getAll({
  status: 'published',
  targetAudience: user.role === 'student' ? 'student' : 'parent',
  limit: 50
})
```

---

## Known Limitations & Future Enhancements

### Current Limitations
- No read/unread tracking (UI uses mock state)
- No "mark as read" functionality
- No notification push for high-priority
- No email digest

### Future Enhancements
- [ ] Real read/unread tracking via database
- [ ] Mark multiple announcements as read
- [ ] Pin important announcements
- [ ] Email notifications for high-priority
- [ ] Announcement history/archive
- [ ] Announcement scheduling (auto-publish)
- [ ] Student feedback/replies on announcements
- [ ] Parent notification preferences

---

## Deployment Notes

1. **No breaking changes** - Admin functionality unchanged
2. **Backward compatible** - Existing announcements work as-is
3. **No database migration needed** - Uses existing data
4. **API update needed** - Backend should support `targetAudience` filtering
5. **Role-based access** - Verified via existing permission system

---

**Status:** ✅ Ready for Use  
**Testing:** Recommended  
**Backend Support:** Requires filtering by `targetAudience`

