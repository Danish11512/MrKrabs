# Customizable Grid Dashboard Setup

## Overview

Transform the dashboard into a customizable grid system with 12 columns and 60 rows using `react-grid-layout`. Remove existing dashboard content and set up the basic grid structure with drag-and-drop support.

## Library Selection

**react-grid-layout** is the recommended library because:

- Supports configurable column count (`cols: 12`)
- Row-based height system (configurable `rowHeight` in pixels)
- Built-in drag-and-drop functionality
- Resizable components (can be enabled/disabled per item)
- Layout persistence support
- Well-maintained and widely used

## Step-by-Step Execution Plan

### Step 1: Install Dependencies

**Action:** Add packages to `package.json` and install

**Command:**

```bash
bun add react-grid-layout react-resizable
bun add -d @types/react-resizable
```

**Files modified:**

- [`package.json`](package.json) - Dependencies will be added automatically

**Verification:** Check that `react-grid-layout` and `react-resizable` appear in `package.json` dependencies

**Expected outcome:** Packages installed, no errors

---

### Step 2: Add CSS Imports

**Action:** Import required CSS files at the top of `DashboardClient.tsx`

**Location:** [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx)

**Add these imports (after existing imports, before component):**

```typescript
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
```

**Verification:** CSS imports should be at the top of the file, after React imports but before component code

**Expected outcome:** CSS styles available for grid layout

---

### Step 3: Remove Existing Dashboard Content

**Action:** Delete the welcome message and static UI, keep auth/user store logic

**Location:** [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx)

**What to remove:**

- Lines 52-65: The return statement with welcome message (`<h1>Dashboard</h1>` and welcome text)
- Keep: All `useEffect`, loading states, error handling, and user checks (lines 6-50)

**What to keep:**

- All imports (useEffect, useUserStore)
- All conditional returns (loading, error, no user states)
- The `useEffect` hook for store hydration
- User store destructuring

**Specific change:** Replace lines 52-65 with a placeholder return that will be replaced in Step 7

**Verification:** File should still have auth logic but no welcome message in the final return

**Expected outcome:** Clean component ready for grid implementation

---

### Step 4: Add ReactGridLayout Import and useState

**Action:** Import ReactGridLayout component and useState hook

**Location:** [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx)

**Modify existing React import:**

```typescript
import { useEffect, useState } from 'react'
```

**Add new import:**

```typescript
import GridLayout from 'react-grid-layout'
```

**Verification:** Imports should be at the top with other React imports

**Expected outcome:** GridLayout component and useState hook available

---

### Step 5: Create Layout State

**Action:** Add state for grid layout items with proper TypeScript type

**Location:** [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx)

**Add inside component (after user store destructuring, around line 8):**

```typescript
const [layout, setLayout] = useState<GridLayout.Layout[]>([])
```

**Type definition:** The layout array will contain items matching this structure:

```typescript
{
  i: string,      // Component ID (unique identifier)
  x: number,      // Column position (0-11 for 12 columns)
  y: number,      // Row position (0-59 for 60 rows)
  w: number,      // Width in columns (1-12)
  h: number,      // Height in rows (1-60)
  static?: boolean // Optional: if true, prevents drag/resize
}
```

**Verification:** State should be initialized as empty array `[]`

**Expected outcome:** Layout state ready to hold grid items

---

### Step 6: Configure Grid Parameters

**Action:** Set up grid configuration constants

**Location:** [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx)

**Add constants (inside component, before return, after state declarations):**

```typescript
const GRID_COLS = 12
const GRID_ROWS = 60
const ROW_HEIGHT = 20 // pixels per row (60 rows × 20px = 1200px total)
```

**Grid configuration:**

- **Columns**: 12 (fixed)
- **Rows**: 60 (maximum)
- **Row Height**: 20px (adjustable - 20px × 60 = 1200px total dashboard height)
- **Compact Type**: `null` (prevents auto-compaction, maintains fixed positions)
- **Drag**: Enabled by default
- **Resize**: Can be controlled per item later

