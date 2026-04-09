

## Fix Tour Feature — 3 Issues Found

### Issues Identified

1. **Build Error** — `getTourStepsForRole` in `role-config.ts` uses `Record<AppRole, string>` but missing `accountant` key. `AppRole` includes `'accountant'` but the map only has 4 entries.

2. **Wrong Import** — `AdminTour.jsx` uses `import { Joyride, STATUS } from 'react-joyride'`. In react-joyride v3, it's a **default export**: `import Joyride, { STATUS } from 'react-joyride'`.

3. **Step Navigation Broken** — `stepIndex` state is never updated in `handleTourCallback`. The callback receives index changes but doesn't call `setStepIndex`, so the tour gets stuck or doesn't advance properly with route navigation.

### Plan

**File 1: `src/lib/role-config.ts`** (line 133)
- Add `accountant: 'accountantTourSteps'` to the `tourStepsMap` object.

**File 2: `src/components/onboarding/AdminTour.jsx`** (line 2)
- Fix import: `import Joyride, { STATUS } from 'react-joyride'`
- Update `handleTourCallback` to properly track `stepIndex` using `action` and `index` from callback data, advancing/reversing steps and triggering route navigation.

### Technical Detail
- react-joyride v3 controlled mode requires manually updating `stepIndex` on each `EVENTS.STEP_AFTER` event based on `action` (next/prev).
- The `type === 'step:before'` check should use the joyride `EVENTS` constant for reliability.

