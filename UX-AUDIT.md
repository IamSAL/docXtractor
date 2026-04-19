# DocXtractor — UX Audit Report
**Focus:** Core MVP flows for non-tech users  
**Date:** 2026-04-19  
**Branch:** develop  
**Target:** https://docxtractor.sk-salman.com/  
**Auditor:** gstack /design-review  

---

## First Impression

The landing page communicates **document extraction automation** at a glance. The headline "DOCUMENTS IN. DATA OUT. AUTOMATICALLY." is clear and punchy. The neobrutalist design with Archivo Black headings and a yellow/black palette is distinctive — not generic SaaS. Eye goes to: (1) the hero headline, (2) the yellow CTA button, (3) the terminal/demo screenshot.

One word: **Capable — but intimidating.**

The problem starts the moment a non-tech user logs in. The login page briefly renders icon names as plain text ("description", "mail", "lock") while fonts load — this is caused by a 404 on the main CSS file (`assets/styles-CLOUsoTW.css`) that hits every page load. This will make users think the site is broken.

---

## Design Score: **C+** | AI Slop Score: **A**

The design is NOT AI-slop — strong typographic identity, neobrutalist aesthetic is deliberate and consistent. The problem isn't how it looks. The problem is **what it asks users to understand.**

---

## Inferred Design System

- **Fonts:** Inter (body), Archivo Black (headings), Material Symbols Outlined (icons), Monospace (code/logs)
- **Colors:** Off-white `#f7f7f5` background, pure black `#000`, yellow `#fde047` accent, red for errors, green for success
- **Spacing:** Mostly 8px-based, some inconsistency in card padding
- **Brand:** Strong and consistent — the neobrutalist identity holds across all pages
- **Icons:** Material Symbols — renders as text briefly on each page load (CSS 404 bug)

---

## Critical Infrastructure Issue

**FINDING-000 — BLOCKER**  
**`assets/styles-CLOUsoTW.css` returns 404 on every page navigation.**

Every page load triggers multiple failed requests for the main stylesheet. The app works because CSS is likely inlined or bundled elsewhere, but the 404s indicate a deployment asset hash mismatch. This causes:
- Intermittent unstyled flash on load
- Icons rendering as raw text strings ("description", "mail", "lock") until fonts load
- Degraded perceived quality for first-time users

**Fix:** Rebuild and redeploy. Ensure Vite asset hashes match deployed files. Likely a stale deployment with mismatched `dist/assets/` filenames.

---

## Goodwill Reservoir

```
Starting goodwill: 70/100

Login page (icon text flash)    70 → 60   (-10 sloppy appearance)
Dashboard (immediate value)     60 → 70   (+10 top tasks obvious)
Create Extractor modal          70 → 55   (-15 blocking interstitial with jargon)
New Extractor form              55 → 40   (-15 overwhelming options dump)
Run Extractor modal             40 → 25   (-15 3-provider choice with no guidance)
Run Detail page                 25 → 20   (-5 raw logs shown prominently)

FINAL: 20/100 ⚠️ CRITICAL UX DEBT
```

---

## Findings by Flow

---

### FLOW 1: Creating an Extractor

#### FINDING-001 — HIGH IMPACT
**The template wizard is a two-step context trap**

When a user clicks "+ NEW EXTRACTOR", a modal opens. When they select "Create Your Own", the modal closes and they navigate to `/extractors/new`. But if they clicked "Generate with AI" and then pressed "Back to List", they return to the modal — which is layered on top of the extractors list. The user loses track of where they are.

The wizard modal also shows the step indicator "1 SELECT TEMPLATE → 2 CONFIGURE → 3 LAUNCH" but once you select a template and land on the full form, there are NO steps shown. The user doesn't know where they are in the process.

**Fix:** Either make the whole create flow a dedicated page (no modal), or keep the wizard fully modal with all steps inside it. Remove the hybrid approach.

---

#### FINDING-002 — HIGH IMPACT
**"Use This Template" button exists before the user has generated anything**

