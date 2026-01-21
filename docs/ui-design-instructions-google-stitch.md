# DocXTractor – AI UI Designer Instructions for Google Stitch

> **Purpose**: This document provides detailed prompts and instructions for Google Stitch (AI UI Designer) to generate high-fidelity designs for each screen of the DocXTractor application.

---

## 🎯 Design System Priority

### Primary Reference: RetroUI (https://www.retroui.dev)

RetroUI is a **NeoBrutalism styled React + TailwindCSS component library**. All designs MUST follow RetroUI patterns as the primary design system.

**Installation command for developers:**
```bash
npx shadcn add @retroui/button
```

### Design System Hierarchy

1. **Primary**: RetroUI component patterns (https://www.retroui.dev/docs/components)
2. **Secondary**: Shadcn/ui primitives (compatible with RetroUI)
3. **Tertiary**: Custom TailwindCSS utilities following Neubrutalism principles

---

## 🎨 Design System & Visual Identity

### Style: Neubrutalism / RetroUI

Use a **Neubrutalism** aesthetic – bold, playful, and highly functional. This style is characterized by:
- **Bold boundaries** between UI elements
- **High contrast** with thick black borders
- **Hard shadows** creating a "pop out" effect
- **Vibrant accent colors** against neutral backgrounds
- **Playful yet professional** appearance

### Core Design Tokens (RetroUI)

| Token | Value | TailwindCSS Class |
|-------|-------|-------------------|
| **Primary** | `#fde047` (Yellow) | `bg-primary` |
| **Primary Hover** | `#fcd34d` | `hover:bg-primary-hover` |
| **Background** | `#FFFFFF` or `#F7F7F5` | `bg-background` |
| **Foreground (Text)** | `#000000` | `text-foreground` |
| **Muted Background** | `#f4f4f5` | `bg-muted` |
| **Muted Foreground** | `#71717a` | `text-muted-foreground` |
| **Border** | `#000000` (2px) | `border-2 border-foreground` |
| **Accent Teal** | `#14b8a6` | Custom |
| **Accent Coral/Red** | `#f87171` | Custom |
| **Accent Purple** | `#a855f7` | Custom |
| **Success Green** | `#22c55e` | Custom |
| **Warning Yellow** | `#eab308` | Custom |
| **Border Width** | 2px–4px | `border-2` or `border-4` |
| **Border Radius** | 4px–8px | `rounded` or `rounded-lg` |
| **Shadow** | Hard 4px–8px offset | `shadow-md`, no blur |
| **Typography** | Inter or Public Sans | `font-head`, `font-sans` |

### RetroUI Typography

- **Heading Font**: Use `font-head` (bold, impactful)
- **Body Font**: Use `font-sans` (clear, readable)
- **Font Weights**: Extra Bold (800) for headings, Medium (500) for buttons, Regular (400) for body

### RetroUI Component Patterns

#### Buttons (Primary)
```css
font-head rounded outline-hidden cursor-pointer duration-200 font-medium 
flex items-center shadow-md hover:shadow active:shadow-none 
bg-primary text-primary-foreground border-2 border-black 
transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 
hover:bg-primary-hover px-4 py-1.5 text-base
```

#### Buttons (Outline)
```css
font-head rounded outline-hidden cursor-pointer duration-200 font-medium 
flex items-center shadow-md hover:shadow active:shadow-none 
bg-transparent border-2 transition 
hover:translate-y-1 active:translate-y-2 active:translate-x-1 px-4 py-1.5 text-base
```

#### Cards
```css
inline-block border-2 rounded transition-all hover:shadow-none 
w-full bg-background shadow-none
```

#### Input Fields
```css
px-4 py-2 w-full rounded border-2 shadow-md transition 
focus:outline-hidden focus:shadow-xs
```

#### Badges
```css
font-semibold rounded bg-muted text-muted-foreground px-2.5 py-1.5 text-sm
```

### Visual Principles

- **Thick black borders** (2px minimum) on all cards, inputs, and buttons
- **Hard drop shadows** (no blur) creating a "pop" effect on interactive elements
- **Translate on hover/active** for buttons (`hover:translate-y-1 active:translate-y-2`)
- **High contrast** for accessibility (black text on light backgrounds)
- **Playful vibrant accents** (yellow, teal, coral) against neutral backgrounds
- **Consistent iconography** (flat, solid icons from Lucide or similar)
- **Responsive** for desktop, tablet, and mobile

---

## 📱 Screen-by-Screen Design Prompts

Use these prompts in Google Stitch to generate each screen.

---

### 1. Authentication Screens

#### 1.1 Login Page

```
Design a login page for "DocXTractor" – an AI-powered document extraction app.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

Layout:
- Stark white background (#FFFFFF)
- Centered card container with 4px thick black border
- Hard 6px offset black shadow (no blur)
- Card width: max-w-md (~450px)

Header Section:
- Logo at top: Bold text "DocXTractor" with a document/extraction icon
- Tagline: "AI-Powered Document Extraction"

Form Section:
- Email input field:
  - 2px black border, rounded corners (4px)
  - Inset shadow effect on focus
  - Placeholder: "Enter your email"
- Password input field:
  - Same styling as email
  - Show/hide password toggle icon
  - Placeholder: "Enter your password"
- "Remember me" checkbox with RetroUI checkbox styling

Primary Action:
- "Sign In" button:
  - Yellow (#fde047) background
  - 2px thick black border
  - Hard shadow
  - Full width
  - Hover: translate-y-1, shadow reduces
  - Active: translate-y-2, no shadow

Footer Links:
- "Forgot password?" link
- "Don't have an account? Sign Up" link

Typography: Inter/Public Sans, bold headings
Colors: Primary Yellow #fde047, Black borders, White background
```

#### 1.2 Sign Up Page

```
Design a sign-up page for "DocXTractor".

Style: Neubrutalism / RetroUI

Same aesthetic as login page with:
- Card with 4px thick black border and hard shadow
- Form fields: Full Name, Email, Password, Confirm Password
- All inputs have inset styling with 2px black borders
- Primary button "Create Account" with yellow (#fde047) fill
- Password strength indicator bar
- Link: "Already have an account? Sign In"
- Optional: Simple illustration or icon showing document extraction concept
```

#### 1.3 Forgot Password Page

```
Design a forgot password page for "DocXTractor".

Style: Neubrutalism / RetroUI
- Simple centered card with thick 4px black border
- Heading: "Reset Your Password"
- Subtext: "Enter your email and we'll send you a reset link"
- Single email input field with inset styling
- Yellow primary button "Send Reset Link"
- Back to login link with arrow icon
- Simple lock/key icon at top of form
```

---

### 2. Dashboard (Home)

```
Design a dashboard/home page for "DocXTractor" – a document extraction web app.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

Layout Structure:
- Fixed sidebar on left (width ~240px)
- Main content area (flex-1, scrollable)

Sidebar Design:
- White/cream background with right border (2px black)
- Logo "DocXTractor" at top (bold, with icon)
- Navigation items vertical stack:
  - Dashboard (active - yellow background, black border)
  - Pipelines
  - Jobs/Runs
  - Settings
- Each nav item: icon + label, 8px padding
- Active item: bg-primary (#fde047), 2px black border, subtle shadow
- Hover item: bg-muted
- User avatar and name at bottom with circular 2px border

Main Content Area:
- Background: #F7F7F5 (soft cream)
- Header row:
  - Page title "Dashboard" (text-3xl, font-bold)
  - Right side: "New Pipeline" primary yellow button with plus icon

Stats Row:
- Grid of 4 stat cards
- Each card:
  - White background
  - 2px black border
  - 4px hard offset shadow
  - Large bold number (text-4xl)
  - Small label below (text-muted-foreground)
- Stats: Total Pipelines, Active Jobs, Documents Processed, Success Rate

Recent Pipelines Section:
- Section heading: "Recent Pipelines"
- Grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Pipeline cards:
  - 3px black border, 4px hard shadow
  - 8px border radius
  - Pipeline name (bold), description preview
  - Colored icon for extraction type
  - Last run date badge
  - Hover: slight lift (shadow reduces)

Recent Jobs Table:
- Section heading: "Recent Extraction Jobs"
- Table container with 2px black border
- Columns: Job ID, Pipeline, Documents, Status, Date
- Status badges:
  - Success: green background (#22c55e), black border
  - In Progress: yellow background (#fde047), black border
  - Failed: red background (#f87171), black border
- Row hover: subtle yellow tint
```

---

### 3. Pipeline List Page

```
Design a pipeline list/management page for "DocXTractor".

Style: Neubrutalism / RetroUI

Layout:
- Same sidebar as dashboard
- Main content area

Header:
- "My Pipelines" title (text-3xl, font-bold)
- "New Pipeline" yellow button with plus icon (right side)

Filters Row:
- Search input (inset styling, 2px border)
- Status filter dropdown
- Extraction type filter (AI/Deterministic)
- Sort dropdown (Date, Name, Runs)

Pipeline Grid:
- Each pipeline as a card with:
  - 3px black border, 4px hard offset shadow
  - White background
  - Pipeline name (text-xl, font-bold)
  - Description (text-muted-foreground, truncate 2 lines)
  - Tags: AI fields count, Regex fields count (badges)
  - Stats row: total runs, success rate, last run date
  - Action buttons row:
    - Edit (yellow outline button)
    - Run (yellow solid button)
    - Duplicate (outline button)
    - Delete (coral/red button)

Empty State:
- Centered illustration (simple line art, bold outlines)
- Message: "No pipelines yet"
- Subtitle: "Create your first pipeline to start extracting data"
- Large "Create Pipeline" yellow button
```

---

### 4. Pipeline Editor

```
Design a pipeline editor page for "DocXTractor" – create/edit extraction pipelines.

Style: Neubrutalism / RetroUI

Layout:
- Sidebar (consistent)
- Main content: centered container (max-w-4xl)

Header:
- Breadcrumb: Pipelines > Edit Pipeline (with chevron separators)
- Pipeline name: Large editable input (text-2xl)
- Right side: Save button (yellow), Cancel button (outline)

Form Sections (stacked cards with 16px gap):

1. Basic Info Card:
- 3px black border, white background, 4px shadow
- Heading: "Basic Information"
- Fields:
  - Name (text input, inset styling)
  - Description (textarea, 4 rows)
  - Output Format (dropdown: JSON/CSV/Both)

2. Field Schema Table Card:
- Heading: "Extraction Fields"
- "Add Field" button (yellow, plus icon)
- Table with columns:
  | Field Name | Data Type | Extraction Mode | Consensus | Citations | Actions |
- Data Type dropdown: Text, Number, Date, Email, Phone, Currency
- Extraction Mode toggle: AI or Deterministic (toggle switch)
- **NEW: Consensus Voting column**:
  - Toggle switch (yellow when enabled)
  - When enabled: dropdown for run count (3, 5, 7)
  - Tooltip: "Run multiple extractions and use voting for higher accuracy"
- **NEW: Citation Tracking column**:
  - Toggle switch (yellow when enabled)
  - Tooltip: "Track source location for each extracted value"
- Actions: Edit icon, Delete icon (coral)

3. Field Detail Panel (expanded below selected row):
- Neumorphic card with inset shadow
- IF AI Mode:
  - Prompt Template textarea with syntax highlighting hint
  - Few-Shot Examples section:
    - "Add Example" button
    - Example cards: Sample Input (left) → Expected Output (right)
  - **NEW: Advanced Options accordion**:
    - Consensus Voting settings:
      - Enable toggle
      - Number of runs slider (3-7)
      - Voting strategy dropdown (Object-level, Field-level)
      - Minimum confidence input (0.5-1.0)
    - Citation Tracking settings:
      - Enable toggle
      - Include confidence scores checkbox
      - Detect inferred values checkbox
- IF Deterministic Mode:
  - Mode selector: Regex / XPath / CSS Selector
  - Pattern input (monospace font)
  - "Test Pattern" button with sample preview

Footer:
- "Save Pipeline" large yellow button with hard shadow
- "Delete Pipeline" link (coral/red text)
```

---

### 5. Run Pipeline / Upload Modal

```
Design a "Run Pipeline" modal dialog for "DocXTractor".

Style: Neubrutalism / RetroUI

Modal:
- Semi-transparent black backdrop (rgba(0,0,0,0.5))
- Modal container:
  - White background
  - 4px thick black border
  - 8px hard offset shadow
  - max-w-lg width
  - 24px padding

Header:
- "Run Pipeline: [Pipeline Name]" (text-xl, font-bold)
- Close X button (top right, outline style)

Content Sections:

1. Document Upload:
- Drag-and-drop zone:
  - Dashed 2px border (black)
  - 16px padding
  - Icon: upload cloud
  - Text: "Drag files here or click to browse"
  - Subtext: "PDF, DOCX, TXT, HTML supported"
- File list (when files added):
  - Each file: icon, name, size, remove button
  - List style with 1px border separators

2. URL Input Section:
- Divider with "OR" badge in center
- URL input with "Add" button inline
- List of added URLs with remove buttons

3. Run Options (NEW):
- Collapsible accordion "Advanced Options"
- When expanded:
  - **Enable Consensus Voting**: checkbox + info tooltip
    - "Run extractions multiple times and use voting"
  - **Number of consensus runs**: dropdown (3, 5, 7)
  - **Enable Citation Tracking**: checkbox
    - "Track source locations for verification"

4. Preview Summary:
- Card showing: "4 documents ready • Consensus: 3 runs • Citations: On"

Footer:
- "Start Extraction" yellow primary button (full width)
- "Cancel" outline button
- Show progress if files uploading
```

---

### 6. Execution Monitor / Job Details Page

```
Design a job execution monitor page for "DocXTractor".

Style: Neubrutalism / RetroUI

Layout:
- Sidebar (consistent)
- Main content area

Header:
- Breadcrumb: Jobs > Job #12345
- Job title with pipeline name
- Status badge (large):
  - "In Progress": yellow bg, black border, spinner icon
  - "Completed": green bg, black border, checkmark icon
  - "Failed": red bg, black border, X icon
- Action buttons: Pause, Cancel, Retry Failed (outline buttons with icons)

Progress Section:
- Large progress bar:
  - Track: light gray bg, 2px black border
  - Fill: gradient yellow to green, animated
- Text: "Processing document 3 of 10..."
- Below: Time elapsed | Estimated remaining

Document List:
- Card container with 2px border
- Each document row:
  - File icon + document name
  - Status icon: checkmark (green), spinner (yellow), X (red)
  - **NEW: Confidence badge**:
    - High (≥0.9): green badge "High Confidence"
    - Medium (0.7-0.9): yellow badge "Medium"
    - Low (<0.7): red badge "Review Needed"
  - Processing time
  - Click indicator (arrow)

Expanded Document Detail Panel (when row clicked):
- Neumorphic panel with inset shadow
- Tab bar: "Extracted Data" | "Citations" | "Consensus" | "Logs"

**Extracted Data Tab:**
- JSON viewer with syntax highlighting
- Copy button

**NEW: Citations Tab (Citation Viewer):**
- Split view layout:
  - Left (50%): Extracted data tree view
    - Each field clickable
    - Fields with low confidence highlighted yellow
  - Right (50%): Document preview
    - PDF/image viewer
    - Highlighted regions for selected field
    - Yellow (#fde047) highlight with black border
    - Tooltip showing line reference (e.g., "Page 1, Line 5")
- Bottom bar: field path, confidence score, source reference

**NEW: Consensus Tab (Consensus Details):**
- Overall agreement score (circular progress indicator)
- Confidence level badge (High/Medium/Low)
- Field-level voting table:
  | Field | Agreement | Values | Winner |
  - Agreement: percentage bar
  - Values: what each run extracted
  - Winner: the selected value with checkmark
- Tie-breaker info if applicable
- Collapsible: Raw voting details JSON

**Logs Tab:**
- Monospace text with timestamps
- Color-coded levels: info (gray), warning (yellow), error (red)
- Auto-scroll to bottom option

Sidebar Stats Panel:
- Quick stats in stacked badges:
  - Completed: green badge with count
  - In Progress: yellow badge with count
  - Failed: red badge with count
  - **NEW: Needs Review**: orange badge with count
```

---

### 7. Jobs List Page

```
Design a jobs/runs list page for "DocXTractor".

Style: Neubrutalism / RetroUI

Layout:
- Consistent sidebar
- Main content

Header:
- "Extraction Jobs" title
- "New Job" button (if needed)

Filter Bar:
- Status dropdown (All, Completed, In Progress, Failed, Needs Review)
- Date range picker
- Pipeline selector
- Confidence filter dropdown (All, High, Medium, Low) **NEW**
- Each filter: inset styling, 2px black border

Jobs Table:
- Container with 3px black border
- Header row with gray background
- Columns:
  - Job ID (link style)
  - Pipeline Name
  - Documents (count)
  - Status (badge)
  - **Confidence (badge)** - NEW
  - Started (date)
  - Duration
  - Actions (View, Retry, Delete)
- Row hover: yellow tint
- Status badges: colored with 2px black border

Pagination:
- Page numbers with border buttons
- Previous/Next with arrow icons
- Showing "1-10 of 45 jobs"

Empty State:
- Line art illustration
- "No jobs found" message
- Filter reset button
```

---

### 8. Citation Viewer / Review Screen

```
Design a citation viewer and human validation screen for "DocXTractor".

Style: Neubrutalism / RetroUI

Purpose: Review extractions with source document highlighting.

Layout:
- Full-width split view (no sidebar, or collapsible sidebar)
- Left panel (50%): Document Viewer
- Right panel (50%): Extraction Results
- Bottom bar: Actions and progress

Left Panel - Document Viewer:
- Toolbar:
  - Zoom controls (+/-)
  - Page navigation (prev/next, page input)
  - Fit to width/height toggles
- Document display:
  - PDF/Image rendered
  - Highlighted regions for extracted values
  - Highlight style: yellow (#fde047) background, 2px black border
  - Hover tooltip: field name and value

Right Panel - Extraction Results:
- Card for each extracted field:
  - Field name (bold)
  - Extracted value (editable input)
  - **NEW: Source citation**:
    - Page and line reference (e.g., "p1_l5")
    - "View in Document" button (jumps to source)
  - **NEW: Confidence score**:
    - Progress bar (green/yellow/red based on score)
    - Percentage text
  - **NEW: Inferred indicator**:
    - If value was calculated, show "Inferred" badge with info icon
    - Tooltip shows reasoning
  - Action buttons:
    - Accept (green checkmark)
    - Edit (pencil icon)
    - Reject (red X)
- Clicking field highlights corresponding region in document

**NEW: Consensus Details (if enabled):**
- Collapsible accordion per field
- Shows: "3/3 runs agreed" or "Tie broken by: random"
- Voting breakdown table

Footer Bar:
- Progress indicator: "Document 2 of 5 needing review"
- "Previous" and "Next" navigation buttons
- "Submit All" primary yellow button
- "Skip Document" secondary button

Visual Cues:
- Low confidence items: pulsing yellow border, warning icon
- Inferred values: purple badge "Inferred"
- All confidence: small colored dot (green/yellow/red)
```

---

### 9. Settings Page

```
Design a settings page for "DocXTractor".

Style: Neubrutalism / RetroUI

Layout:
- Sidebar (consistent)
- Main content with tabbed sections

Tab Navigation:
- Horizontal tabs: Profile, API Keys, Notifications, Appearance, **Extraction** (NEW)
- Active tab: yellow underline or background

Tab 1 - Profile Settings:
- Card with 3px border
- User avatar (circular, thick border, editable)
- Full name field (read-only with edit button)
- Email field (read-only)
- Change password section (collapsible)

Tab 2 - API Keys & Secrets:
- "OpenAI API Key" card with masked value
- "Add New Secret" yellow button
- Key list with edit/delete actions
- Security info tooltip

Tab 3 - Notifications:
- Toggle switches for:
  - Email on job completion
  - Email on job failure
  - **Email on low-confidence results** (NEW)
- Switches: thick track, yellow when on

Tab 4 - Appearance:
- Theme toggle (Light/Dark)
- Accent color picker (optional)

**Tab 5 - Extraction Settings (NEW):**
- Card: "Default Extraction Options"
- **Consensus Voting defaults:**
  - Enable by default: toggle
  - Default run count: dropdown (3, 5, 7)
  - Default voting strategy: dropdown
- **Citation Tracking defaults:**
  - Enable by default: toggle
  - Include confidence scores: checkbox
  - Detect inferred values: checkbox
- **Confidence thresholds:**
  - High threshold: input (default 0.9)
  - Low threshold: input (default 0.7)
  - Auto-flag below: input (triggers review)

Footer:
- "Save Changes" yellow button (sticky)
```

---

### 10. Output Download / Results Preview

```
Design a results download modal/page for "DocXTractor".

Style: Neubrutalism / RetroUI

Modal or expanded panel after job completion:

Header:
- "Extraction Complete" with large green checkmark icon
- Job summary: "10 documents processed • 9 succeeded • 1 failed"
- **NEW: "Average confidence: 92%"** with colored indicator

Preview Section:
- Tab toggle: "JSON" | "CSV" | **"With Citations"** (NEW)
- Code block preview:
  - Scrollable with max-height
  - Syntax highlighting
  - Monospace font
- **NEW: Citations toggle** to show/hide source references in preview

Download Actions:
- "Download JSON" button (yellow, primary)
- "Download CSV" button (outline)
- **"Download with Citations"** button (outline) - NEW
- "Download All (ZIP)" if multiple files

**NEW: Confidence Summary Card:**
- Pie chart or bar showing: High/Medium/Low distribution
- List of fields below threshold
- "Review flagged fields" link

Stats Summary:
- Total processing time
- Success rate percentage
- API tokens used (if applicable)
- Links to view failed documents
```

---

### 11. Mobile Responsive Views

```
Design mobile responsive versions of DocXTractor.

Style: Neubrutalism / RetroUI (maintained on mobile)

Key Adaptations:
- Hamburger menu replaces fixed sidebar
- Slide-out drawer for navigation (from left)
- Cards stack vertically (full width, padding 16px)
- Tables become horizontal scrollable OR convert to card lists
- Buttons remain bold, touch-friendly (min 44px tap target)
- Modals become full-screen sheets from bottom
- Same thick borders and hard shadows, appropriately scaled
- Citation viewer: tabs instead of split view

Screens to Design:
1. Mobile Dashboard:
   - Collapsed stats (2x2 grid)
   - Recent pipelines as vertical cards
   - Hamburger menu icon

2. Mobile Pipeline List:
   - Vertical card stack
   - Floating "+" button for new pipeline

3. Mobile Job Monitor:
   - Stacked progress sections
   - Swipeable document cards
   - Bottom sheet for details

4. Mobile Citation Viewer:
   - Tab-based: "Document" | "Data" | "Citations"
   - Full-screen document view
   - Swipe between tabs

5. Mobile Navigation Drawer:
   - Full-height overlay
   - Logo at top
   - Navigation items (large touch targets)
   - User info at bottom
```

---

### 12. Empty/Error States

```
Design empty and error state illustrations for "DocXTractor".

Style: Simple line art matching Neubrutalism aesthetic
- Bold outlines (2-3px)
- Minimal color (accent yellow, black lines)
- Playful but professional

States Needed:

1. No Pipelines Yet:
   - Document with plus icon
   - Text: "Create your first pipeline"
   - Yellow primary button

2. No Jobs Running:
   - Idle document/clock icon
   - Text: "Start a new extraction"

3. Upload File:
   - Drag zone with floating file icons
   - Animated dashed border

4. Error/Failed:
   - Broken document or warning triangle
   - Red accent color
   - "Something went wrong" + retry button

5. Loading:
   - Document with progress bar or spinning gear
   - "Processing your documents..."

6. Success:
   - Document with bold checkmark
   - Optional celebration elements (confetti style)

7. **NEW: Low Confidence Alert:**
   - Document with question mark
   - Yellow warning color
   - "Some extractions need review"

8. **NEW: No Citations Found:**
   - Document with missing link icon
   - "No source references available"

Each illustration: ~200x200px, works on white and cream backgrounds
```

---

## 📐 RetroUI Component Library Reference

**IMPORTANT**: Use RetroUI components from https://www.retroui.dev/docs/components as the foundation.

### Available RetroUI Components

| Component | Usage |
|-----------|-------|
| Button | Primary actions, nav items |
| Badge | Status indicators, tags |
| Card | Content containers |
| Input | Form fields |
| Textarea | Multi-line input |
| Avatar | User images |
| Accordion | Collapsible sections |
| Alert | Notifications |
| Dialog/Modal | Overlays |
| Table | Data display |
| Dropdown | Select menus |
| Toggle/Switch | Boolean options |
| Progress | Loading/completion |

### Component Styling Patterns

#### Buttons
- **Primary**: Yellow `#fde047` fill, 2px black border, hard shadow, translate on hover
- **Outline**: Transparent fill, 2px black border, hard shadow
- **Danger**: Coral `#f87171` fill, 2px black border
- **Ghost**: No fill/border, hover adds background

#### Input Fields
- Inset/sunken appearance with subtle inner shadow
- 2px black border
- White background
- 8-12px padding
- Focus: shadow reduces, optional yellow ring

#### Cards
- White background
- 2-3px black border
- 4-6px hard offset shadow (no blur)
- 8px border radius
- 16-24px internal padding

#### Badges/Tags
- Small rounded rectangles
- 2px thick borders
- Status colors: Green (success), Yellow (pending), Red (error), Purple (inferred)

#### Tables
- Black border around container
- Header row with muted gray background
- Row hover: subtle yellow tint
- Cell borders: lighter gray or no internal borders

---

## 🆕 New Feature-Specific UI Elements

### Consensus Voting UI

#### Field-Level Toggle (Pipeline Editor)
```
┌──────────────────────────────────────────┐
│ Enable Consensus Voting                  │
│ ┌──────┐  Runs: ┌───────────────┐       │
│ │  ON  │        │ 3 ▼           │       │
│ └──────┘        └───────────────┘       │
│ ℹ️ Run multiple extractions and vote    │
└──────────────────────────────────────────┘
```

#### Confidence Badge Styles
- **High (≥0.9)**: Green background `#22c55e`, black text, "High Confidence"
- **Medium (0.7-0.9)**: Yellow background `#fde047`, black text, "Medium"
- **Low (<0.7)**: Red background `#f87171`, black text, "Review Needed"

#### Consensus Results Panel
- Circular agreement score indicator
- Per-field voting breakdown table
- Tie-breaker explanation (if used)

### Citation Tracking UI

#### Citation Reference Badge
```
┌────────────────────────────────┐
│ 📍 Page 1, Line 5-7           │
│ Confidence: ████████░░ 85%    │
└────────────────────────────────┘
```

#### Split-View Citation Viewer
- Left: PDF/document with highlighted regions
- Right: Extracted data with source references
- Connection lines or number markers linking fields to sources

#### Inferred Value Indicator
- Purple badge "Inferred"
- Info icon with tooltip showing reasoning
- Different border style (dashed?)

---

## 🖼️ Example Prompt Template

Use this template for generating any screen:

```
Design [SCREEN NAME] for "DocXTractor" – an AI-powered document extraction app.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

Design Tokens:
- Primary: Yellow #fde047
- Background: White #FFFFFF or Cream #F7F7F5
- Text: Black #000000
- Borders: 2-4px thick black
- Shadows: Hard 4-6px offset, no blur
- Typography: Inter or Public Sans, bold headings
- Border radius: 4-8px

Layout:
[Describe the layout structure]

Components:
[List key components using RetroUI patterns]

States:
[Describe interactive states - hover, active, empty, error]

New Features to Include:
- Consensus Voting: [how it appears on this screen]
- Citations: [how it appears on this screen]
- Confidence indicators: [where they appear]

Notes:
[Any specific requirements or interactions]
```

---

## ✅ Design Checklist

Before finalizing each screen, verify:

### Core Style
- [ ] Follows Neubrutalism aesthetic (thick borders, hard shadows)
- [ ] Uses RetroUI component patterns
- [ ] Uses correct color palette (yellow primary, black/white contrast)
- [ ] Typography is Inter/Public Sans with proper hierarchy
- [ ] Buttons have translate effect on hover/active

### Functionality
- [ ] Buttons are clearly actionable and accessible
- [ ] Responsive considerations are addressed
- [ ] Empty and error states are designed
- [ ] Interactive/hover states are defined

### New Features (v2.0)
- [ ] Consensus Voting UI elements included where applicable
- [ ] Citation Tracking UI elements included where applicable
- [ ] Confidence indicators (badges/scores) shown appropriately
- [ ] Split-view Citation Viewer designed for Job Details
- [ ] Inferred value indicators designed
- [ ] Review flow for low-confidence extractions included

### Consistency
- [ ] Consistent with other screens in the app
- [ ] Meets accessibility standards (contrast, tap targets)
- [ ] Icons are consistent (Lucide or similar flat style)

---

## 📚 Resources

- **RetroUI Documentation**: https://www.retroui.dev/docs
- **RetroUI Components**: https://www.retroui.dev/docs/components
- **RetroUI GitHub**: https://github.com/logging-stuff/retroui
- **TailwindCSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons

---

*Updated for DocXTractor v2.0 – Includes Consensus Voting and Citation Tracking features*
*Design System: RetroUI (NeoBrutalism styled React + TailwindCSS)*
