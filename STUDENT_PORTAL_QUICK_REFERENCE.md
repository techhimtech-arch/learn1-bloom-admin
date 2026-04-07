# Student Portal - Quick Reference Guide

## 🎓 Student Portal Overview

The Student Portal provides logged-in students with access to 9 integrated modules for academic management, assignment tracking, attendance monitoring, and certificate management.

## 📍 URLs & Navigation

### Main Entry Points
| Module | URL | Purpose |
|--------|-----|---------|
| Dashboard | `/` or `/student/dashboard` | Overview of all academic info |
| Attendance | `/student/attendance` | View attendance records monthly |
| Results | `/student/results` | Exam results and marks |
| Fees | `/student/fees` | Payment status and receipts |
| Study Materials | `/student/materials` | Download study resources |
| Assignments | `/student/assignments` | View and submit assignments |
| Announcements | `/student/announcements` | Read school notices |
| Timetable | `/student/timetable` | Daily/weekly class schedule |
| Certificates | `/student/certificates` | Download certificates |

## 🔐 Access & Permissions

### Role-Based Access
- **Role**: `student`
- **Default Dashboard**: `/` (redirects to Dashboard.tsx which renders StudentDashboard)
- **Protected Routes**: All student routes require authentication
- **Auto-redirect**: Non-students redirected to `/unauthorized`

### Session Management
- Sessions accessible at `/sessions` (account nav)
- Profile accessible at `/profile` (account nav)

## 🎨 UI Components Used

### Data Display
```typescript
<Card>            // Content containers
<Badge>           // Status indicators (green/orange/red/blue)
<Table>           // Data tables with responsive scroll
<Skeleton>        // Loading placeholders
```

### Interactions
```typescript
<Button>          // Primary/outline/ghost variants
<Dialog>          // Modal for details/preview
<Input>           // Search fields
<Select>          // Filter dropdowns
```

### Feedback
```typescript
<Alert>           // Error/warning messages
<Tooltip>         // Helper text
<Toast>           // Success notifications (via sonner)
```

## 🔄 Data Flow

### 1. Authentication
```
Login → JWT stored → AuthContext → ProtectedRoute → Dashboard
```

### 2. Dashboard Load
```
Dashboard.tsx checks user.role → StudentDashboard renders
→ dashboardApi.getStudentStats() → Display stats
```

### 3. Module Access
```
Click nav item → Router → Page component
→ useQuery fetches data → Render with loading/error states
```

## 📊 Common Patterns

### Fetching Data
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['unique-key', userId],
  queryFn: async () => {
    const response = await apiFunction();
    return response.data?.data || [];
  },
  enabled: !!userId,
});
```

### Error Handling
```typescript
{error ? (
  <Alert className="border-red-200 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription>Error message</AlertDescription>
  </Alert>
) : null}
```

### Status Badges
```typescript
// Status colors
'pending' → orange
'submitted' → blue
'graded' → green
'late' → red
```

## 🔧 Key Features by Module

### 📋 Attendance
- Monthly view with filtering
- Statistics: present/absent/leave/late counts
- Percentage calculation with warnings (<75%)
- Download report button
- Responsive table layout

### 📚 Study Materials
- Subject-wise organization
- Search across materials
- File type indicators
- Preview modals
- Download functionality

### 📝 Assignments
- Status tracking (pending/submitted/late/graded)
- Due date with urgency indicators
- Quick submit button
- Assignment details modal
- Marks display

### 📢 Announcements
- Type filtering (general/class/urgent/event)
- Priority levels (high/medium/low)
- Unread indicators
- Attachment support
- Full announcement preview

### 📅 Timetable
- Weekly overview
- Daily detailed view
- Subject, teacher, room info
- Class type badges
- Current day highlight

### 📜 Certificates
- Status tracking (issued/pending/expired)
- Certificate preview
- Validity date display
- Download button

### 💰 Fees
- Paid/pending status
- Payment history
- Receipts view
- Due amount calculation

### 🎯 Results
- Exam-wise results
- Subject marks breakdown
- Grade display
- Result history

## 🔗 API Integration Points

### Real Data from Backend
All pages fetch real data from backend via API endpoints:

```typescript
// Attendance
GET /attendance/student/:studentId

// Results
GET /results/student/:studentId

// Fees
GET /fees/student/:studentId

// Announcements
GET /announcements?audience=student&published=true

// Assignments
GET /assignments?studentId=id

// Timetable
GET /timetable/class/:classId/section/:sectionId

// Certificates
GET /certificates/student/:studentId

// Dashboard Stats
GET /student/dashboard
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px (1 column)
- **Tablet**: 640-1024px (2 columns)
- **Desktop**: > 1024px (3+ columns)

### Mobile Optimizations
- Hamburger sidebar toggle
- Single column for tables → horizontal scroll
- Touch-friendly button spacing
- Collapsible sections
- Simplified headers

## 🚀 Performance Features

### Caching Strategy
```typescript
// React Query config
staleTime: 5 * 60 * 1000        // 5 minutes
gcTime: 10 * 60 * 1000          // 10 minutes cache
refetchOnWindowFocus: false      // No refetch on focus
retry: 1                          // Retry once on failure
```

### Loading Optimization
- Skeleton loaders matching content layout
- Lazy loading for heavy components
- Efficient re-renders with React Query
- Debounced search inputs

## 🐛 Debugging Tips

### Check Auth Token
```javascript
localStorage.getItem('accessToken')
localStorage.getItem('user')
```

### View API Calls
- Open DevTools Network tab
- Look for `/api/v1/` calls
- Check response status

### Test Loading States
```javascript
// In DevTools Console
// Delay API response to see loading state
```

### Reset State
```javascript
localStorage.clear()
location.reload()
```

## 📋 Checklist for Testing

- [ ] Can login as student
- [ ] Dashboard loads correctly
- [ ] All 9 modules accessible from sidebar
- [ ] Each module shows real data
- [ ] Search functionality works
- [ ] Filters apply correctly
- [ ] Loading states visible
- [ ] Error handling shows alerts
- [ ] Empty states appear when no data
- [ ] Mobile view responsive
- [ ] Download buttons work
- [ ] Modal dialogs functional
- [ ] Logout works
- [ ] Token refresh on 401

## 🔄 Common Tasks

### Add New Module
1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Update `role-config.ts` with new route
4. Add nav item to ALL_NAV_ITEMS
5. Integrate API endpoint

### Modify Existing Page
1. Edit page component
2. Update API calls if needed
3. Test in browser
4. Run tests

### Change API Endpoint
1. Update call in `src/services/api.ts`
2. Update page component if needed
3. Test with real API
4. Handle new response format

## 📞 Support Resources

- **API Documentation**: Check `src/services/api.ts` for all endpoints
- **Component Library**: See `src/components/ui/` for available components
- **Type Definitions**: Check interfaces in each page component
- **Role Config**: See `src/lib/role-config.ts` for route permissions

## 🎨 Color Reference

| Status | Color | Meaning |
|--------|-------|---------|
| Present/Found/Active | Green | Success |
| Pending/Warning/Caution | Orange | Action needed |
| Absent/Error/Failed | Red | Alert |
| Late/Leave/Neutral | Yellow/Blue | Info |

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