On the "Generate with AI" screen, the primary CTA is "Use This Template" — but the user hasn't written a prompt yet, hasn't generated anything, and has no idea what they're approving. 

"Use This Template" when nothing is generated = go to the blank form with no context. This is a false affordance that will confuse users.

**Fix:** Disable "Use This Template" until after generation completes. Label it "Continue with Generated Config" after generation. Before generation, the only action should be "Generate →" (triggered by the text field).

---

#### FINDING-003 — HIGH IMPACT
**The new extractor form dumps every option on screen at once**

The `/extractors/new` form shows simultaneously:
- Basic Info (Name, Description, Thumbnail)
- Field Schema (AI Generate / Paste JSON / Add Field)
- System Prompt
- Few-Shot Examples
- Parser Engine (4 dropdown options with technical names)
- Consensus Voting (Confidence Threshold, Conflict Resolution)
- Citation Tracking
- Model Parameters (Context Window, Default Model)

A non-tech user sees this and doesn't know where to start. There's no visual separation between "required" and "optional". There's no step-by-step flow.

**Fix (minimal, no redesign needed):**
1. Add a required/optional badge to each section header
2. Collapse "Advanced Options" by default and add a "Recommended defaults are pre-set — you can skip this" note
3. Put a yellow "START HERE →" label next to the Name field
4. Put a "Most users use AI Generate →" hint in the Field Schema section

---

#### FINDING-004 — HIGH IMPACT
**"Field Schema" has three entry points with no recommended path**

Three buttons: "AI Generate", "Paste JSON", "Add Field". For a non-tech user:
- "Paste JSON" assumes they know JSON
- "Add Field" requires knowing field names/types
- "AI Generate" is the right path, but it's not visually distinguished as the default

The empty state "NO FIELDS DEFINED YET / Add your first field to get started" gives no direction on WHICH button to press.

**Fix:** Make "AI Generate" the prominent primary button (yellow, full-width). Make "Paste JSON" and "Add Field" secondary options. Change empty state to: "No fields yet — use AI Generate to create them automatically from a description."

---

#### FINDING-005 — MEDIUM IMPACT
**"Test Run" button appears before any fields are defined**

At the top of the create form, "Test Run" is shown in the header. A curious non-tech user will click it immediately to "see what happens" — but there's no extractor configured yet, so the result will be confusing or an error.

**Fix:** Disable "Test Run" until at least one field is defined AND a name is filled in. Show a tooltip: "Add fields first, then test."

---

### FLOW 2: Editing an Extractor

#### FINDING-006 — HIGH IMPACT
**Field names use raw snake_case identifiers**

In the field schema editor, fields appear as: `currency`, `line_items`, `vendor_name`, `invoice_date`, `total_amount`. These are machine-readable names, not human labels. Non-tech users editing a field won't know what `line_items array` means or how to change it.

The "+ description" button exists to add a description per field — but it defaults to nothing, so there's no label to orient the user.

**Fix:** In the field editor, show the field label prominently and display the technical name as a smaller secondary element. Add placeholder descriptions like "e.g. The total amount due on the invoice".

---

#### FINDING-007 — HIGH IMPACT
**Two "Save Extractor" buttons with different visual weight**

There's a "Save Extractor" button at the top-right of the page header, AND a floating yellow "SAVE EXTRACTOR" block that appears in the field schema area. Users see two CTAs for the same action and don't know which one is "the real one."

**Fix:** One save button. Remove the floating one from the schema section, keep the header button. The header button is already prominent enough.

---

#### FINDING-008 — MEDIUM IMPACT
**"Schema Variants" section appears with no explanation**

Below the field schema, there's a "SCHEMA VARIANTS" section with a "New Variant" button. There's no explanation of what a variant is or when to use it. Non-tech users will either click it accidentally or wonder if they're supposed to use it.

**Fix:** Add a tooltip or one-line description: "Variants let you define alternate field sets for different document formats. Most users don't need this."

---

### FLOW 3: Running an Extractor

