
User wants a frontend audit document showing which features/pages work for each user role (Admin, Teacher, Student, Parent, Accountant). They'll compare it with backend work later.

I'll explore the routing, role configs, and pages to map everything accurately, then generate a professional DOCX/PDF report.

## Plan: Frontend Role-Based Feature Audit Report

### What I'll Do
1. **Audit the codebase** to map every frontend feature to user roles by inspecting:
   - `src/App.tsx` — all routes and their `ProtectedRoute` role guards
   - `src/lib/role-config.ts` — sidebar items per role
   - `src/hooks/usePermissions.ts` — permission matrix
   - `src/pages/dashboards/*` — what each role sees on landing
   - Role-specific pages (Teacher*, Student*, Parent*, Admin*)

2. **Generate a professional report** (`.docx`) at `/mnt/documents/Frontend_Role_Audit_Report.docx` containing:
   - **Executive Summary** — total pages, roles supported, coverage stats
   - **Role Matrix Table** — feature × role grid (✅ available / ❌ not available / 👁 read-only)
   - **Per-Role Sections** (Admin, Teacher, Student, Parent, Accountant):
     - Dashboard widgets available
     - Pages/routes accessible
     - Actions allowed (create/edit/delete/publish)
     - API endpoints consumed
   - **Permission Matrix** — granular permissions per role
   - **Gaps & Observations** — missing features, incomplete portals (e.g., Accountant has minimal pages)
   - **Comparison Template** — empty column "Backend Status" for the user to fill in when they share backend info

3. **Format**: Clean DOCX with header, tables with shaded headers, US Letter, Arial font, page numbers in footer.

4. **Deliver** as `<lov-artifact>` so user can download immediately.

### After Plan Approval
I'll switch to default mode, run the audit (read ~15 files), then run a Node script with `docx` library to generate the report and QA it by converting to PDF/images.
