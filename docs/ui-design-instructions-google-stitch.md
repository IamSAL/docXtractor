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


| Token                 | Value                  | TailwindCSS Class            |
| ----------------------- | ------------------------ | ------------------------------ |
| **Primary**           | `#fde047` (Yellow)     | `bg-primary`                 |
| **Primary Hover**     | `#fcd34d`              | `hover:bg-primary-hover`     |
| **Background**        | `#FFFFFF` or `#F7F7F5` | `bg-background`              |
| **Foreground (Text)** | `#000000`              | `text-foreground`            |
| **Muted Background**  | `#f4f4f5`              | `bg-muted`                   |
| **Muted Foreground**  | `#71717a`              | `text-muted-foreground`      |
| **Border**            | `#000000` (2px)        | `border-2 border-foreground` |
| **Accent Teal**       | `#14b8a6`              | Custom                       |
| **Accent Coral/Red**  | `#f87171`              | Custom                       |
| **Accent Purple**     | `#a855f7`              | Custom                       |
| **Success Green**     | `#22c55e`              | Custom                       |
| **Warning Yellow**    | `#eab308`              | Custom                       |
| **Border Width**      | 2px–4px               | `border-2` or `border-4`     |
| **Border Radius**     | 4px–8px               | `rounded` or `rounded-lg`    |
| **Shadow**            | Hard 4px–8px offset   | `shadow-md`, no blur         |
| **Typography**        | Inter or Public Sans   | `font-head`, `font-sans`     |

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
  - Extractors
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
  - Right side: "New Extractor" primary yellow button with plus icon

Stats Row:
- Grid of 4 stat cards
- Each card:
  - White background
  - 2px black border
  - 4px hard offset shadow
  - Large bold number (text-4xl)
  - Small label below (text-muted-foreground)
- Stats: Total Extractors, Active Jobs, Documents Processed, Success Rate

Recent Extractors Section:
- Section heading: "Recent Extractors"
- Grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Extractor cards:
  - 3px black border, 4px hard shadow
  - 8px border radius
  - Extractor name (bold), description preview
  - Colored icon for extraction type
  - Last run date badge
  - Hover: slight lift (shadow reduces)