#### FINDING-009 — HIGH IMPACT
**3-way Extraction Provider choice with no clear default**

The run modal asks users to choose between:
- "Doclo (Cloud LLM) — Use cloud-based LLM (Gemini) for extraction via external worker."
- "FreeLLM (Cloud AI) — Use FreeLLM gateway (Groq, Gemini, Mistral, Cerebras) for extraction."
- "LangExtract (Few-Shot) — Use LangExtract with few-shot examples for structured extraction."

None of these are self-explanatory to a non-tech user. "Groq, Gemini, Mistral, Cerebras" is noise. "Context window" and "external worker" are noise. FreeLLM is pre-selected but not labeled as "Recommended."

**Fix:** Label one as "Recommended for most users ★" with a visible badge. Collapse the others behind "Show alternatives." Or replace the radio buttons with a single "Auto (recommended)" option that hides the complexity entirely, with an "Advanced: choose manually" toggle.

---

#### FINDING-010 — HIGH IMPACT
**"Processing Mode" — Unified vs Batch uses jargon**

"Merge all inputs into a single context window for cross-document reasoning" vs "Process each file independently. Faster for unrelated documents."

Non-tech users don't know what "context window" or "cross-document reasoning" means.

**Fix:** Rewrite the descriptions in plain English:
- "Unified: All documents analyzed together — best when they're related (e.g., multiple pages of one contract)"
- "Batch: Each document analyzed separately — best for a pile of different invoices"

---

#### FINDING-011 — MEDIUM IMPACT
**Extractor ID and technical mode visible in run modal header**

The modal header shows: "EXTRACTOR ID: #be5e9f24 • PER_DOCUMENT EXTRACTION MODE"

Non-tech users don't need to see the UUID or the mode string in this format.

**Fix:** Remove the UUID from the header. Show the extractor name only. Move mode info into the "Advanced Options" accordion if needed at all.

---

#### FINDING-012 — MEDIUM IMPACT
**Schema field checkboxes in run modal confuse users**

The run modal shows all schema fields with checkboxes letting users include/exclude fields per run. A non-tech user sees this and thinks: "Do I have to check these? Did I uncheck something by accident?" There's a small "5/5 FIELDS ACTIVE" indicator but no explanation of WHY you'd deselect a field.

**Fix:** Collapse this into an "Advanced: Customize fields" section, collapsed by default. Default behavior = all fields active. No decision required.

---

### FLOW 4: Viewing Run Details

#### FINDING-013 — HIGH IMPACT
**"BATCH EXTRACTION MONITOR" is developer-facing language**

The run detail page title is "BATCH EXTRACTION MONITOR." Non-tech users think of this page as "my results" not as a "monitor."

Steps labeled "01. Parsing", "02. Extracting", "03. Complete" are clear but the abbreviation "P.E." (Post-Extraction) appears in the step indicator with no explanation.

**Fix:** Rename to "Extraction Results" or "Your Results". Remove "P.E." or spell it out.

---

#### FINDING-014 — HIGH IMPACT
**Raw server logs shown to all users by default**

The "RUN LOGS" section at the bottom shows:
```
[6:19:07 PM] [server] [info] Run started with 2 document(s)
[6:20:14 PM] [parser] [info] Document parsed to markdown (2,998 tokens, 25,062 chars)
[6:20:21 PM] [server] [info] Batch extraction complete in 74s
```

These are developer-facing logs. Non-tech users see this and either get confused ("did something break?") or anxious ("what does 2,998 tokens mean?").

**Fix:** Collapse logs behind a "Show technical logs" toggle, hidden by default. Show only user-friendly status messages: "2 documents processed — 74 seconds". The logs should be there for debugging but off by default.

---

#### FINDING-015 — MEDIUM IMPACT
**"Token Usage: Input 65,295 / Output 0" confuses users**

The sidebar shows token usage counts. Non-tech users don't know what tokens are, why Output is 0, or if that's a problem.

