# 🧪 Student Quiz MCQ - Testing Checklist

**Date:** April 30, 2026  
**Tester:** _____________  
**Build Version:** ___________  

---

## 📋 Pre-Testing Setup

### Prerequisites
- [ ] Application running on localhost:5000
- [ ] Logged in as a student account
- [ ] Database has quizzes created by teachers
- [ ] Quizzes are in PUBLISHED/ACTIVE status
- [ ] Network connection is stable

### Test Environment
- [ ] Browser: ____________ (Chrome/Firefox/Safari)
- [ ] OS: _____________ (Windows/Mac/Linux)
- [ ] Device: Desktop / Mobile
- [ ] Screen Size: _________

---

## ✅ Feature Testing

### 1. Quiz List & Discovery

#### 1.1 Quiz List Page
- [ ] Navigate to Student Quizzes page loads successfully
- [ ] Quiz list displays without errors
- [ ] Statistics section shows:
  - [ ] Total Quizzes count
  - [ ] Passed quizzes count
  - [ ] Average percentage score
  - [ ] Best score
- [ ] Quizzes are displayed with:
  - [ ] Quiz title
  - [ ] Description
  - [ ] Time limit
  - [ ] Max marks
  - [ ] Number of questions
  - [ ] Teacher name
  - [ ] Subject name

#### 1.2 Quiz Filtering & Tabs
- [ ] "Available" tab shows only quizzes that can be started
- [ ] "In Progress" tab shows only ongoing quizzes
- [ ] "Completed" tab shows only finished quizzes
- [ ] "All" tab shows all quizzes
- [ ] Tab counts are accurate
- [ ] Can switch between tabs

#### 1.3 Search Functionality
- [ ] Search by quiz title works
- [ ] Search by quiz description works
- [ ] Search is case-insensitive
- [ ] Results update in real-time
- [ ] Search results respect active tab filter

#### 1.4 Quiz Status Badges
- [ ] Available quizzes show "Available" badge
- [ ] In-progress quizzes show "In Progress" badge
- [ ] Completed quizzes show "Completed" badge
- [ ] Not available quizzes show disabled state

#### 1.5 Quiz Action Buttons
- [ ] "Start Quiz" button enabled for available quizzes
- [ ] "Retake Quiz" button shown for completed quizzes (if allowed)
- [ ] "Continue Quiz" button shown for in-progress quizzes
- [ ] "View Results" button shown for completed quizzes
- [ ] Buttons trigger correct actions

---

### 2. Quiz Start & Initialization

#### 2.1 Start Quiz Action
- [ ] Clicking "Start Quiz" opens dialog
- [ ] Dialog title shows quiz name
- [ ] Dialog contains description text
- [ ] Dialog has proper width and scrolling (not cut off)

#### 2.2 Quiz Data Loading
- [ ] Questions load after dialog opens
- [ ] All questions display (verify count matches)
- [ ] Questions have all required fields:
  - [ ] Question text
  - [ ] 4 MCQ options
  - [ ] Marks/points value

#### 2.3 Timer Initialization
- [ ] Timer displays in MM:SS or HH:MM:SS format
- [ ] Timer starts counting down immediately
- [ ] Timer value matches quiz timeLimit from list
- [ ] Timer color is blue (not in warning state)

#### 2.4 Initial State
- [ ] First question displayed
- [ ] Question counter shows "1 of X"
- [ ] No answers are selected initially
- [ ] Progress bar shows 0% progress
- [ ] "0/X Answered" badge displays

---

### 3. Question Display & Navigation

#### 3.1 Question Display
- [ ] Current question text displays clearly
- [ ] Question number badge shows "Q1", "Q2", etc.
- [ ] Question marks/points display below title
- [ ] All 4 MCQ options display with labels (A, B, C, D)

#### 3.2 Next/Previous Navigation
- [ ] "Previous" button disabled on first question
- [ ] "Next" button enabled when not on last question
- [ ] "Previous" button enabled on questions 2+
- [ ] Clicking "Next" moves to next question
- [ ] Clicking "Previous" moves to previous question
- [ ] Questions don't get skipped

