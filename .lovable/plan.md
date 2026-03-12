

## School Management System - Admin Panel

### Phase 1: Foundation & Authentication

**App Shell & Layout**
- Sidebar navigation with collapsible menu (Dashboard, User Management, Student Admission, Class Management, Attendance)
- Top header bar with school logo area, admin name, and logout button
- Responsive layout: hamburger menu on mobile, icon-only sidebar on tablet, full sidebar on desktop
- Blue-based color scheme as specified (#3b82f6 primary)

**Authentication**
- Login page with email/password form
- School registration page (school name, email, admin details)
- Token management: store JWT access/refresh tokens, auto-refresh on 401
- Protected routes with role-based access control
- API client (axios) configured with base URL, auth headers, and interceptors

### Phase 2: Dashboard
- 6 stat widgets: Total Students, Total Teachers, Total Classes, Today's Attendance, Pending Fees, Upcoming Exams
- Quick Actions panel (Add Student, Mark Attendance, Record Fee, New Exam, Announcement, Generate Report)
- Recent activity table
- Attendance bar chart and fee collection overview using Recharts

### Phase 3: Core Modules

**Student Admission**
- Multi-section form: Personal Info, Parent Info, Academic Info, Address
- Document upload support
- Pending admissions table with approve/reject actions
- Search and filter capabilities

**Class & Section Management**
- Class list with sections, capacity, and current strength
- Create/edit class with section assignment
- Assign teachers to classes/sections

**Attendance Management**
- Class/section/date selector
- Student list with Present/Absent/Late checkboxes for bulk marking
- Attendance summary stats and monthly report view

### Shared Components
- Reusable DataTable with pagination, sorting, and search
- Form components with validation (using react-hook-form + zod)
- Dashboard widget cards
- Loading skeletons and empty states
- Toast notifications for all actions

### API Integration
- API service layer with axios, connecting to your existing backend at the configured base URL
- React Query for data fetching, caching, and mutations
- Global error handling with toast notifications