**Fix:** Either remove this from the user-facing sidebar entirely, or replace with plain language: "Processed 65K words of document content."

---

#### FINDING-016 — HIGH IMPACT
**"View Full Report" is the primary post-extraction action but easy to miss**

After extraction completes, the main thing users want to do is review their results. "VIEW FULL REPORT" is buried in the right sidebar, visually similar to "RETRY RUN". It should be the dominant CTA.

**Fix:** Show a prominent "Review Results →" button in the main content area after extraction completes, not just in the sidebar. Make it yellow (primary CTA style). The current sidebar placement makes it look like a secondary option.

---

#### FINDING-017 — MEDIUM IMPACT
**Spreadsheet column headers are snake_case field names**

The spreadsheet view shows column headers like: `global_identifier`, `isin`, `issuer`, `initial_valuation_date`. These are machine-readable identifiers, not human-readable labels.

**Fix:** If a field has a display label or description, use that as the column header. Show the technical name as a tooltip. This is the "output" that users will share — it should be presentable.

---

### FLOW 5: Interacting with Run Results

#### FINDING-018 — MEDIUM IMPACT
**JSON view shown as first tab, before Spreadsheet**

The result tabs are ordered "JSON | Spreadsheet". JSON is developer output. Non-tech users should land on Spreadsheet by default.

**Fix:** Swap order to "Spreadsheet | JSON". Persist preference per user.

---

#### FINDING-019 — HIGH IMPACT
**The review flow (View Full Report) doesn't explain its purpose**

Clicking "View Full Report" takes users to a review interface showing the document on the left and an "Accept / Reject" flow on the right. But there's no introduction or explanation. Users don't know:
- Why they're reviewing
- What happens if they reject a field
- Whether review is required or optional
- What "15 of 20 fields validated" means

Non-tech users will either blindly click "Accept" on everything or abandon the page.

**Fix:** Add a one-paragraph intro: "Review the extracted data. We'll show you each value alongside where it came from in the document. Accept values that look correct, or edit and reject ones that don't. This improves accuracy over time." Show it once (dismissable).

---

#### FINDING-020 — MEDIUM IMPACT
**"Case ID CASE-2023-7650ed66-6c3d-42d4-83e7-4b9a220dfed7" in review page header**

The full UUID is shown in the header of the review page. This is noise that takes up horizontal space and adds zero value for non-tech users.

**Fix:** Show a short ID like "Run #7650ed66" or better, the run name/extractor name.

---

### GLOBAL / NAVIGATION

#### FINDING-021 — MEDIUM IMPACT
**"AutoRuns" in nav has no label explaining what it is**

The sidebar shows: Dashboard, Extractors, Runs, AutoRuns, Settings. "AutoRuns" is not self-explanatory. Is it scheduled runs? Triggered runs? 

**Fix:** Add a subtitle under "AutoRuns": "Scheduled & triggered" or add a tooltip on hover.

---

#### FINDING-022 — HIGH IMPACT
**No onboarding or empty state guidance for new users**

A new user with no extractors sees an empty dashboard with skeleton stats (0 documents, 0 extractors, 0 pages). There's no "Get Started" guide, no call to action, no example.

**Fix:** Add an empty state to the dashboard: "Start by creating your first extractor → [Create Extractor]". Add a progress indicator like "3 steps to your first extraction: 1. Create extractor → 2. Upload document → 3. View results."

---

#### FINDING-023 — MEDIUM IMPACT
**Mobile: sidebar takes 35% of screen width at 375px**

On mobile, the left sidebar stays visible and takes significant horizontal space. The content area is too narrow for usable interaction. The "NEW EXTRACTOR" button is cut off.

**Fix:** Collapse sidebar to icon-only on mobile (48px wide) with a hamburger to expand. Or use bottom navigation on mobile.

---

## Trunk Test Results