**Verification:** Constants should be defined before the return statement

**Expected outcome:** Grid configuration ready for use

---

### Step 7: Render GridLayout Component

**Action:** Replace the empty return with ReactGridLayout component

**Location:** [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx)

**Replace the final return statement (after all conditionals, around line 52) with:**

```typescript
return (
  <div className="min-h-screen bg-background p-4">
    <GridLayout
      className="layout"
      layout={layout}
      cols={GRID_COLS}
      rowHeight={ROW_HEIGHT}
      width={1200} // Initial width, will be responsive
      compactType={null}
      preventCollision={false}
      isDraggable={true}
      isResizable={false} // Start with resize disabled, enable per-item later
      onLayoutChange={(newLayout) => setLayout(newLayout)}
    >
      {/* Grid items will be added here later */}
    </GridLayout>
  </div>
)
```

**Key props explained:**

- `layout={layout}` - Current layout state (empty array initially)
- `cols={GRID_COLS}` - 12 columns
- `rowHeight={ROW_HEIGHT}` - 20px per row
- `compactType={null}` - No auto-compaction (items stay at fixed positions)
- `isDraggable={true}` - Enable drag-and-drop
- `isResizable={false}` - Disable resize initially (can enable per-item later)
- `onLayoutChange` - Update state when layout changes (for drag operations)

**Verification:** GridLayout should render (will be empty initially since layout array is empty)

**Expected outcome:** Grid container visible on dashboard page

---

## File Changes Summary

**Files to modify:**

1. [`package.json`](package.json) - Add dependencies (Step 1)
2. [`components/dashboard/DashboardClient.tsx`](components/dashboard/DashboardClient.tsx) - Steps 2-7

**Files unchanged:**

- [`app/dashboard/page.tsx`](app/dashboard/page.tsx) - Server-side auth check remains the same

---

## Execution Order

Steps must be executed in this order:

1. **Step 1** (Install dependencies) - Can be done independently
2. **Step 2** (CSS imports) - Requires Step 1
3. **Step 3** (Remove content) - Can be done independently
4. **Step 4** (Add imports) - Requires Step 2
5. **Step 5** (Layout state) - Requires Step 4
6. **Step 6** (Grid config) - Requires Step 5
7. **Step 7** (Render grid) - Requires Step 6

**Note:** Steps 1 and 3 can be done in parallel, but all other steps have dependencies.

---

## Expected Result

After completing all steps:

- Dashboard page loads with an empty 12×60 grid
- Grid is ready to accept components with fixed sizes
- Drag-and-drop is enabled (components can be repositioned)
- Resize is disabled initially (can be enabled per component later)
- Auth logic and user store integration remain intact
- Loading and error states still work

---

## Testing Checklist

After implementation, verify:

- [ ] Dashboard page loads without errors
- [ ] Grid container is visible (may appear empty initially)
- [ ] No console errors related to react-grid-layout
- [ ] Auth redirect still works (unauthenticated users redirect to login)
- [ ] Loading state still displays correctly
- [ ] Error state still displays correctly
- [ ] Browser console shows no TypeScript errors

---

## Troubleshooting

**If grid doesn't appear:**

- Check that CSS imports are correct
- Verify GridLayout import is correct
- Check browser console for errors
- Ensure layout state is initialized as empty array

**If TypeScript errors:**

- Verify `@types/react-resizable` is installed
- Check that GridLayout types are imported correctly

**If drag doesn't work:**

- Verify `isDraggable={true}` is set
- Check that layout items have valid `x`, `y`, `w`, `h` values
- Ensure `onLayoutChange` handler is present

---

## Next Steps (After This Plan)

Once the grid structure is working:

- Add individual dashboard components with fixed sizes (w × h in grid units)
- Implement layout persistence (save/load from database or localStorage)
- Add component configuration UI (add/remove/reposition components)
- Customize grid appearance and spacing
- Enable resize per component if needed
- Add responsive width handling (currently fixed at 1200px)