#### 3.3 Question Grid Navigation
- [ ] Question grid shows all question numbers
- [ ] Current question has different styling (darker/highlighted)
- [ ] Clicking on any question number jumps to that question
- [ ] Question index updates correctly

#### 3.4 Question Overview Legend
- [ ] Green squares show answered questions
- [ ] Gray/white squares show unanswered questions
- [ ] Current question highlighted in grid
- [ ] Legend labels are clear

---

### 4. Answer Selection & Saving

#### 4.1 Answer Selection
- [ ] Clicking on MCQ option selects it
- [ ] Radio button fills when option selected
- [ ] Selected option is highlighted
- [ ] Option label is clickable
- [ ] Can only select one option per question

#### 4.2 Answer Saving Indicator
- [ ] When answer selected, "Saving..." appears briefly
- [ ] After save, green checkmark shows "Answer saved"
- [ ] If save fails, error message displays
- [ ] Can retry if save failed

#### 4.3 Answer Persistence
- [ ] Navigate to another question (Next/Previous)
- [ ] Return to original question
- [ ] Previous answer still selected ✓
- [ ] After page navigation, answer preserved
- [ ] After quiz pause/resume, answer still there

#### 4.4 Multiple Answer Submissions (Retry)
- [ ] Change answer selection
- [ ] New selection saves immediately
- [ ] Can change answers multiple times
- [ ] Latest selection is recorded

#### 4.5 Answer Count Display
- [ ] Badge shows correct count: "X/Y Answered"
- [ ] Updates after each answer selection
- [ ] Shows current status accurately

---

### 5. Timer Functionality

#### 5.1 Timer Countdown
- [ ] Timer decrements by 1 second each second
- [ ] Timer format is correct (MM:SS)
- [ ] Timer never shows negative values
- [ ] Timer stops at 0:00

#### 5.2 Timer Color Changes
- [ ] Normal: Blue color when > 5 minutes
- [ ] Warning: Red color when < 5 minutes
- [ ] All-clear threshold: Triggers at 300 seconds (5 min)

#### 5.3 Time Warning Alert
- [ ] Alert appears when timer < 5 minutes
- [ ] Alert says "Time Warning: less than 5 minutes"
- [ ] Alert is red/prominent color
- [ ] Alert persists until timer expires

#### 5.4 Timer Synchronization
- [ ] Timer value syncs with each answer submission
- [ ] Server timeRemaining updates local timer
- [ ] No major discrepancies between local and server

#### 5.5 Extreme Time Cases
- [ ] Very long quizzes (> 1 hour): Timer displays correctly
- [ ] Very short quizzes (< 5 min): All warnings work
- [ ] 0 seconds remaining: Triggers auto-submit

---

### 6. Submit Quiz

#### 6.1 Submit Button Location
- [ ] Submit button only appears on last question
- [ ] Submit button labeled "Submit Quiz"
- [ ] Submit button is green/highlighted
- [ ] Submit button has send icon

#### 6.2 Manual Submit
- [ ] Click "Submit Quiz" button
- [ ] Button shows "Submitting..." loading state
- [ ] Dialog remains open during submission
- [ ] No errors occur during submission

#### 6.3 Submit Validation
- [ ] Can submit with some unanswered questions (if allowed)
- [ ] Submit processes even with 1 answer
- [ ] Submit processes with all answers
- [ ] Submit completes within reasonable time (< 5 seconds)

#### 6.4 Submission Confirmation
- [ ] Toast message shows "Quiz Completed!"
- [ ] Toast shows score and grade
- [ ] Quiz dialog closes
- [ ] Results dialog opens automatically
- [ ] Quiz removed from "In Progress" list

---

### 7. Auto-Submit (Timer Expiry)

#### 7.1 Timer Expiry
- [ ] Timer reaches 0:00
- [ ] No manual action required
- [ ] Quiz submits automatically
- [ ] No error occurs

#### 7.2 Auto-Submit Status
- [ ] Toast message indicates auto-submit
- [ ] Results dialog opens after auto-submit
- [ ] Answers are saved correctly
- [ ] Score calculation is accurate