Recent Jobs Table:
- Section heading: "Recent Extraction Jobs"
- Table container with 2px black border
- Columns: Job ID, Extractor, Documents, Status, Date
- Status badges:
  - Success: green background (#22c55e), black border
  - In Progress: yellow background (#fde047), black border
  - Failed: red background (#f87171), black border
- Row hover: subtle yellow tint
```

---

### 3. Extractor List Page

```
Design a extractor list/management page for "DocXTractor".

Style: Neubrutalism / RetroUI

Layout:
- Same sidebar as dashboard
- Main content area

Header:
- "My Extractors" title (text-3xl, font-bold)
- "New Extractor" yellow button with plus icon (right side)

Filters Row:
- Search input (inset styling, 2px border)
- Status filter dropdown
- Extraction type filter (AI/Deterministic)
- Sort dropdown (Date, Name, Runs)

Extractor Grid:
- Each extractor as a card with:
  - 3px black border, 4px hard offset shadow
  - White background
  - Extractor name (text-xl, font-bold)
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
- Message: "No extractors yet"
- Subtitle: "Create your first extractor to start extracting data"
- Large "Create Extractor" yellow button
```

---

### 4. Extractor Editor

```
Design a comprehensive extractor editor page for "DocXTractor" – create/edit extraction extractors with full schema configuration.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

=== LAYOUT STRUCTURE ===

Overall Layout:
- Consistent sidebar on left (240px)
- Main content area: centered container (max-w-5xl for wider tables)
- Cream background (#F7F7F5)
- Scrollable main content with sticky header

=== HEADER SECTION ===

Top Header Bar:
- Breadcrumb navigation:
  - "Extractors" (link, text-muted-foreground) > 
  - Chevron icon > 
  - "[Extractor Name]" or "New Extractor" (current, text-foreground)
  - Breadcrumb items: text-sm, hover:underline
- Extractor name: 
  - Inline editable input (text-2xl, font-bold)
  - Pencil icon appears on hover
  - Click to edit mode with focus ring
  - Placeholder: "Untitled Extractor"

Right Header Actions:
- "Test Extractor" button (outline, with play icon)
  - Tooltip: "Test with a sample document"
- "Duplicate" button (outline, with copy icon)
- "Save Extractor" button (yellow primary, with save icon)
- "Cancel" button (ghost, text only)

Version Indicator (if editing existing):
- Small badge: "v1.2" or "Draft" 
- Last saved timestamp: "Saved 2 minutes ago"

=== SECTION 1: BASIC INFORMATION CARD ===

Card Container:
- White background
- 3px black border
- 4px hard offset shadow (bottom-right)
- 24px padding
- 8px border radius

Section Header:
- "Basic Information" (text-xl, font-bold)
- Info icon with tooltip: "Configure extractor metadata and output settings"

Form Fields (vertical stack, 16px gap):

1. Extractor Name:
   - Label: "Extractor Name" (font-medium) + required asterisk (red)
   - Input: Full width, inset styling, 2px black border
   - Placeholder: "e.g., Invoice Data Extractor"
   - Validation: Red border + error message if empty on save

2. Description:
   - Label: "Description" (font-medium)
   - Textarea: 4 rows, inset styling, 2px black border
   - Placeholder: "Describe what this extractor extracts..."
   - Character count: "0/500" (text-muted-foreground, right aligned)

3. Output Format:
   - Label: "Output Format" (font-medium)
   - Segmented button group (not dropdown):
     - "JSON" | "CSV" | "Both"
     - Active: yellow background, black border
     - Inactive: white background, black border
   - Helper text: "Choose how extracted data will be formatted"

4. Extractor Template (optional):
   - Label: "Start from Template" (font-medium)
   - Dropdown with icons:
     - "Blank Extractor" (default)
     - "📄 Invoice Parser"
     - "📋 Contract Extractor"
     - "📨 Receipt Scanner"
   - Badge: "Sample templates to get started quickly"

=== SECTION 2: FIELD SCHEMA TABLE CARD ===

Card Container:
- White background
- 3px black border
- 4px hard offset shadow
- 24px padding

Section Header Row:
- Left: "Extraction Fields" (text-xl, font-bold)
- Left badge: Field count "4 fields defined"
- Right: "Add Field" button (yellow, plus icon)
  - On click: Adds new row at bottom in edit mode

Table Container:
- 2px black border around table
- Rounded corners (8px)

Table Header Row:
- Gray background (#f4f4f5)
- Columns with tooltips on header hover:

| Column | Width | Description |
|--------|-------|-------------|
| # | 40px | Row number (drag handle for reorder) |
| Field Name | 180px | Unique identifier for the field |
| Data Type | 120px | Expected data format |
| Extraction Mode | 140px | AI or Deterministic |
| Consensus | 100px | Enable voting for accuracy |
| Citations | 100px | Track source locations |
| Confidence | 100px | Minimum threshold |
| Actions | 100px | Edit, duplicate, delete |

Table Body Rows (per field):

1. Row Number (#):
   - Drag handle icon (6 dots)
   - Row number (1, 2, 3...)
   - Hover: cursor-grab

2. Field Name:
   - Inline editable text
   - Format: snake_case or camelCase
   - Validation: unique, no spaces
   - Example: "invoice_number", "total_amount"

3. Data Type Dropdown:
   - Options with icons:
     - 📝 Text (default)
     - 🔢 Number
     - 📅 Date
     - 📧 Email
     - 📞 Phone
     - 💰 Currency
     - 🔗 URL
     - ✅ Boolean
     - 📋 Array (for multiple values)
   - Selected shows icon + label

4. Extraction Mode Toggle:
   - Segmented toggle: "AI" | "Deterministic"
   - AI selected: Purple/violet tint
   - Deterministic selected: Teal tint
   - Tooltip on each:
     - AI: "Use LLM to intelligently extract this field"
     - Deterministic: "Use regex, XPath, or CSS selectors"

5. Consensus Voting Toggle:
   - Toggle switch (yellow when ON)
   - When ON: Mini dropdown appears inline
     - Options: "3 runs", "5 runs", "7 runs"
   - Tooltip: "Run multiple extractions and use majority voting for higher accuracy (15-30% improvement)"
   - Badge when enabled: "3x" in yellow circle

6. Citation Tracking Toggle:
   - Toggle switch (yellow when ON)
   - Tooltip: "Track source page and line for each extracted value"
   - Badge when enabled: "📍" citation icon

7. Minimum Confidence:
   - Small number input (0.5-1.0)
   - Stepper buttons (+/-)
   - Default: 0.7
   - Visual indicator: 
     - Green if ≥0.9
     - Yellow if 0.7-0.9
     - Red if <0.7
   - Tooltip: "Values below this threshold will be flagged for review"

8. Actions Column:
   - Expand/Edit button (chevron down or pencil icon)
     - Expands detail panel below row
   - Duplicate button (copy icon)
   - Delete button (trash icon, coral/red color)
     - Confirmation tooltip: "Delete this field?"

Row States:
- Default: Light background
- Hover: Subtle yellow tint (#fef9c3)
- Selected/Expanded: Yellow left border (4px), light yellow background
- Error: Red left border, light red background
- Drag active: Elevated with shadow, semi-transparent

Empty State (no fields):
- Centered illustration (simple document outline)
- Text: "No fields defined yet"
- Subtext: "Add your first extraction field to get started"
- "Add Field" large yellow button

=== SECTION 3: FIELD DETAIL PANEL (Expandable) ===

Appears below selected row, pushes other rows down.

Panel Container:
- Neumorphic styling: inset shadow effect
- Light gray background (#f7f7f7)
- 2px black border (dashed on top connecting to row)
- 20px padding
- Animated slide-down on expand

Panel Header:
- Field name (text-lg, font-bold)
- Data type badge
- "Collapse" button (chevron up) on right

=== IF AI EXTRACTION MODE ===

Tab Navigation (within panel):
- "Prompt" | "Few-Shot Examples" | "Advanced"
- Active tab: yellow underline

--- Prompt Tab ---

1. AI Provider Selector:
   - Segmented button: "OpenAI" | "LangExtract"
   - OpenAI selected: Shows model dropdown
     - Options: "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"
   - LangExtract: Uses configured schema

2. System Prompt Template:
   - Label: "Extraction Prompt"
   - Large textarea (8 rows minimum)
   - Monospace font styling
   - Syntax highlighting hints ({{field_name}} in yellow)
   - Placeholder example:
     ```
     Extract the invoice number from the document.
     The invoice number is typically found in the header
     and follows patterns like "INV-XXXX" or "Invoice #XXXX".
     Return only the invoice number, nothing else.
     ```
   - Helper text: "Use {{document_content}} to reference the parsed text"

3. Output Format Hint:
   - Label: "Expected Output Format"
   - Short input
   - Placeholder: "e.g., INV-12345 or a number like 42.50"

4. Validation Rules (optional):
   - Collapsible section
   - Regex pattern for validation
   - Min/Max length
   - Required checkbox

--- Few-Shot Examples Tab ---

Section Header:
- "Training Examples" (font-bold)
- Subtext: "Provide sample inputs and expected outputs to improve accuracy"
- "Add Example" button (yellow, plus icon)

Examples List:
- Vertical stack of example cards

Each Example Card:
- 2px black border
- White background
- Remove button (X) in top-right corner
- Two-column layout:

  Left Column (50%):
  - Label: "Sample Input"
  - Textarea (4 rows)
  - Placeholder: "Paste a text excerpt from a document..."
  - Pre-styled code block appearance

  Right Column (50%):
  - Arrow icon (→) between columns
  - Label: "Expected Output"
  - Input field
  - Placeholder: "What should be extracted..."

Example Card States:
- Empty: Dashed border, "Click to add example content"
- Filled: Solid border
- Minimum: Show "Add at least 2-3 examples for best results" tip

--- Advanced Tab ---

Accordion sections (expandable):

1. Consensus Voting Settings:
   - Enable toggle (synced with table toggle)
   - Number of runs: Slider (3-7) with value display
   - Voting Strategy dropdown:
     - "Object-level" – Compare entire results
     - "Field-level" – Vote per field independently
   - Tie-breaker dropdown:
     - "Random selection"
     - "Retry extraction"
     - "Mark as needs review"
   - Minimum Agreement: Slider (0.5-1.0)
     - Visual: colored progress bar

2. Citation Tracking Settings:
   - Enable toggle (synced with table toggle)
   - Include confidence scores: Checkbox
   - Detect inferred values: Checkbox
     - Tooltip: "Flag values that were calculated rather than directly extracted"
   - Track bounding boxes: Checkbox (for OCR/images)

3. Post-Processing:
   - Trim whitespace: Checkbox (default on)
   - Convert to uppercase/lowercase: Dropdown
   - Apply regex transformation: Input field
   - Custom JavaScript function: Code textarea (advanced)

=== IF DETERMINISTIC EXTRACTION MODE ===

Panel shows different content:

1. Extraction Method Selector:
   - Large segmented button group:
     - "📐 Regex" | "🌲 XPath" | "🎨 CSS Selector"
   - Each shows appropriate input below

2. Pattern Input (for Regex):
   - Label: "Regular Expression Pattern"
   - Large monospace input
   - Placeholder: "e.g., Invoice\\s*#?\\s*(\\d+)"
   - Syntax validation (red border if invalid)
   - Cheat sheet link: "Regex reference →"

3. XPath Input (for XPath):
   - Label: "XPath Expression"
   - Monospace input
   - Placeholder: "e.g., //div[@class='invoice-number']/text()"
   - For HTML/XML documents

4. CSS Selector Input (for CSS):
   - Label: "CSS Selector"
   - Input field
   - Placeholder: "e.g., .invoice-header .number"

5. Pattern Flags (for Regex):
   - Checkbox group:
     - Case insensitive (i)
     - Global match (g)
     - Multiline (m)

6. Test Pattern Section:
   - "Test Pattern" button (yellow)
   - Sample input textarea (collapsible)
   - Results preview card:
     - Shows matched text highlighted
     - Captured groups listed
     - "No matches found" state with red icon

7. Multiple Values:
   - Checkbox: "Extract all matches (returns array)"
   - Default: Extract first match only

=== SECTION 4: EXTRACTOR SETTINGS CARD (Optional) ===

Card Container (same styling as other cards):

Section Header:
- "Extractor Settings" (text-xl, font-bold)

Global Options:

1. Default Processing Mode:
   - Dropdown: "Unified Extraction" | "Per-Document" | "Hybrid"
   - Helper text explaining each mode

2. Default Consensus Settings:
   - Enable for all AI fields: Toggle
   - Default run count: Dropdown

3. Default Citation Settings:
   - Enable for all fields: Toggle

4. Error Handling:
   - On field extraction failure:
     - "Continue with remaining fields"
     - "Stop and mark job as failed"
     - "Retry up to 3 times"

=== FOOTER / ACTION BAR ===

Sticky footer (fixed at bottom when scrolling):
- White background
- Top border (2px black)
- Padding: 16px 24px

Left Side:
- "Delete Extractor" button (ghost, coral/red text)
  - Only shown when editing existing extractor
  - Confirmation modal on click

Center:
- Validation status:
  - "✓ Extractor valid" (green text)
  - "⚠ 2 issues to fix" (yellow text, clickable to scroll to errors)

Right Side:
- "Cancel" button (outline)
- "Save as Draft" button (outline)
- "Save Extractor" button (yellow primary, large)
  - Disabled state if validation fails
  - Loading spinner when saving

=== VALIDATION STATES ===

Form Validation Visual Cues:
- Required field missing: Red border, red asterisk, error text below
- Invalid pattern (regex): Red border, "Invalid regex syntax" message
- Duplicate field name: Red border, "Field name must be unique"
- Missing few-shot examples warning: Yellow border, "Consider adding examples"

Toast Notifications:
- Success: "Extractor saved successfully" (green, checkmark icon)
- Error: "Failed to save extractor" (red, X icon)
- Warning: "Extractor saved with warnings" (yellow, warning icon)

=== INTERACTIONS & ANIMATIONS ===

Micro-interactions:
- Buttons: translate-y on hover/active (RetroUI pattern)
- Card expand: Smooth slide-down animation (200ms)
- Toggle switches: Smooth slide with spring effect
- Drag-and-drop rows: Smooth reorder with placeholder
- Tab switches: Fade transition

Keyboard Navigation:
- Tab through all form fields
- Enter to save inline edits
- Escape to cancel edits
- Arrow keys in dropdowns

Auto-save (optional):
- Debounced auto-save to draft (30 seconds)
- "Unsaved changes" indicator in header

=== RESPONSIVE BEHAVIOR ===

Tablet (768px-1024px):
- Table becomes horizontally scrollable
- Some columns hidden by default (Confidence, Citations)
- Field detail panel full width

Mobile (< 768px):
- Table converts to card list (one card per field)
- Each field card shows key info, expandable for details
- Sticky footer remains
- Sidebar becomes hamburger menu
```

---

### 5. Run Extractor / Multi-Source Upload Modal

```
Design a "Run Extractor" modal for "DocXTractor" with multi-source document support.

Style: Neubrutalism / RetroUI

Modal:
- Semi-transparent black backdrop (rgba(0,0,0,0.5))
- Modal container:
  - White background
  - 4px thick black border
  - 8px hard offset shadow
  - max-w-2xl width (larger to accommodate multi-source)
  - 24px padding

Header:
- "Run Extractor: [Extractor Name]" (text-xl, font-bold)
- Subtitle: "Add multiple sources for unified extraction"
- Close X button (top right, outline style)

Content Sections:

1. Multi-Source Upload Zone:
- Large drag-and-drop area:
  - Dashed 3px border (black)
  - 24px padding, min-height 150px
  - Icon: multiple stacked documents
  - Primary text: "Drag multiple files here"
  - Secondary text: "or click to browse"
  - Supported formats badge: "PDF, DOCX, TXT, HTML, Images"

2. Source List (when sources added):
- Card container with 2px border
- Header row: "Sources (X files, Y URLs)" with "Clear All" link
- Each source row:
  - File type icon (PDF, DOCX, URL, etc.)
  - File name or URL (truncated with tooltip)
  - File size (for files) or "Web Page" label
  - Status indicator: ✓ Ready, ⏳ Uploading, ❌ Error
  - Remove button (X icon)
- Visual grouping with alternating backgrounds
- Max visible: 5 sources, then scroll

3. URL Input Section:
- Divider with "ADD URLs" badge in center
- Input row: URL text input + "Add" button (yellow)
- Placeholder: "https://example.com/document"
- Added URLs appear in the Source List above

4. Processing Mode Selection (NEW - Prominent):
- Card with yellow left border (attention highlight)
- Radio button group:
  - ○ **Unified Extraction** (default, recommended)
    - "Combine all sources and extract as single context"
    - Best for: related documents, multi-part contracts
  - ○ **Per-Document Extraction**
    - "Process each source separately, return array of results"
    - Best for: batch processing similar documents
  - ○ **Hybrid (Group Sources)**
    - "Group related sources, extract per group"
    - Shows grouping UI when selected

5. Advanced Options Accordion:
- Collapsible section "Advanced Options"
- When expanded:
  - **Enable Consensus Voting**: toggle + runs dropdown
  - **Enable Citation Tracking**: toggle
  - **Track Source Origin**: checkbox (default on)
    - "Include source file name in citations"

6. Preview Summary Card:
- Yellow background, 2px black border
- Content: 
  "6 sources ready (3 PDFs, 2 DOCX, 1 URL)
   Mode: Unified Extraction
   Consensus: 3 runs • Citations: On"

Footer:
- "Start Extraction" yellow primary button (large)
- "Cancel" outline button
- Upload progress bar (if files still uploading)
```

---

### 6. Execution Monitor / Job Details Page

```
Design a job execution monitor page for "DocXTractor" with multi-source tracking.

Style: Neubrutalism / RetroUI

Layout:
- Sidebar (consistent)
- Main content area

Header:
- Breadcrumb: Jobs > Job #12345
- Job title with extractor name
- **Source count badge**: "6 sources" (shows total sources in job)
- Status badge (large):
  - "In Progress": yellow bg, black border, spinner icon
  - "Completed": green bg, black border, checkmark icon
  - "Failed": red bg, black border, X icon
- Action buttons: Pause, Cancel, Retry Failed (outline buttons with icons)

Progress Section:
- **Multi-stage progress bar** (stacked or segmented):
  - Stage 1: Parsing (blue): "Parsing sources 4/6"
  - Stage 2: Combining (purple): "Combining content..."
  - Stage 3: Extracting (green): "Extracting fields..."
- Overall progress: "Step 2 of 3: Combining 6 sources"
- Time elapsed | Estimated remaining

**Source List Section (NEW - Prominent):**
- Section heading: "Sources" with collapse/expand toggle
- Card container with 2px black border
- Each source row:
  - File type icon (PDF icon, DOCX icon, Globe for URLs)
  - Source name: "invoice_2024.pdf" or "https://example.com/..."
  - Parse status: 
    - ✓ Parsed (green checkmark)
    - ⏳ Parsing (yellow spinner)
    - ❌ Failed (red X with retry button)
  - Page/size info: "5 pages" or "12KB fetched"
  - Expand arrow for details
- **Processing Mode indicator**: "Unified Extraction" badge
- Expanded source detail:
  - Preview of parsed content (first 200 chars)
  - Parse time and metadata
  - Retry button if failed

**Combined Content Preview (for Unified mode):**
- Collapsible card: "Combined Context Preview"
- Shows merged content with source markers:
  - "=== SOURCE 1: invoice.pdf ==="
  - [preview text]
  - "=== SOURCE 2: contract.docx ==="
  - [preview text]
- Total context size indicator
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
- Extractor selector
- Confidence filter dropdown (All, High, Medium, Low) **NEW**
- Each filter: inset styling, 2px black border

Jobs Table:
- Container with 3px black border
- Header row with gray background
- Columns:
  - Job ID (link style)
  - Extractor Name
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

### 8. Citation Viewer / Review Screen (Human-in-the-Loop Validation)

```
Design a comprehensive citation viewer and human validation screen for "DocXTractor" with multi-source document support.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

Purpose: Enable users to review, verify, and correct AI extractions by viewing extracted values alongside their source locations across multiple documents. This is the primary Human-in-the-Loop (HITL) interface for quality assurance.

=== LAYOUT STRUCTURE ===

Overall Layout:
- Full-width view (sidebar collapsed or hidden)
- Three-panel layout for multi-source jobs:
  - Left panel (20%): Source Navigator
  - Center panel (45%): Document Viewer
  - Right panel (35%): Extraction Results & Validation
- Bottom bar: Actions, progress, and navigation
- Toggle to switch between 2-panel and 3-panel modes

Header Bar:
- Left: Back button (arrow) + Job title "Review Job #12345"
- Center: Extractor name badge
- Right: 
  - Processing mode badge ("Unified Extraction" / "Per-Document")
  - Overall confidence indicator (circular progress)
  - "Exit Review" button (outline)

=== LEFT PANEL: SOURCE NAVIGATOR (Multi-Source) ===

Panel Container:
- Light gray background (#f7f7f7)
- 2px black right border
- Collapsible (toggle button at top)

Panel Header:
- "Sources" (font-bold)
- Source count badge: "6 sources"
- Collapse/Expand toggle (chevron icon)

Source List (vertical stack):
- Each source as a card/row

Source Card Contents:
- File type icon:
  - 📄 PDF icon (red tint)
  - 📝 DOCX icon (blue tint)
  - 🌐 URL/HTML icon (green tint)
  - 🖼️ Image icon (purple tint)
  - 📃 TXT icon (gray)
- Source name (truncated with tooltip for full path)
  - Files: "invoice_2024.pdf"
  - URLs: "example.com/terms" (shortened)
- Metadata row:
  - Page count: "5 pages"
  - Parse status icon (✓ green checkmark)
- Citation count badge: "4 citations" (yellow)
- Active indicator: Yellow left border when selected

Source Card States:
- Default: White background
- Hover: Light yellow tint (#fef9c3)
- Active/Selected: Yellow left border (4px), light yellow bg
- Error (parse failed): Red left border, red tint, retry icon

Source Actions (on hover):
- "View" button (eye icon)
- "Re-parse" button (refresh icon) if failed

Combined Context Card (for Unified mode):
- Special card at top: "📦 Combined View"
- Shows merged content from all sources
- Badge: "All sources combined"
- Visual dividers between source sections in viewer

=== CENTER PANEL: DOCUMENT VIEWER ===

Panel Container:
- White background
- 2px black borders (left and right)
- Flexible width (resizable divider)

Toolbar Row:
- Left group:
  - Source name: "[invoice.pdf]" as dropdown to switch sources
  - Page indicator: "Page 2 of 5"
  - Page navigation: ◀ ▶ buttons
  - Direct page input (click to edit)
- Center group:
  - Zoom controls: [-] [100%] [+]
  - Fit options dropdown: "Fit Width" | "Fit Height" | "Actual Size"
- Right group:
  - Search in document input (magnifying glass icon)
  - Download source button (download icon)
  - Fullscreen toggle button

Document Display Area:
- Scrollable container
- Document rendering:
  - PDF: Rendered pages with text layer
  - Images: Displayed with zoom capability
  - HTML/Text: Rendered markdown with line numbers
- Line numbers gutter (left side, monospace, gray)

Citation Highlights:
- Highlighted regions for cited values
- Highlight styles (configurable):
  - Default: Yellow (#fde047) background, 2px black border
  - Selected/Active: Bright yellow with 3px border, pulsing animation
  - Low confidence: Orange (#fb923c) background
  - Inferred: Purple (#d8b4fe) background, dashed border
- Numbered markers on highlights (1, 2, 3...) matching field list
- Hover on highlight:
  - Tooltip with field name, value, and confidence
  - "Jump to field" action

Source Markers (for Unified/Combined view):
- Visual separators between source content:
```

════════════════════════════════════════
📄 SOURCE 2: contract.docx (Pages 1-5)
════════════════════════════════════════

```
- Different background tints per source (subtle)
- Click source header to collapse/expand that section

Minimap (optional, right edge):
- Thumbnail view of all pages
- Highlight positions marked
- Click to jump to page

=== RIGHT PANEL: EXTRACTION RESULTS & VALIDATION ===

Panel Container:
- White background
- 2px black left border
- Scrollable content

Panel Header:
- "Extracted Fields" (text-xl, font-bold)
- Field count: "8 fields"
- Filter dropdown: "All" | "Needs Review" | "Accepted" | "Rejected"
- Sort dropdown: "By confidence" | "By field order" | "By source"

Bulk Actions Bar:
- "Accept All High Confidence" button (green, outline)
- "Reject All Low Confidence" button (red, outline)
- Selection count: "3 of 8 selected"

=== FIELD CARDS (Vertical Stack) ===

Each Field Card:
- 2px black border
- White background
- 16px padding
- 8px border radius
- 4px left border color-coded by status

Card Header Row:
- Field number: "#1" (gray badge)
- Field name: "invoice_number" (font-bold)
- Data type badge: "📝 Text" (small, muted)
- Confidence indicator:
- Circular progress or colored dot
- Green (≥0.9), Yellow (0.7-0.9), Red (<0.7)
- Percentage: "92%"

Value Section:
- Label: "Extracted Value"
- Value display/input:
- Read mode: Value in styled box, click to edit
- Edit mode: Input field with save/cancel buttons
- Monospace font for structured values
- Original value indicator (if edited): 
- Strikethrough original, arrow to new value
- "Edited" yellow badge

=== SOURCE CITATION SECTION (Per Field) ===

Citation Container:
- Light gray background (#f7f7f7)
- 1px black border
- Collapsible (default expanded for low confidence)

Citation Header:
- "📍 Source Citation" (font-medium)
- Multi-source indicator: "From 2 sources" (if spans multiple)

For Single-Source Citation:
- Source badge: "📄 invoice.pdf"
- Location: "Page 1, Lines 5-7"
- "View in Document" button (yellow, small)
- Scrolls document viewer to location
- Highlights the specific region

For Multi-Source Citations (Unified mode):
- Expandable list of source references:
```

📍 Found in 2 sources:
├── 📄 invoice.pdf: Page 1, Line 5 (primary)
└── 📝 contract.docx: Page 3, Line 22 (confirming)

```
- Each source clickable to jump to location
- Primary source indicated with star icon

Citation Metadata:
- Bounding box preview (small thumbnail if OCR)
- Extraction method badge: "AI" or "Regex"
- Timestamp: "Extracted 2 min ago"

=== CONFIDENCE & CONSENSUS SECTION ===

Confidence Details:
- Progress bar (full width, color-coded)
- Score: "87% confidence"
- Threshold indicator: Line at threshold (e.g., 70%)
- Status label: "Above threshold" / "Below threshold - Review needed"

Consensus Voting Panel (if enabled):
- Collapsible accordion: "🗳️ Consensus Details"
- When expanded:

Voting Summary:
- Agreement badge: "3/3 runs agreed" (green) or "2/3 majority" (yellow)
- Confidence level: "High Agreement"

Voting Breakdown Table:
| Run | Extracted Value | Confidence |
|-----|----------------|------------|
| Run 1 | "INV-2024-001" | 94% |
| Run 2 | "INV-2024-001" | 91% |
| Run 3 | "INV-2024-001" | 89% |

- Winner highlighted with yellow background
- Disagreements shown in red text

Tie-Breaker Info (if applicable):
- "Tie broken by: Random selection"
- Link to retry extraction

Inferred Value Indicator (if applicable):
- Purple badge: "🧮 Inferred Value"
- Tooltip/expandable showing reasoning:
- "Calculated from: subtotal ($100) + tax ($8)"
- Source fields referenced

=== FIELD ACTION BUTTONS ===

Action Button Row:
- Accept button (green, checkmark icon):
- "Accept" text on hover
- Adds green left border to card
- Moves card to "Accepted" state
- Edit button (yellow, pencil icon):
- Opens edit mode for value
- Shows save/cancel buttons
- Reject button (red, X icon):
- "Reject" text on hover
- Prompts for rejection reason (optional)
- Adds red left border to card
- Expand button (chevron):
- Shows/hides consensus and citation details

Field Card States:
- Pending Review: Gray left border
- Accepted: Green left border, checkmark overlay
- Rejected: Red left border, strikethrough value
- Edited: Yellow left border, "Modified" badge
- Needs Review: Pulsing yellow border, warning icon

=== BOTTOM ACTION BAR ===

Fixed Footer:
- White background
- 2px black top border
- 16px 24px padding
- Shadow to separate from content

Left Section:
- Progress indicator:
- "Document 2 of 5 needing review" (for per-doc mode)
- "Job review: 15 of 20 fields validated" (for unified mode)
- Progress bar (visual)

Center Section:
- Navigation buttons:
- "◀ Previous" (outline)
- Document/field indicator (current position)
- "Next ▶" (outline)
- Keyboard shortcut hints: "← →" below navigation

Right Section:
- "Skip Document" button (ghost, muted text)
- Tooltip: "Mark as reviewed later"
- "Save Progress" button (outline)
- Auto-save indicator if enabled
- "Submit All" button (yellow primary, large)
- Confirmation count: "Submit 20 validated fields"
- Disabled if required fields pending

=== KEYBOARD SHORTCUTS ===

Display shortcut hints panel (toggleable):
- "?" to toggle shortcuts overlay

Shortcuts:
| Key | Action |
|-----|--------|
| ↑/↓ | Navigate between fields |
| ←/→ | Navigate between documents/sources |
| A | Accept current field |
| R | Reject current field |
| E | Edit current field |
| Enter | Save edit / Confirm action |
| Esc | Cancel edit / Close panel |
| Space | Toggle citation details |
| S | Save progress |
| Tab | Switch panel focus |

=== VISUAL STATES & FEEDBACK ===

Low Confidence Alert:
- Card has pulsing yellow border
- Warning icon next to field name
- "⚠️ Low confidence - Review recommended" message
- Auto-expanded citation section

Inferred Value Visual:
- Purple left border on card
- "🧮 Inferred" badge (purple)
- Info icon with reasoning tooltip
- Calculation breakdown visible

Multi-Source Conflict Visual:
- Orange border on card
- "⚠️ Conflicting sources" warning
- Comparison table showing different values per source
- User must select correct value

Validation Complete State:
- All cards have green left borders
- Confetti animation (subtle)
- "✓ All fields validated" banner
- "Submit" button highlighted/pulsing

=== LOADING & ERROR STATES ===

Loading States:
- Document loading: Skeleton with shimmer effect
- Citation loading: Spinner in citation section
- Source switching: Fade transition

Error States:
- Document failed to render:
- Error icon + message
- "Try refreshing" button
- Fallback to text view option
- Citation not found:
- "Source location unavailable" message
- Manual verification prompt

=== RESPONSIVE BEHAVIOR ===

Tablet (768px-1024px):
- Collapse source navigator by default
- Two-panel layout (document + fields)
- Swipe gestures for navigation
- Floating action buttons

Mobile (< 768px):
- Tab-based single panel view:
- "Sources" | "Document" | "Fields" tabs
- Full-screen document viewer
- Bottom sheet for field details
- Swipe between fields
- Sticky bottom action bar

=== ACCESSIBILITY ===

- High contrast mode support
- Screen reader announcements for field status changes
- Focus indicators on all interactive elements
- ARIA labels for all icons and actions
- Keyboard-only navigation support
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
   - Recent extractors as vertical cards
   - Hamburger menu icon

2. Mobile Extractor List:
   - Vertical card stack
   - Floating "+" button for new extractor

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

1. No Extractors Yet:
   - Document with plus icon
   - Text: "Create your first extractor"
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

## 🔄 Flows Feature (Automation Workflows)

Flows automate the running of existing extraction extractors. Currently, users manually click "Run" on a extractor and upload documents one at a time. **Flows eliminate this manual work** by automatically triggering extractors on schedules, webhooks, file uploads, or form submissions – and routing results to destinations like Google Sheets or Drive.

---

### 13. Flow List Page

```
Design a flow list/management page for "DocXTractor" – view and manage automated extractor runs.

**Context**: Flows are automations that run existing extractors automatically. Instead of manually clicking "Run Extractor" and uploading documents each time, users create a Flow that triggers their extractor on a schedule, webhook, file upload, or form submission. This page shows all configured automations.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

=== LAYOUT STRUCTURE ===

Overall Layout:
- Consistent sidebar on left (240px)
- "Flows" nav item active (between Extractors and Jobs)
- Main content area with cream background (#F7F7F5)

=== HEADER SECTION ===

Header Row:
- Left: "Flows" title (text-3xl, font-bold)
- Right: Button group:
  - "Generate with AI" button (outline, sparkle ✨ icon)
    - Opens AI Flow Generator modal
  - "New Flow" button (yellow primary, plus icon)
    - Navigates to Flow Builder

=== STATS ROW (Optional) ===

Quick Stats Cards (4 cards in row):
- Total Flows (count)
- Active Flows (green badge)
- Runs Today (count)
- Success Rate (percentage with color)

=== FILTER BAR ===

Filter Row:
- Search input (inset styling, magnifying glass icon)
  - Placeholder: "Search flows..."
- Status filter dropdown:
  - "All Statuses"
  - "Active" (green dot)
  - "Paused" (yellow dot)
  - "Draft" (gray dot)
  - "Error" (red dot)
- Trigger filter dropdown:
  - "All Triggers"
  - "📅 Schedule"
  - "🔗 Webhook"
  - "📁 File Upload"
  - "📝 Form"
- Sort dropdown:
  - "Last Run"
  - "Name A-Z"
  - "Created Date"
  - "Most Runs"

=== FLOW CARDS GRID ===

Grid Layout:
- 3 columns on desktop, 2 on tablet, 1 on mobile
- 16px gap between cards

Each Flow Card:
- 3px black border
- White background
- 4px hard offset shadow
- 16px padding
- 8px border radius

Card Header:
- Status indicator dot (left):
  - Green: Active
  - Yellow: Paused
  - Gray: Draft
  - Red: Error
- Flow name (text-lg, font-bold)
- Trigger icon badge (right): 📅 / 🔗 / 📁 / 📝

Mini Flow Diagram (center of card):
- Simplified visual representation:
  ```
  [📅] ──▶ [🔧] ──▶ [📑]
  ```
- Shows: Trigger → Extractor → Destination
- Nodes as small rounded squares with icons
- Connection lines between nodes

Card Body:
- Description (text-muted, 2 lines max, truncated)
- Extractor name badge: "Using: Invoice Parser"

Card Footer (stats row):
- Last run: "2 hours ago" or "Never"
- Run count: "124 runs"
- Success rate: "98%" (green/yellow/red text)

Card Actions (on hover or always visible):
- Toggle switch (activate/pause)
- "Edit" button (pencil icon, outline)
- "Run Now" button (play icon, yellow)
- Overflow menu (three dots):
  - Duplicate
  - View History
  - Delete (red text)

Card States:
- Default: White background
- Hover: Subtle lift (shadow increases to 6px)
- Active flow: Green left border (4px)
- Paused flow: Yellow left border
- Error flow: Red left border, pulsing subtle animation

=== EMPTY STATE ===

When no flows exist:
- Centered illustration (automation/workflow icon, bold line art)
- Heading: "Create your first automation"
- Subtext: "Automate document extraction with event-driven workflows"
- Two large buttons:
  - "Create Flow" (yellow primary)
  - "Generate with AI ✨" (outline)
- Example use cases as small cards:
  - "📅 Daily invoice processing"
  - "📁 Auto-extract uploaded contracts"
  - "🔗 API-triggered data extraction"
```

---

### 14. Flow Builder Canvas

```
Design a visual flow builder canvas for "DocXTractor" – configure automated extractor runs.

**Context**: This is where users set up HOW and WHEN their existing extractors run automatically. Instead of manually running extractors, users connect:
- A TRIGGER (when to run: schedule, webhook, file upload, form)
- Their EXTRACTOR (which existing extractor to execute)
- A DESTINATION (where to send results: Excel, Google Sheets, Drive)

The canvas provides a visual way to configure this automation.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

=== LAYOUT STRUCTURE ===

Overall Layout:
- Full-width view (sidebar collapsed or minimal)
- Three-panel layout:
  - Left panel (220px): Node Palette
  - Center panel (flex): Canvas Area
  - Right panel (300px): Properties Panel
- Top header bar
- Bottom footer bar

=== HEADER BAR ===

Header Container:
- White background
- 2px black bottom border
- 16px padding

Left Section:
- Back button (arrow icon, ghost style)
- Flow name (inline editable, text-xl, font-bold)
  - Pencil icon on hover
  - Click to edit
- Status badge: "Draft" / "Active" / "Paused"

Center Section:
- Zoom controls: [-] [100%] [+]
- Fit to screen button
- Undo/Redo buttons

Right Section:
- "Test Run" button (outline, play icon)
  - Tooltip: "Run flow with test data"
- "Save Draft" button (outline)
- "Activate Flow" button (yellow primary, lightning icon)
  - Changes to "Update Flow" when editing active flow

=== LEFT PANEL: NODE PALETTE ===

Panel Container:
- Light gray background (#f7f7f7)
- 2px black right border
- Scrollable content
- Collapsible (toggle at top)

Panel Header:
- "Nodes" (font-bold)
- Collapse toggle (chevron icon)

Node Categories (accordions):

**Triggers (always start of flow):**
- Section header: "TRIGGERS" (text-xs, uppercase, muted)
- Node items (draggable):
  
  📅 Schedule
  - Label: "Schedule"
  - Description: "Run on a schedule"
  - Icon: Calendar
  
  🔗 Webhook
  - Label: "Webhook"
  - Description: "Trigger via HTTP"
  - Icon: Link
  
  📁 File Upload
  - Label: "File Upload"
  - Description: "On file submission"
  - Icon: Upload
  
  📝 Form Submit
  - Label: "Form"
  - Description: "On form submission"
  - Icon: Clipboard

**Logic (optional, for branching):**
- Section header: "LOGIC"

  ⚡ Condition
  - Label: "Condition"
  - Description: "If/else branching"
  - Icon: Zap
  
  🔍 Filter
  - Label: "Filter"
  - Description: "Filter documents"
  - Icon: Filter

**Processing:**
- Section header: "PROCESS"

  🔧 Extractor
  - Label: "Extractor"
  - Description: "Run extraction"
  - Icon: Cog/Wrench
  - **Note: Only one per flow**

**Outputs (destinations):**
- Section header: "OUTPUTS"

  📊 Excel File
  - Label: "Excel File"
  - Description: "Generate .xlsx"
  - Icon: FileSpreadsheet
  
  📑 Google Sheets
  - Label: "Google Sheets"
  - Description: "Append to sheet"
  - Icon: Table
  
  📂 Google Drive
  - Label: "Google Drive"
  - Description: "Save to Drive"
  - Icon: Cloud
  
  🌐 Webhook Output
  - Label: "Send Webhook"
  - Description: "POST results"
  - Icon: Send

Node Item Style (in palette):
- 2px black border
- White background
- 8px padding
- Icon + Label + small description
- Cursor: grab
- Hover: Yellow tint, shadow appears
- Drag: Semi-transparent, cursor: grabbing

=== CENTER PANEL: CANVAS AREA ===

Canvas Container:
- Light cream background (#F7F7F5)
- Subtle dot grid pattern (every 20px)
- Infinite canvas (pan with drag)
- Zoom range: 25% - 200%

Canvas Interactions:
- Drag from palette to add node
- Click node to select (shows properties)
- Drag node to reposition
- Drag from port to port to connect
- Click connection line to select
- Delete key to remove selected
- Cmd/Ctrl + Z/Y for undo/redo
- Space + drag to pan

=== NODE VISUAL DESIGN ===

Node Container:
- Width: 160px (fixed)
- 3px black border
- White background
- 4px hard offset shadow
- 8px border radius
- 12px padding

Node Structure:
```
┌────────────────────────────┐
│ ●  📅 Schedule          ▼ │  ← Header: status dot, icon, label, menu
├────────────────────────────┤
│   Every day at 9:00 AM     │  ← Summary of config (auto-generated)
├────────────────────────────┤
│ ○                        ○ │  ← Connection ports
└────────────────────────────┘
```

Node Header:
- Status dot (left):
  - Green: Configured correctly
  - Yellow: Needs configuration
  - Red: Error/invalid
- Icon (category icon)
- Label (node type name)
- Menu button (right, three dots on hover)

Node Body:
- Auto-generated summary from properties
- Examples:
  - Schedule: "Daily at 9:00 AM"
  - Webhook: "POST /api/flows/abc123"
  - Extractor: "Invoice Parser"
  - Google Sheets: "Sheet: Invoices"
- Gray text when not configured: "Click to configure"

Connection Ports:
- Input port: Left side (cannot have for triggers)
- Output port: Right side (can have multiple for conditions)
- Port visual: 12px circle, black border, white fill
- Port hover: Yellow fill
- Port connected: Filled black

Node States:
- Default: As described above
- Hover: Shadow increases to 6px
- Selected: Yellow border (4px), properties panel shows config
- Error: Red border, error icon
- Dragging: Elevated shadow (8px), semi-transparent

=== CONNECTION LINES ===

Line Style:
- 2px black stroke
- Bezier curve (smooth)
- Arrow head at destination

Line States:
- Default: Black
- Selected: Yellow highlight
- Error: Red dashed
- Active (during run): Animated dots flowing along line

Creating Connection:
- Drag from output port
- Line follows cursor
- Snaps to compatible input port
- Invalid connection: Red X indicator

=== RIGHT PANEL: PROPERTIES PANEL ===

Panel Container:
- White background
- 2px black left border
- Scrollable content
- Shows when node selected

Panel Header:
- Node type icon + name
- "Configured" or "Needs Setup" badge
- Close button (X)

Panel Content (varies by node type):

**Schedule Trigger Properties:**
- Frequency selector: "Every" dropdown
  - Day / Week / Month / Hour
- Time picker: "At" + time input
- Timezone dropdown
- Days of week checkboxes (if weekly)
- Preview: "Next run: Tomorrow at 9:00 AM"

**Webhook Trigger Properties:**
- Webhook URL (read-only, copy button)
  - Auto-generated: https://app.docxtractor.com/webhook/abc123
- Secret key (masked, regenerate button)
- Test webhook button
- Request format example (collapsible JSON)

**File Upload Trigger Properties:**
- Trigger mode:
  - "Manual upload" (shows upload zone in flow)
  - "Watch folder" (connect to storage)
- Accepted file types checkboxes
- Max file size input

**Form Trigger Properties:**
- Form builder section:
  - Field list (drag to reorder):
    - Field name, type (text/file/select), required toggle
  - "Add Field" button
- Form embed code (collapsible)
- Form preview button

**Condition Properties:**
- Condition builder:
  - Field dropdown (from extractor fields)
  - Operator dropdown (equals, contains, greater than, etc.)
  - Value input
- Add condition (AND/OR toggles)
- Preview branches: "If true → / If false →"

**Extractor Properties:**
- Extractor selector dropdown
  - Shows existing extractors
  - "Create new extractor" option
- Selected extractor summary:
  - Field count
  - Extraction mode (AI/Deterministic)
- "Edit Extractor" link

**Excel Output Properties:**
- Filename template input
  - Placeholder hints: {{date}}, {{flow_name}}
- Include headers toggle
- Sheet name input
- Download location: "Available after run"

**Google Sheets Properties:**
- Connect Google account button (if not connected)
- Spreadsheet selector (dropdown)
- Sheet/Tab selector
- Append mode: "Add new rows" / "Replace all"
- Column mapping (auto or manual)

**Google Drive Properties:**
- Connect Google account button
- Folder path selector
- Filename template input
- File format: JSON / CSV / Excel

**Webhook Output Properties:**
- URL input
- Method dropdown: POST / PUT
- Headers section (key-value pairs)
- Authentication dropdown: None / Bearer / Basic
- Test request button

=== FOOTER BAR ===

Footer Container:
- White background
- 2px black top border
- 12px 24px padding

Left Section:
- Node count: "4 nodes"
- Validation status:
  - "✓ Flow is valid" (green)
  - "⚠ 2 nodes need configuration" (yellow)
  - "✗ Flow has errors" (red)

Center Section:
- Auto-save status: "All changes saved" or "Saving..."

Right Section:
- "Clear Canvas" button (ghost, red text)
- Keyboard shortcuts hint: "? for shortcuts"

=== KEYBOARD SHORTCUTS ===

| Key | Action |
|-----|--------|
| Delete/Backspace | Delete selected |
| Cmd/Ctrl + Z | Undo |
| Cmd/Ctrl + Shift + Z | Redo |
| Cmd/Ctrl + S | Save |
| Cmd/Ctrl + D | Duplicate selected |
| Space + Drag | Pan canvas |
| Scroll | Zoom in/out |
| Escape | Deselect / Close panel |
| ? | Show shortcuts overlay |

=== VALIDATION RULES ===

Flow must have:
- Exactly one trigger (start)
- Exactly one extractor node
- At least one output destination
- All connections valid (no orphan nodes)
- All nodes configured (no yellow status dots)

=== RESPONSIVE BEHAVIOR ===

Tablet:
- Collapsible palette (icon-only mode)
- Properties panel as slide-over from right
- Touch-friendly node sizing

Mobile (not recommended for editing):
- View-only mode with simplified diagram
- "Edit on desktop" message
- Can activate/pause flows
```

---

### 15. Flow Run History

```
Design a flow run history/monitoring page for "DocXTractor" – view automated extractor execution history.

**Context**: This page shows the history of all automated extractor runs for a specific Flow. Each "run" represents one automatic execution of the extractor (triggered by schedule, webhook, etc.). Users can see when runs happened, whether they succeeded,review, view extracted results, and retry failed runs.

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

=== LAYOUT STRUCTURE ===

Overall Layout:
- Consistent sidebar
- Main content with run history for specific flow

=== HEADER SECTION ===

Header Row:
- Back button: "← Back to Flow"
- Flow name (text-2xl, font-bold)
- Status badge: Active/Paused
- Right side:
  - "Pause Flow" / "Resume Flow" toggle button
  - "Edit Flow" button (outline)
  - "Run Now" button (yellow)

=== STATS CARDS ROW ===

Four stat cards (same styling as Dashboard):
- Total Runs (all time)
- Successful Runs (green number)
- Failed Runs (red number)
- Avg Duration (e.g., "2.3s")

=== FILTER BAR ===

Filter Row:
- Date range picker
- Status filter: All / Success / Failed / Running
- Trigger filter: All / Scheduled / Manual / Webhook

=== RUNS TABLE ===

**Key Concept**: Each flow run creates a standard Job (same as manually triggered jobs). Clicking on a run navigates to the existing Job Details page, Citation Viewer, and Review screens.

Table Container:
- 3px black border
- White background
- 4px shadow

Table Header:
- Gray background (#f4f4f5)
- Columns:
  | Run ID | Trigger | Status | Documents | Confidence | Duration | Started | Actions |

Table Rows:

Run ID Column:
- "#run_abc123" (monospace, link style)
- **Click to navigate to Job Details page** (same page as manual jobs)
- Tooltip: "View full job details"

Trigger Column:
- Icon + label:
  - 📅 "Scheduled"
  - 🔗 "Webhook"
  - ▶️ "Manual"
- Trigger time if scheduled

Status Column:
- Status badge with icon:
  - ✅ "Success" (green bg, black border)
  - ⏳ "Running" (yellow bg, animated spinner)
  - ❌ "Failed" (red bg)
  - 🔄 "Retrying" (yellow bg, retry icon)
  - ⚠️ "Partial" (orange bg) - some docs failed
  - 👁️ "Needs Review" (orange bg) - low confidence extractions

Documents Column:
- Count: "10 documents"
- Sub-count if partial: "8/10 succeeded"

**Confidence Column (matches manual jobs):**
- Average confidence badge:
  - "95%" (green) - High confidence
  - "82%" (yellow) - Medium confidence  
  - "65%" (red) - Low confidence, needs review
- Click to go directly to Citation Viewer

Duration Column:
- Time: "2.3s" or "1m 23s"
- Running: elapsed timer

Started Column:
- Relative: "2 hours ago"
- Tooltip: Full timestamp

Actions Column:
- **"View Job"** button (eye icon) → Opens Job Details page
- **"Review"** button (if needs review) → Opens Citation Viewer/Review screen
- Retry button (if failed) (refresh icon)
- Download results button (download icon)

Row States:
- Default: White background
- Hover: Yellow tint
- Expanded: Yellow left border, detail panel below
- Running: Subtle pulse animation
- Failed: Light red tint

=== EXPANDED RUN DETAIL PANEL ===

Appears below row when expanded:

Panel Container:
- Light gray background (#f7f7f7)
- 2px black border (top dashed, connecting to row)
- 16px padding

Tab Navigation:
- "Input" | "Output" | "Logs" | "Errors"

**Input Tab:**
- Source documents list:
  - File icon + name
  - Size
  - Source (upload/webhook/form)
- Trigger metadata (webhook payload, form data, etc.)

**Output Tab:**
- Results preview (JSON/table view toggle)
- Download buttons: JSON / CSV / Excel
- Destination status:
  - ✅ "Sent to Google Sheets"
  - ✅ "Saved to Drive"

**Logs Tab:**
- Timestamped log entries
- Monospace font
- Color-coded levels: INFO (gray), WARN (yellow), ERROR (red)
- Auto-scroll toggle

**Errors Tab (if failed):**
- Error message (large, red)
- Error type badge
- Stack trace (collapsible, monospace)
- "Retry This Run" button (yellow)
- Retry history (if retried):
  - Attempt 1: Failed - [error]
  - Attempt 2: Failed - [error]
  - Attempt 3: Failed - Alerted

=== ERROR HANDLING VISUALIZATION ===

When a run fails:
- Show retry attempts timeline:
  ```
  ⏺ Run started
  │
  ❌ Attempt 1 failed (API timeout)
  │
  🔄 Retry 1 (30s delay)
  ❌ Attempt 2 failed (API timeout)
  │
  🔄 Retry 2 (60s delay)
  ❌ Attempt 3 failed (API timeout)
  │
  📧 Alert sent to admin@example.com
  │
  ⏭️ Continued to next scheduled run
  ```

=== REAL-TIME UPDATES ===

When a run is in progress:
- Status auto-updates via WebSocket
- Progress indicator for multi-document runs
- Logs stream in real-time

=== EMPTY STATE ===

When no runs yet:
- Illustration (clock/play icon)
- "No runs yet"
- "This flow hasn't been triggered yet"
- "Run Now" button or wait for scheduled time
```

---

### 16. AI Flow Generator Modal

```
Design an AI-powered flow generator modal for "DocXTractor".

Style: Neubrutalism / RetroUI (https://www.retroui.dev)

=== MODAL STRUCTURE ===

Modal Container:
- Semi-transparent backdrop (rgba(0,0,0,0.5))
- Centered modal:
  - 4px black border
  - White background
  - 8px hard offset shadow
  - max-width: 640px
  - 24px padding
- Close button (X) top right

=== STEP 1: DESCRIBE YOUR FLOW ===

Modal Header:
- Sparkle icon ✨
- Title: "Generate Flow with AI"
- Subtitle: "Describe your automation in plain English"

Input Section:
- Large textarea (6 rows minimum)
- 2px black border, inset styling
- Placeholder: "Describe what you want to automate..."
- Character count (optional): "0/500"

Example Prompts (clickable to use):
- Card style, horizontal scroll or wrap
- Examples:
  - "Every day at 9am, extract data from invoices in my Drive folder and add to a Google Sheet"
  - "When I upload a contract, extract key terms and send to my API"
  - "Process form submissions and save results as Excel files"
- Click to populate textarea

Available Resources Info:
- Collapsible section: "Your available resources"
- Lists:
  - Extractors: "Invoice Parser, Contract Extractor"
  - Connected accounts: "Google (sheets, drive)"

Action Buttons:
- "Cancel" (outline)
- "Generate Flow ✨" (yellow primary)
  - Loading state: Sparkle animation, "Generating..."

=== STEP 2: PREVIEW GENERATED FLOW ===

Modal Header:
- Sparkle icon ✨
- Title: "Flow Generated!"
- Subtitle: "Review and customize your automation"

Flow Preview:
- Visual diagram (simplified, read-only):
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  │   [📅 Schedule]  ──▶  [🔧 Invoice Parser]  ──▶  [📑 Sheets]    │
  │    Daily 9am            Extractor               Append rows      │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
  ```
- Nodes shown with icons and labels
- Connection lines between nodes

Detected Settings Card:
- 2px black border
- Light yellow background (#fef9c3)
- Checklist of detected configurations:
  - ✅ Trigger: Daily schedule at 9:00 AM
  - ✅ Extractor: Invoice Parser (matched existing)
  - ⚠️ Output: Google Sheets (needs sheet selection)
- Warning items (⚠️) indicate additional setup needed

AI Confidence Indicator:
- "Confidence: High" (green) / "Medium" (yellow) / "Low" (red)
- Explanation: "Based on your description, this flow should..."

Action Buttons (3 options):
- "Regenerate" (outline, left side)
  - Returns to Step 1 with prompt preserved
- "Edit in Canvas" (outline)
  - Opens Flow Builder with generated flow
- "Use This Flow" (yellow primary)
  - Creates flow and opens for final config

=== STEP 3: QUICK CONFIGURATION (Optional) ===

If "Use This Flow" clicked but config needed:

Modal Header:
- Title: "Almost there!"
- Subtitle: "Complete the setup for your new flow"

Required Fields:
- Only shows inputs for items that need configuration
- Minimal form:
  - Google Sheets: Sheet selector dropdown
  - Schedule: Time picker (if time was ambiguous)
- Pre-filled where possible from AI interpretation

Action Buttons:
- "Back" (outline)
- "Create & Activate Flow" (yellow primary)

=== SUCCESS STATE ===

Modal Content:
- Large checkmark icon (green)
- Title: "Flow Created!"
- Flow name (editable inline)
- Status: "Your flow is now active and will run [schedule description]"

Next Steps:
- "View Flow" button
- "Run Now" button
- "Create Another" link

Auto-close after 3 seconds or on button click.

=== ERROR STATE ===

If AI generation fails:

Modal Content:
- Warning icon (yellow)
- Title: "Couldn't generate flow"
- Message: "We had trouble understanding your request. Try being more specific."
- Suggestions:
  - "Mention which extractor to use"
  - "Specify the schedule clearly (daily, weekly, etc.)"
  - "Describe where to save the output"
- "Try Again" button

=== RESPONSIVE BEHAVIOR ===

Mobile:
- Modal becomes bottom sheet (slide up)
- Full width
- Larger touch targets
- Flow preview simplified to linear list
```

---

### 17. Flows Empty States

```
Design empty and loading states for Flows feature.

Style: Neubrutalism / RetroUI

States Needed:

1. No Flows Yet:
   - Illustration: Workflow/automation icon (connected nodes)
   - Heading: "Create your first automation"
   - Subtext: "Flows run your extractors automatically on schedules, webhooks, or form submissions"
   - Two buttons: "Create Flow" (yellow) + "Generate with AI ✨" (outline)

2. Flow Builder Empty Canvas:
   - Ghost image of a flow in center
   - Text: "Drag nodes from the left panel to get started"
   - Or: "Start with a trigger" with arrow pointing to palette

3. No Runs Yet:
   - Clock/play icon
   - "No runs yet"
   - "Activate your flow to start processing"
   - "Run Now" button

4. Flow Loading:
   - Skeleton of flow diagram
   - Shimmer animation

5. AI Generating:
   - Sparkle animation
   - "Creating your flow..."
   - Subtle progress dots
```

---

## 📐 RetroUI Component Library Reference

**IMPORTANT**: Use RetroUI components from https://www.retroui.dev/docs/components as the foundation.

### Available RetroUI Components


| Component     | Usage                      |
| --------------- | ---------------------------- |
| Button        | Primary actions, nav items |
| Badge         | Status indicators, tags    |
| Card          | Content containers         |
| Input         | Form fields                |
| Textarea      | Multi-line input           |
| Avatar        | User images                |
| Accordion     | Collapsible sections       |
| Alert         | Notifications              |
| Dialog/Modal  | Overlays                   |
| Table         | Data display               |
| Dropdown      | Select menus               |
| Toggle/Switch | Boolean options            |
| Progress      | Loading/completion         |

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

#### Field-Level Toggle (Extractor Editor)

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
