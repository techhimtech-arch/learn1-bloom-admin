

## Fix Teacher Portal Build Errors

The teacher portal is broken due to ~60 TypeScript errors. They cluster into 6 root causes. Fix them all.

### Root Causes & Fixes

**1. `ClassAssignment` union type (`string | ClassAssignment`) breaks teacher pages** (~30 errors)
TeacherContext types `classes` as `(ClassAssignment | string)[]` but every teacher page (TeacherAttendance, TeacherResults, TeacherStudents, teacher/TeacherAssignments, teacher/TeacherExams, teacher/TeacherResults) accesses `.classId/.sectionId/.subjectId` directly.
**Fix:** Change `TeacherContext.tsx` so `classes: ClassAssignment[]` (drop the `| string`). Add `subjectId` to the `ClassAssignment` interface.

**2. AppSidebar duplicate object keys** (2 errors at L55, L64)
`'Teacher Assignments'` and `'Announcements'` defined twice in `tourMap`.
**Fix:** Remove duplicates (keep first occurrence).

**3. AssignmentForm uses `_id` on `{id, name, code}` typed items** (6 errors)
Local types declared with `id` only, but code uses `cls._id || cls.id`.
**Fix:** Add optional `_id?: string` to local Subject/Class/Section interfaces in AssignmentForm.

**4. AcademicSummaryWidgets — `getSummary()` argument count** (5 errors)
`academicApi.getSummary()` signatures expect 1–2 args; called with 0.
**Fix:** View signatures and pass appropriate undefined/default args (e.g., `academicApi.getSummary(undefined)`).

**5. QuizCreateForm + QuizTakingInterface type mismatches** (4 errors)
- `Quiz` interface lacks `questions` field → add `questions?: QuizQuestion[]` to `Quiz` type.
- Form data union has optional `title` → cast/assert in `onSubmit` since validation guarantees presence.
- `QuizTakingInterface` mutation `onSuccess` typed as `QuizSubmitResponse` but receives `ApiResponse<QuizSubmitResponse>` → fix handler signature.

**6. ExamManagement — handleEdit shape mismatch** (4 errors)
Spreads exam (with object `classId`) then overwrites with strings — TS still sees union. Two `Exam` types collide (one with required `id`, one optional).
**Fix:** Cast the merged object `as Exam` and unify the two `Exam` type imports (use the canonical one).

### Files Modified
- `src/contexts/TeacherContext.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/assignment/AssignmentForm.tsx`
- `src/components/academic/AcademicSummaryWidgets.tsx`
- `src/types/quiz.ts`
- `src/components/quiz/QuizCreateForm.tsx`
- `src/components/quiz/QuizTakingInterface.tsx`
- `src/pages/ExamManagement.tsx`

### Verification
After edits, run `npx tsc --noEmit` to confirm 0 errors. No teacher page logic is changed — only type alignment so the build passes and the teacher portal renders.

### Out of Scope
- No API changes
- No UI/UX changes
- No new features (separate request)