#### 7.3 Auto-Submit Edge Cases
- [ ] If already submitting, doesn't submit twice
- [ ] If page loses connection, still auto-submits when reconnected
- [ ] Multiple answer submissions before timeout all saved

---

### 8. Results Display

#### 8.1 Results Summary Card
- [ ] Results dialog opens automatically
- [ ] Quiz title displays
- [ ] Attempt number shows
- [ ] Score displays: "X/Y" format
- [ ] Percentage displays with 1 decimal: "XX.X%"
- [ ] Grade badge displays (A+, A, B+, etc.)
- [ ] Grade color matches grade (green for A, etc.)

#### 8.2 Pass/Fail Status
- [ ] PASSED: Shown in green with checkmark ✓
- [ ] FAILED: Shown in red with X symbol ✗
- [ ] Passing score threshold displayed
- [ ] Status is accurate based on score

#### 8.3 Question Statistics
- [ ] Correct answers count shows
- [ ] Wrong answers count shows
- [ ] Accuracy percentage calculated
- [ ] Accuracy progress bar displays
- [ ] Time taken shows in HH:MM:SS or MM:SS format

#### 8.4 Performance Feedback
- [ ] Message changes based on score:
  - [ ] 90%+ : "Outstanding performance!"
  - [ ] 80%+ : "Great job!"
  - [ ] 70%+ : "Good performance!"
  - [ ] etc.
- [ ] Message is encouraging and contextual
- [ ] Message background color appropriate

---

### 9. Detailed Answer Review

#### 9.1 Answer List Display
- [ ] All answers displayed in numbered list
- [ ] Question number matches quiz display
- [ ] Question text displays

#### 9.2 Correct Answers
- [ ] Marked with green checkmark icon ✓
- [ ] Background color green/light
- [ ] Border color green

#### 9.3 Wrong Answers
- [ ] Marked with red X icon ✗
- [ ] Background color red/light
- [ ] Border color red
- [ ] Shows "Your Answer: X"
- [ ] Shows "Correct Answer: Y"

#### 9.4 Answer Options Display
- [ ] Options display with letter indicators (A, B, C, D)
- [ ] Selected option highlighted
- [ ] Correct option highlighted (for wrong answers)
- [ ] Option text is readable

#### 9.5 Explanations
- [ ] Explanation displays for each question
- [ ] Explanation has "Explanation:" label
- [ ] Explanation background is blue/highlighted
- [ ] Explanation text is readable
- [ ] Explanation helps understand correct answer

#### 9.6 Scrolling & Layout
- [ ] All answers visible (scrollable if many)
- [ ] Scroll works smoothly
- [ ] Layout doesn't break on mobile
- [ ] Text doesn't overflow

---

### 10. Results Actions

#### 10.1 Close Results
- [ ] "Close" button visible
- [ ] Clicking "Close" closes results dialog
- [ ] Returned to quiz list
- [ ] Quiz list updated with new status

#### 10.2 Download Results (if implemented)
- [ ] "Download Results" button visible
- [ ] Clicking download starts file download
- [ ] PDF or appropriate format generated
- [ ] File contains all result details

#### 10.3 Return to Quiz List
- [ ] "Back to Dashboard" button visible
- [ ] Clicking returns to quiz list
- [ ] Quiz list refreshes
- [ ] Quiz now shows "Completed" status

---

### 11. Error Handling

#### 11.1 Network Errors During Answer
- [ ] Answer submission fails
- [ ] Error message displays to user
- [ ] "Saving..." indicator disappears
- [ ] User can retry clicking answer again
- [ ] Answer eventually saves on retry

#### 11.2 Network Errors During Submit
- [ ] Quiz submit fails
- [ ] Error toast appears with message
- [ ] Submit button becomes enabled again
- [ ] User can retry submit
- [ ] Quiz data preserved if submit fails

#### 11.3 Network Errors During Results Fetch
- [ ] Results fail to load
- [ ] Error message displays
- [ ] User can close and retry
- [ ] Can view results later from quiz list