| Page | Site ID | Page Name | Major Sections | Options | Location | Search | Score |
|------|---------|-----------|----------------|---------|----------|--------|-------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | PARTIAL |
| Extractors List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | PASS |
| New Extractor Form | ✓ | ✓ | ✗ (no required/optional split) | ✗ (too many) | ✓ | ✗ | FAIL |
| Run Detail | ✓ | ✗ ("BATCH EXTRACTION MONITOR") | ✗ | ✗ | ✓ | ✗ | FAIL |
| Review Page | ✗ (logo missing) | ✗ (Case ID, not name) | ✗ | ✗ | ✗ | ✗ | FAIL |

---

## Quick Wins (under 1 hour each)

These 5 changes will have the most impact for the least effort:

1. **Relabel "BATCH EXTRACTION MONITOR" → "Extraction Results"** — one string change, removes biggest jargon point on the most-used page
2. **Collapse Run Logs behind "Show technical logs" toggle (collapsed by default)** — removes intimidating developer output from non-tech users
3. **Mark "FreeLLM (Cloud AI)" as "Recommended ★" in run modal** — removes the 3-way choice anxiety with one badge
4. **Swap result tabs: Spreadsheet first, JSON second** — one line of code, puts non-tech users on the right view
5. **Make "View Full Report" / "Review Results" a prominent yellow CTA after extraction** — one styling change, makes the primary action discoverable

---

## Findings Summary

| ID | Flow | Impact | Fix Effort |
|----|------|--------|-----------|
| FINDING-000 | Infrastructure | BLOCKER | Low (redeploy) |
| FINDING-001 | Create | High | Medium |
| FINDING-002 | Create | High | Low |
| FINDING-003 | Create | High | Low |
| FINDING-004 | Create | High | Low |
| FINDING-005 | Create | Medium | Low |
| FINDING-006 | Edit | High | Medium |
| FINDING-007 | Edit | High | Low |
| FINDING-008 | Edit | Medium | Low |
| FINDING-009 | Run | High | Low |
| FINDING-010 | Run | High | Low |
| FINDING-011 | Run | Medium | Low |
| FINDING-012 | Run | Medium | Low |
| FINDING-013 | View | High | Low |
| FINDING-014 | View | High | Low |
| FINDING-015 | View | Medium | Low |
| FINDING-016 | View | High | Low |
| FINDING-017 | View | Medium | Medium |
| FINDING-018 | Results | Medium | Low |
| FINDING-019 | Results | High | Low |
| FINDING-020 | Results | Medium | Low |
| FINDING-021 | Nav | Medium | Low |
| FINDING-022 | Nav | High | Medium |
| FINDING-023 | Nav | Medium | Medium |

**Total:** 1 Blocker, 11 High, 10 Medium, 0 Low-tagged (polish)

---

## Category Grades

| Category | Grade | Key Issue |
|----------|-------|-----------|
| Visual Hierarchy | B | Good fundamentals, but primary actions buried |
| Typography | A- | Strong neobrutalist type system, well applied |
| Color & Contrast | B+ | Yellow/black system works, some small text contrast issues |
| Spacing & Layout | B | Mostly consistent, mobile sidebar is a problem |
| Content & Microcopy | D | Jargon everywhere, no plain-English for non-tech users |
| Interaction States | C | Touch targets too small, good hover states on desktop |
| Responsive | C | Mobile layout not rethought for touch |
| AI Slop Detection | A | Zero AI slop patterns — the neobrutalist system is genuine |

**Overall Design Score: C+**  
**AI Slop Score: A (clean)**

---

## Root Cause

The app was built by and for technical users. The mental model embedded in the UI is: "you know what JSON is, you know what a context window is, you know what tokens are." Every piece of jargon, every uncollapsed advanced option, every raw log line is a leak from the developer's mental model into the user interface.

The fix isn't a redesign. It's a **jargon audit + progressive disclosure pass**:
1. Hide advanced options by default  
2. Replace technical labels with plain English  
3. Add "Recommended" markers to remove decision paralysis  
4. Collapse developer output (logs, tokens, UUIDs) behind toggles  

The design language is already excellent. The content inside it just needs to speak to users, not developers.
