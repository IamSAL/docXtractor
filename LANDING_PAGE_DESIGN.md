# LANDING_PAGE_DESIGN.md

## Overview
This document outlines the UI layout and design plan for the **DocXTractor** landing page.
**Goal**: Create a high-conversion, developer-centric landing page with the **structure and flow of [Doclo.ai](https://www.doclo.ai/)**, but implemented with a **Neubrutalist / Retro-Futuristic** aesthetic.

## Design Philosophy: "Retro-Futuristic Industrial"
- **Style**: Neubrutalism (Retro UI) meets 90s Hacker Terminal.
- **Core Traits**: High contrast, bold typography, raw functionality, thick borders, hard shadows.
- **Color Palette**:
    - **Primary**: `#fde047` (Vibrant Yellow) - Access/Actions.
    - **Secondary**: `#a5b4fc` (Soft Indigo) or `#fca5a5` (Soft Red) - Accents/Alerts.
    - **Neutral**: `#ffffff` (White) canvas, `#f3f4f6` (Light Gray) backgrounds.
    - **Text/Borders**: `#000000` (Pure Black) - **Critical**.
- **Visual Language**:
    - **Hard Shadows**: `box-shadow: 4px 4px 0px 0px #000`. No blur. 
    - **Thick Borders**: `border-2` or `border-4` solid black.
    - **Shapes**: Rectangular, slight `rounded-md`.

---

## Layout Structure (Doclo.ai Architecture)

### 1. Navigation Bar (Sticky Console)
*   **Style**: Top border `border-b-4 border-black bg-white`.
*   **Left**: Brand "DocXTractor" (Pixelated or Monospace Bold).
*   **Right**:
    *   GitHub Star Badge (Shield style).
    *   "Login" (Link).
    *   "Get Started" Button (Yellow, Hard Shadow).

### 2. Hero: "The Framework"
*   **Goal**: Position as infrastructure, not just a tool.
*   **Copy**:
    *   **Headline**: "The Document AI Framework." (Massive, uppercase, bold).
    *   **Subhead**: "Parse, extract, and classify documents with local LLMs or cloud providers. Zero lock-in. Full control."
*   **Interactive Element**: **The Retro Terminal**.
    *   Instead of a simple code block, show a "Command Prompt" window.
    *   **Content**:
        ```bash
        > npm install @docxtractor/sdk
        > docxtractor init --local
        [OK] Local AI Engine started.
        ```
    *   **Action**: "Copy" button styled as a physical switch.
*   **Secondary CTA**: "Try Cloud Host →" (Underlined link).

### 3. Visual Showcase: "The Input Engine"
*   **Concept**: Demonstrate versatility (Passport, Invoice, Receipt) like Doclo does.
*   **Neubrutalist Twist**: 
    *   Instead of clean floating cards, use **"File Folder"** or **"Floppy Disk"** styling.
    *   **Layout**: A grid of assets being "scanned" by a hard black scanline.
    *   **Animation**: Items hover/jitter slightly. On hover, they "squish" (translate X/Y).
*   **Provider Marquee**:
    *   "Powered By Any Intelligence":
    *   Logos of OpenAI, Llama (Meta), Mistral, Anthropic—enclosed in small black-border boxes moving horizontally (Conveyor Belt).

### 4. Core Value: "The SDK Standard"
*   **Layout**: Split or Centered "Manifesto".
*   **Headline**: "Full Control. Your Environment."
*   **Visual**: A diagram connecting "Your App" <-> "DocXTractor Container" <-> "Documents".
    *   Style the connections as thick angular pipes (Mario style).
*   **Key Points**:
    *   **Privacy First**: "Data never leaves your VPC."
    *   **Open Source**: "Audit the code, not the promise."
    *   **No Vendor Lock-in**: "Swap OpenAI for Llama 3 with one config change."

### 5. Features Grid (Bento Box)
*   **Style**: A dense grid of **RetroCards**.
*   **Content Mapping (Doclo -> Retro)**:
    1.  **Type-Safety First**:
        *   *Visual*: A `Zod` schema definition inside a mini text-editor window.
        *   *Copy*: "Define once. Extract forever. Typescript native."
    2.  **Consensus Engine**:
        *   *Visual*: Three pixelated robot heads "voting" on a document.
        *   *Copy*: "Multi-model verification for 99.9% accuracy."
    3.  **Resilience / Retries**:
        *   *Visual*: A shield icon or "Retry" loading bar.
        *   *Copy*: "Automatic retries on provider/network failure."
    4.  **Traceability (Citations)**:
        *   *Visual*: A "Crosshair" targeting a pixel on a page.
        *   *Copy*: "Map JSON fields back to source pixels."
    5.  **Multimodal**:
        *   *Visual*: Icons for PDF, PNG, TIFF, JPG piled up.

### 6. Developer FAQ (The "Help Manual")
*   **Style**: Accordion style, but looks like **Index Cards** in a file cabinet.
*   **Interaction**: Clicking a question "pulls" the card up/out.
*   **Questions**:
    *   "Can I self-host?" (Yes, Docker container).
    *   "Which models are supported?" (All OpenAI compatible endpoints).
    *   "Is data secure?" (Yes, local-first design).

### 7. Global Footer (The End)
*   **Style**: Massive Yellow Block (`bg-yellow-300 border-t-4 border-black`).
*   **Call to Action**: "Ship document AI this week."
*   **Command**: Large `npm i @docxtractor/sdk` visual again.
*   **Links**: "Docs", "GitHub", "Discord" (Simple bold list).

---

## Animation Strategy ("Tactile Motion")
*   **Hover**: **No Fading.** Use `translate-x` and `translate-y` to move elements physically.
    *   *Default*: `shadow-[4px_4px_0px_#000]`.
    *   *Hover*: `translate-x-1 translate-y-1 shadow-[2px_2px_0px_#000]`.
*   **Entrance**: Slap elements onto the screen. Fast `0.2s` transitions. No soft fades.
*   **Marquee**: Continuous linear motion for the Provider/Tech stack logos.

## Component Reference
1.  **`<RetroButton />`**: Yellow/White bg, black text, hard border, hard shadow.
2.  **`<RetroTerminal />`**: Window chrome (Header with X _ []) + Black body + Monospace green/white text.
3.  **`<RetroCard />`**: White bg, hard border, hover lift effect.
4.  **`<RetroBadge />`**: Pill shape, heavy border.

## Implementation Steps
1.  **Tokens**: Add colors and shadows to `tailwind.config.js`.
2.  **Components**: Build the primitive `Retro*` components.
3.  **Sections**: Assemble `Hero`, `Showcase`, `Features`, `FAQ`.
4.  **Page**: Compose in `routes/landing.tsx`.