#### 11.4 Timeout Errors
- [ ] Long operations show loading state
- [ ] Timeout message if operation takes > 30 seconds
- [ ] Option to retry operation
- [ ] User not stuck/blocked

---

### 12. Mobile & Responsive

#### 12.1 Mobile Portrait (< 640px)
- [ ] Quiz layout stacks vertically
- [ ] All content visible without horizontal scroll
- [ ] Buttons are touch-friendly (> 44px)
- [ ] Text is readable (not too small)
- [ ] Timer visible and readable
- [ ] MCQ options accessible

#### 12.2 Mobile Landscape
- [ ] Layout optimizes for landscape
- [ ] All content still visible
- [ ] No overlapping elements
- [ ] Question grid might hide (shown in menu?)

#### 12.3 Tablet (640px - 1024px)
- [ ] Two-column layout if applicable
- [ ] Results page shows side-by-side details
- [ ] All features accessible

#### 12.4 Desktop (> 1024px)
- [ ] Full layout displays
- [ ] Results dialog at proper width
- [ ] All details visible without scroll

---

### 13. Browser Compatibility

#### 13.1 Chrome
- [ ] ✓ All features work
- [ ] ✓ No console errors
- [ ] ✓ Smooth animations

#### 13.2 Firefox
- [ ] ✓ All features work
- [ ] ✓ No console errors
- [ ] ✓ Layout correct

#### 13.3 Safari
- [ ] ✓ All features work
- [ ] ✓ No console errors
- [ ] ✓ Animations smooth

#### 13.4 Edge
- [ ] ✓ All features work
- [ ] ✓ No compatibility issues

---

### 14. Edge Cases & Boundary Testing

#### 14.1 Single Question Quiz
- [ ] Shows "1 of 1"
- [ ] Previous/Next buttons handled correctly
- [ ] Submit button visible immediately
- [ ] No navigation needed

#### 14.2 Large Quiz (50+ questions)
- [ ] All questions load without hanging
- [ ] Navigation between questions is fast
- [ ] Question grid scrolls if needed
- [ ] Performance acceptable

#### 14.3 Very Long Quiz Time (5+ hours)
- [ ] Timer displays correctly (HH:MM:SS)
- [ ] No display issues
- [ ] No timeout issues

#### 14.4 Very Short Quiz Time (< 1 minute)
- [ ] Timer works correctly
- [ ] Warning appears immediately
- [ ] Auto-submit still functions

#### 14.5 Zero Marks for All Wrong
- [ ] Shows 0% score
- [ ] Shows 0 marks
- [ ] Shows grade F
- [ ] Shows FAILED status

#### 14.6 Perfect Score
- [ ] Shows 100% score
- [ ] Shows all marks
- [ ] Shows grade A+
- [ ] Shows PASSED status

---

### 15. Performance Testing

#### 15.1 Load Time
- [ ] Quiz list loads: < 2 seconds
- [ ] Quiz starts: < 2 seconds
- [ ] Question loads: instant
- [ ] Results load: < 3 seconds

#### 15.2 Response Time
- [ ] Answer submission: < 1 second
- [ ] Quiz submission: < 3 seconds
- [ ] Timer updates: smooth (every 1s)
- [ ] Navigation: instant (no lag)

#### 15.3 Memory Usage
- [ ] No memory leaks detected
- [ ] No gradual slowdown over time
- [ ] Browser doesn't crash with long quizzes
- [ ] Multiple quizzes can be taken sequentially

---

## 📊 Summary

### Test Results
- **Total Test Cases:** _____
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____
- **Pass Rate:** _____% 

### Issues Found

| Issue # | Severity | Description | Steps to Reproduce | Status |
|---------|----------|-------------|-------------------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### Recommendations

- [ ] 
- [ ] 
- [ ]

---

## ✍️ Sign-Off

**Tester Name:** ________________  
**Date:** ________________  
**Signature:** ________________  

**QA Manager Name:** ________________  
**Date:** ________________  
**Signature:** ________________  

---

**Status:** 
- [ ] APPROVED FOR DEPLOYMENT
- [ ] NEEDS FIXES
- [ ] FURTHER TESTING REQUIRED

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

