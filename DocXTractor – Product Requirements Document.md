# DocXTractor -- Product Requirements Document

## Product Overview and Vision

DocXTractor is an AI-powered web application for extracting structured data from various documents (PDF, DOCX, TXT, HTML) or web URLs. Its vision is to **automate and simplify document parsing** so that users no longer spend hours on manual data entry. By combining traditional parsing (e.g. regex/XPath) with modern AI (OpenAI or LangExtract), DocXTractor turns unstructured text into actionable data quickly and accurately. This aligns with industry practices: "Document parsing is the key to unlocking \[unstructured\] data by analyzing content... and structuring it into a usable format"[\[1\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=Document%20parsing%20is%20the%20key,it%20into%20a%20usable%20format). Automating extraction brings major benefits -- reducing manual work, cutting costs, and improving accuracy for operations teams[\[2\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,with%20sensitive%20information%20and%20regulatory). DocXTractor's **API-first architecture** ensures all features are exposed as well-defined, reusable endpoints[\[3\]](https://swagger.io/resources/articles/adopting-an-api-first-approach/#:~:text=An%20API,with%20the%20stakeholders%20providing%20feedback)[\[4\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=The%20bottom%20line%20is%20that,compatible%20with%20multiple%20programming%20languages), so that future clients (mobile, CLI, integrations) can be built easily.

**Architecture Philosophy:** DocXTractor uses a two-service architecture to leverage the best tools for each task. The **Core Backend** (NestJS/TypeScript) manages the user experience, data, and business logic, while a specialized **Worker Service** (Python/FastAPI) handles the heavy lifting of document parsing and AI extraction. The services communicate asynchronously through a message queue, allowing them to scale independently and handle failures gracefully.

## User Personas

1.  **General User (e.g. Business Analyst, Office Worker):**
    Non-technical users who need to extract specific fields (like
    invoice details, dates, names) from documents. They want an
    intuitive UI and quick results with minimal configuration. Pain
    points include time-consuming manual entry and repetitive data
    checks. DocXTractor addresses these by providing simple pipelines
    and clear results (JSON/CSV) so they can work faster and reduce
    errors[\[2\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,with%20sensitive%20information%20and%20regulatory).
2.  **Operations Team (e.g. Data Engineer, IT Specialist):** Technical
    users responsible for maintaining large-scale parsing processes.
    They need fine-grained control over extraction jobs, robust logging,
    and reliability. Pain points include handling many documents,
    retrying failures, and ensuring consistent accuracy. DocXTractor
    gives them tools to define complex schemas (AI-driven or regex),
    manage worker agents, and monitor every job's
    progress. By automating repetitive extraction tasks, it frees the
    team for higher-value
    work[\[2\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,with%20sensitive%20information%20and%20regulatory).

*(Design note: We explicitly outline each persona's goals and context,
as recommended for
PRDs[\[5\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=2,or%20user%20flow%20diagrams%20to).)*

## System Architecture

DocXTractor uses a **split-service architecture** where responsibilities are clearly divided:

**1. Core Backend (NestJS/TypeScript)**
- Main application server handling all user-facing operations
- Manages authentication, pipelines, jobs, and user data
- Provides REST API for the frontend
- Orchestrates document processing jobs
- Sends real-time updates to users via WebSocket
- Stores all data in PostgreSQL database

**2. Worker Service (Python/FastAPI)**
- Specialized service focused on document processing
- Uses `docling` library for parsing PDFs and DOCX files into structured text
- Uses `langextract` library for AI-powered data extraction
- Handles OpenAI API integration for intelligent field extraction
- Processes documents independently and returns results

**3. Communication Layer**
- Services communicate through a **message queue** (Kafka)
- Core Backend sends processing jobs to the queue
- Workers pick up jobs, process them, and send results back
- This approach allows services to work independently and scale separately
- If a worker crashes, jobs are safely retained and can be retried

**How It Works Together:**
1. User uploads a document through the web interface
2. Core Backend saves the file and creates a processing job
3. Job details are sent to the message queue
4. Worker Service picks up the job from the queue
5. Worker parses the document and extracts data using Python libraries
6. Results are sent back through the queue
7. Core Backend receives results and updates the database
8. User sees the extracted data in real-time via WebSocket updates

## Feature List (MoSCoW Priorities)

Features are categorized by priority (Must/Should/Could) for phased
development[\[6\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=3,to%20guide%20development%20efforts):

-   **Must:**

-   **Authentication:** Email/password login. Single-user (Personal).

-   **Pipeline Management:** Create/edit pipelines (templates) with
    fields (name, type, extraction mode). Choose AI (OpenAI/LangExtract)
    or deterministic (regex, XPath) per field. Define output format
    (JSON or CSV).

-   **Input Handling:** Upload documents (drag-drop or file select) in
    supported formats (PDF, DOCX, TXT, HTML). Or enter a URL to fetch
    and parse its content. Perform initial text extraction/OCR as
    needed[\[7\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,other%20text%20extraction%20methods%2C%20too).

-   **Executor Agents:** Launch and run parsing jobs. Agents take
    pipeline + inputs and process documents concurrently. Control each
    job: start, pause, resume, retry. Provide real-time status (pending,
    running, failed, done).

-   **Execution Monitoring:** Show per-job logs and progress bars. Track
    each document's status and errors. Provide a "Retry Failed" action.
    Maintain job history.

-   **Output Download:** After execution, allow downloading results as
    JSON or CSV. Zip multiple files if needed.

-   **Cost & Usage Limits:** Strict daily/monthly hard limits on API usage to prevent billing shock. Display estimated cost per run.

-   **Responsive Web UI:** A modern, user-friendly frontend (desktop and
    tablet).

-   **Should:**

-   **Human Validation (HITL):** Interface for users to review low-confidence extractions side-by-side with the document to ensure data quality.

-   **Few-Shot Examples UI:** When defining an AI field, allow uploading
    or entering example text-output pairs to improve model accuracy.

-   **Pipeline Templates:** Save and list pipelines. Duplicate or
    version pipelines. Provide sample templates (e.g. "Invoice Parser")
    to help new users.

-   **Advanced Fields:** Support data-type hints (number, date, email)
    and validation rules.

-   **Notifications:** Email or in-app notifications on job completion
    or failure.

-   **Search & Filter:** Filter pipelines and jobs by name, date,
    status.

-   **API Endpoints:** (For future) Documented REST API for all
    functions (pipeline, jobs, logs).

-   **Could:**

-   **Scheduling/Queueing:** Schedule recurring pipeline runs or manage
    job queue priorities.

-   **Cloud Storage Integration:** Import documents from/drop output to
    cloud drives (e.g. Google Drive).

-   **Additional Outputs:** Export to Excel or push results to a
    database.

-   **Additional AI Providers:** Support new LLM services (e.g.
    Anthropic) or on-premise models.

-   **Team Collaboration:** Share pipelines across users; role-based
    access control.

-   **Analytics:** Dashboard with usage stats, extraction accuracy
    metrics.

*(Features prioritized with MoSCoW ensure focus on core functionality
first[\[6\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=3,to%20guide%20development%20efforts).)*

## Functional Specifications

### 1. Authentication

-   **Sign-Up/Login:** Users create an account via email/password.
    Passwords stored securely (bcrypt) and all traffic over HTTPS.
-   **User Roles:** Simplified ownership. In V1, all users in a workspace have admin rights. Focus on speed, not permission bureaucracy.
-   **Session Management:** Secure session tokens, expire on logout.
    Standard "Forgot password" flow.
-   *No external SSO in v1 (no integration constraints).*

### 2. Pipeline Configuration

-   **Pipeline Editor:** Form-based UI to define a pipeline. Fields
    include: Name (string), Description (text), Output Format
    (JSON/CSV).
-   **Field Schema Table:** Each row is a field: *Field Name*, *Data
    Type (Text/Number/Date/etc.)*, *Extraction Mode*.
-   *Extraction Mode Options:* **AI (OpenAI or LangExtract)** or
    **Deterministic** (choose Regex or XPath/CSS selector).
-   If **AI mode**: show prompt template and a section for *few-shot
    examples*. Users can paste sample document excerpts with the
    expected field output to "train" the AI.
-   If **Deterministic mode**: show input for a regex or an XPath/CSS
    path string.
-   **Validation:** On save, validate that required fields (e.g. field
    name and mode) are set. For regex fields, test syntax.
-   **Configuration Storage:** Saved in a database (each pipeline record
    with its fields as JSON). Assign a unique Pipeline ID.

*Behaviors:* Pipelines act as extraction templates. Users can return
later to edit or reuse them. The UI will also allow previewing a
pipeline on a sample document (client-side simulation using the current
config).

### 3. Inputs (Documents/URLs)

-   **File Upload:**
-   Users can upload one or more documents per execution (bulk upload).
    Supported: PDF, DOCX, TXT, HTML.
-   The system automatically extracts text: it uses docling from worker service.
-   Validate file type and size limits; show errors if unsupported.
-   **URL Input:**
-   Users can enter a web page URL. The system fetches the HTML content,
    renders text (optionally ignoring scripts/styles), and then runs
    extraction on the text.
-   Show error if the URL is unreachable or invalid.
-   **Queueing:** When a user submits inputs for a pipeline run, create
    an "Execution Job" record with document list and initial status
    Pending. Assign it to an available Executor agent.

### 4. Executor (Agent) Operations

**Execution Engine:** A split architecture where the Core Backend orchestrates jobs and the Worker Service processes documents:

**Core Backend Responsibilities:**
- Receives execution requests from users
- Creates and manages job records in the database
- Sends processing jobs to the message queue
- Receives results from workers via the message queue
- Updates job status in real-time
- Provides job control options (start, pause, resume, retry, cancel)
- Sends live updates to users through WebSocket connections

**Worker Service Responsibilities:**
- Listens for new jobs from the message queue
- Downloads documents from storage
- Parses documents using `docling` (converts PDF/DOCX to structured text)
- Extracts data using `langextract` (AI-based extraction) or traditional methods (regex, XPath)
- Sends results back through the message queue
- Handles errors gracefully and reports failures

**Processing Flow:**
- *Text Extraction:* Convert the document to plain text (and structure if needed) using `docling`.
- *Field Extraction:* For each defined field in the pipeline, apply either the AI model or the deterministic pattern to find the value:
  - **AI mode:** Uses `langextract` with the defined schema and examples
  - **Regex mode:** Applies the specified pattern to find matches
  - **XPath mode:** Extracts data from structured content
- *Error Handling:* If a field fails (no match or API error), log it and mark the field blank or error. Continue other fields.

**Error Handling:**
- Transient errors (like API rate limits) are automatically retried
- Parse errors mark the document as failed but don't stop the entire job
- If the worker crashes, jobs remain in the queue and can be picked up by another worker
- Failed documents can be retried individually without reprocessing successful ones

**Concurrency & Scalability:**
- Multiple worker instances can run simultaneously to process jobs in parallel
- The message queue ensures jobs are distributed evenly across workers
- Workers can be added or removed based on demand without affecting the Core Backend
- Progress is tracked per document, allowing detailed monitoring
- The architecture is API-first, so each job run and status is exposed via REST endpoints[\[3\]](https://swagger.io/resources/articles/adopting-an-api-first-approach/#:~:text=An%20API,with%20the%20stakeholders%20providing%20feedback)[\[4\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=The%20bottom%20line%20is%20that,compatible%20with%20multiple%20programming%20languages).

**Progress Monitoring:**
- Jobs emit events/status: *Queued, In Progress, Succeeded, Failed*
- The UI shows progress bars (e.g., "3 of 10 documents done")
- Each document has a color-coded status (green for success, red for errors)
- Detailed logs show processing time, any warnings, and error details
- All logs are stored and can be viewed after job completion

**Logging:**
- Each executor writes runtime logs (timestamps, any warnings/errors, latency)
- These logs are sent to a central store (e.g., attach to the Execution Job record)
- Users can view logs in real time or after completion

### 5. Execution Monitoring & Logs

-   **Dashboard View:** A table of recent executions (pipeline name, run
    date, #docs, status). Filterable by status (e.g. Failed, Done).
-   **Job Details Page:** Clicking a job shows: list of documents with
    individual status. For each document: show extracted JSON result or
    error.
-   **Log Viewer:** Button to view logs for a job or document. Logs
    include parser output, time taken, any API calls to AI models.
-   **Controls:** From the job page, the user can click **Pause** or
    **Cancel** to stop execution. After failure, a **Retry** button
    requeues the documents.
-   **History:** Keep a history of all runs (timestamp, who ran it,
    pipeline version) for auditing. Allow downloading results per run.

### 6. Output Formats

-   **JSON Output:** By default, produce a JSON object per document with
    field names as keys and extracted values (empty if not found). For
    multiple docs, return an array of such objects.
-   **CSV Output:** Flatten fields into columns. For multi-document
    runs, create a single CSV with one row per document (each column is
    a field).
-   **Download UI:** After job completion, show links/buttons: "Download
    JSON", "Download CSV". Files may be zipped if large or multiple.
-   **Preview:** Optionally, display the first few rows of the output in
    the UI (for quick validation) before full download.

### 7. Cost Control & Safe Limits

**Usage Tracking:**
- The Core Backend tracks how many API calls each user makes
- Daily and monthly limits are enforced to prevent unexpected costs
- Before starting a job, the system checks if the user is within their limits
- If limits are exceeded, job creation is blocked until the next period

**Cost Estimation:**
- When processing documents, the Worker Service calculates token usage
- This usage data is sent back with the results
- The Core Backend aggregates costs per job and displays them to users
- Users see an estimated cost before running bulk extractions
- UI shows "approximate cost" before confirming a bulk run

**Hard Limits Implementation:**
- System administrators can set maximum daily spending limits (e.g., $10/day)
- The system prevents new jobs if the limit would be exceeded
- Users receive warnings when approaching their limits
- Limits reset automatically each day/month

**API Key Management:**
- For V1, API keys are managed via server-side environment variables `OPENAI_API_KEY` to avoid complex vault logic in UI
- Keys are passed to workers only when needed for processing
- All keys are encrypted and never exposed in logs or user interfaces

### 8. Technology Stack & Architecture

**Frontend:**
- React with Next.js or Vite
- Tailwind CSS with **RetroUI** styling (Neubrutalism design)
- WebSocket client for real-time updates

**Core Backend (NestJS):**
- NestJS framework with TypeScript
- Handles API, Auth (Passport/JWT), Database interactions, and Job Orchestration
- PostgreSQL database for all application data
- Redis for session management and caching
- Kafka Message queue integration for job orchestration
- JWT-based authentication

**Worker Service (Python):**
- FastAPI framework with Python
- Dedicated microservice for compute-heavy tasks
- **Parsing:** `docling` library for high-fidelity PDF/DOCX to Markdown conversion
- **Extraction:** `langextract` library for schema-based data extraction
- OpenAI API integration
- Message queue consumer for job processing

**Infrastructure:**
- Message Queue (Kafka) for service communication
- S3-compatible storage for document files
- Docker for containerization
- Docker Compose for local development
- Container orchestration (e.g., Kubernetes) for production deployment
- All development and deployment should be done using Docker and Docker Compose so local setup is minimal.

### 9. Non-Functional Requirements

DocXTractor must meet high standards for performance, security, and UX. Non-functional requirements (NFRs) define **how** the system behaves[\[8\]](https://www.perforce.com/blog/alm/what-are-non-functional-requirements-examples#:~:text=%3E%20Non,security%2C%20usability%2C%20reliability%2C%20and%20scalability):

**Performance:**
- *Response Time:* The UI should load pages (dashboards, editors) within 200ms for perceived instant feedback.
- *Throughput:* An executor must parse a 10-page document (AI and regex fields) in under ~5 seconds on average. The system should handle 10 concurrent jobs without significant slowdown.
- *Scalability:* The architecture supports adding more executor instances to increase parallel processing (horizontal scaling). Under peak load (e.g. 100 simultaneous documents), the service remains responsive.

**Reliability & Availability:**
- Aim for 99% uptime. Executors should auto-retry transient API errors (e.g. 5xx from LLM). In case of a crash, jobs are not lost and will resume when the service recovers. Use job queues to ensure no data is dropped.
- **Fault Tolerance:** If one executor node fails, remaining executors pick up pending jobs.

**Security:**
- **Authentication & Authorization:** Secure login (bcrypt hashes, SSL). Each API endpoint checks user permissions (users see only their pipelines/jobs).
- **Data Protection:** All traffic via HTTPS. Secrets/API keys encrypted at rest[\[8\]](https://www.perforce.com/blog/alm/what-are-non-functional-requirements-examples#:~:text=%3E%20Non,security%2C%20usability%2C%20reliability%2C%20and%20scalability). Sensitive logs scrubbed of secrets.
- **Vulnerability Resistance:** Follow OWASP best practices (e.g. prevent injection attacks on regex/XPath inputs). Rate-limit uploads to prevent DoS. Use CORS properly since it's API-first.
- **Inter-Service Security:** Message queue communications are secured and encrypted

**Usability & UX:**
- Interface should be clean and intuitive, following the chosen design style. Provide responsive design for various screen sizes.
- Use **Neubrutalism (RetroUI)** design: High-energy, functional aesthetics with bold borders (2px-4px black), hard non-blurred shadows, and vibrant accents (e.g., `#fde047` Yellow).
- All forms and buttons have consistent styling and afford clear interactive feedback.
- **Accessibility:** Ensure sufficient contrast and ARIA labels. Keyboard navigation must work for all controls.

**Maintainability:**
- Clear separation between Core Backend and Worker Service
- Comprehensive logging for troubleshooting
- Well-documented API (Swagger/OpenAPI) for future integrations
- Modular codebase that's easy to understand and extend
- The codebase follows modular design (e.g. separate services for parser, AI, web UI).

**Scalability:**
- Worker services can be scaled independently by adding more instances
- The message queue handles job distribution across multiple workers
- Database connection pooling prevents resource exhaustion
- Services can handle increased load by horizontal scaling

**API Consistency:**
- As an API-first product[\[3\]](https://swagger.io/resources/articles/adopting-an-api-first-approach/#:~:text=An%20API,with%20the%20stakeholders%20providing%20feedback)[\[4\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=The%20bottom%20line%20is%20that,compatible%20with%20multiple%20programming%20languages), all endpoints follow a uniform naming and versioning scheme.
- Responses use consistent JSON schemas. API documentation (Swagger/OpenAPI) is generated automatically.

**Monitoring & Logging:**
- Internally, emit metrics (e.g. job count, success rate) to a monitoring system.
- Error logs should be retained for at least 90 days.

**Regulatory:**
- If handling sensitive data, comply with privacy standards (e.g. do not store personal data longer than needed).

*(These NFRs ensure DocXTractor "how the system behaves"[\[8\]](https://www.perforce.com/blog/alm/what-are-non-functional-requirements-examples#:~:text=%3E%20Non,security%2C%20usability%2C%20reliability%2C%20and%20scalability) under realistic conditions.)*

## UI Wireframe & Design Guidelines

The web UI adopts a **Neubrutalism / RetroUI** style: distinct, high-contrast, and tactile.
Key visual tokens:
-   **Borders:** Thick 2px-4px pure black (`#000000`) borders on cards/inputs. Small radius (4px-8px).
-   **Shadows:** Hard, non-blurred offsets (4px-8px) in black to create a "pop" effect.
-   **Colors:** Primary Yellow (`#fde047`), Stark White backgrounds, and deep Black text.
-   **Typography:** Public Sans or Inter (Extra Bold Headings) for strong readability.

The overall layout uses a fixed sidebar (or top bar) for navigation and a main content panel. Key wireframes:

-   **Dashboard (Home):**
    - Sidebar with main menu items (Pipelines, Runs, Secrets, Settings). The background is a light neutral gray.
    - **Pipeline Cards:** In the main panel, each pipeline appears as a rounded-corner card (neumorphic effect: subtle inner/outer shadows giving a "lifted" look) containing the pipeline name, description, and a colored icon.
    - **Primary Buttons:** "New Pipeline", "Upload & Run" buttons use neobrutalist cues -- bold outlines or accent color fills (e.g. vibrant teal) against the soft background, providing clear CTAs.

-   **Pipeline Editor:**
    - A form in a centered container with soft shadow edges. Field inputs (text, dropdowns) appear as indent/sunken elements in the background (neumorphic style) to suggest depth[\[9\]](https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/#:~:text=Neumorphism%20is%20all%20about%20creating,help%20to%20create%20this%20effect).
    - The Fields table uses alternating light panels. For each field row, the selected extraction mode shows either a multi-line AI prompt box (light gray, elevated slightly) or a regex input (monospace font).
    - **Few-Shot Section:** An accordion or panel where examples can be added. Each example card floats with subtle shadow, blending into the background[\[9\]](https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/#:~:text=Neumorphism%20is%20all%20about%20creating,help%20to%20create%20this%20effect).
    - Primary actions (Save, Test, Delete) are large buttons with thick borders (neobrutalist influence) and hover shadows.

-   **Execution Monitor (Run View):**
    - The run's detail page shows a progress bar at top (bold colored bar on a light track). Below, a table lists documents. Completed rows have green check icons; errors show red outlines or icons (contrasting with neutral row colors).
    - Clicking a document row expands a neumorphic panel with its JSON output or error log. The panel edges softly shadow inwards, visually grouping the data[\[9\]](https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/#:~:text=Neumorphism%20is%20all%20about%20creating,help%20to%20create%20this%20effect).
    - Sidebar (if any) or header shows quick stats (Jobs In-Progress, Failed, Succeeded) in bold text on pastel badges (neobrutal use of color) for at-a-glance status.

-   **Secrets & Settings Page:**
    - Simple list of saved secrets, each as a light card with masked key text. "Add Secret" is a prominent button (bold color accent). Input fields for keys are inset (sunken effect).

-   Ensure the design remains **consistent** across pages: the same palette of muted grays for backgrounds and vibrant accent colors (teal, coral, etc.) for highlights, as suggested for neobrutalism[\[10\]](https://www.cccreative.design/blogs/brutalism-vs-neubrutalism-in-ui-design#:~:text=Neobrutalism%2C%20as%20the%20name%20suggests%2C,while%20offering%20more%20visual%20friendliness). Text is clear, with a sans-serif font. Use consistent iconography (flat, solid icons to match the style).

*(These wireframes combine neumorphism's softness with neobrutalism's boldness[\[9\]](https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/#:~:text=Neumorphism%20is%20all%20about%20creating,help%20to%20create%20this%20effect)[\[10\]](https://www.cccreative.design/blogs/brutalism-vs-neubrutalism-in-ui-design#:~:text=Neobrutalism%2C%20as%20the%20name%20suggests%2C,while%20offering%20more%20visual%20friendliness), creating an interface that is modern yet accessible.)*

## User Flows

User interactions follow clear step-by-step flows[\[11\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=Could,will%20interact%20with%20the%20product). Key flows include:

-   **Sign-In & Onboarding:** User registers or logs in (Email/Password). After login, they land on the Dashboard (list of pipelines).

-   **Create Pipeline Flow:** From Dashboard, user clicks **"New Pipeline"** → **Pipeline Editor** opens → User enters name/description → Adds fields one by one (specifying name, type, mode) → For AI fields, user enters example pairs → User clicks **"Save"** → Pipeline appears on Dashboard.

-   **Run Pipeline Flow:** User selects a pipeline (or clicks **"Upload & Run"**) → In a run dialog, user uploads one or more documents (or pastes a URL) → Click **"Start Run"** → System creates an Execution Job and routes to an Executor → User is taken to the **Run Monitor** page. They see progress (e.g. "Document 3 of 10 being processed").

-   **Monitor & Output Flow:** While running, user may click **"Logs"** to view real-time logs (frontend polls the API). After completion, the page shows final status. User clicks **"Download JSON"** or **"Download CSV"** to retrieve extracted data. If any docs failed, user clicks **"Retry Failed"** to reprocess them.

-   **Manage Secrets Flow:** Admin user opens **Settings → Secrets** → Clicks **"Add API Key"** → Enters key label and value → Clicks Save. The new key appears in the list, ready to be used by pipelines.

*(Diagrams illustrating these flows would depict screens like Login → Dashboard → Pipeline Editor → Run Monitor. These flows ensure users move logically from creating a pipeline to executing and retrieving results[\[11\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=Could,will%20interact%20with%20the%20product).)*

## Development Roadmap (Milestones)

We adopt an **agile, milestone-based** plan[\[12\]](https://www.wrike.com/agile-guide/faq/what-is-a-milestone-in-agile/#:~:text=An%20Agile%20milestone%20is%20a,still%20needs%20to%20be%20done). Each milestone is a significant release:

**Milestone 1 (Weeks 1-2): "Foundation & Plumbing"**
- Set up Core Backend (NestJS) with authentication and database
- Set up Worker Service (Python) with basic `docling` and `langextract` integration
- Establish message queue communication between services
- Create basic pipeline management functionality
- Build auth system, DB schema, Pipeline Editor (JSON Schema)
- Set up Job Worker infrastructure
- **Deliverable:** Both services can communicate, and basic document parsing works

**Milestone 2 (Weeks 3-4): "End-to-End Processing"**
- Complete job orchestration in Core Backend
- Implement full extraction pipeline in Worker (AI and deterministic modes)
- Add file upload and storage handling
- Build real-time monitoring with WebSocket
- Create Pipeline Editor and Run Monitor UI
- Implement Deterministic Extraction + OpenAI Integration
- Add basic usage counting
- **Deliverable:** Users can create pipelines, upload documents, and see extraction results

**Milestone 3 (Weeks 5-6): "Cost Control & Scaling"**
- Implement usage tracking and hard limits
- Add cost estimation and reporting
- Enable job control features (pause, resume, retry)
- Test horizontal scaling with multiple workers
- Optimize performance and handle concurrent jobs
- Implement batch processing with Worker Queue
- **Deliverable:** System handles 100+ documents reliably with cost controls

**Milestone 4 (Weeks 7-8): "Validation & Launch"**
- Add human-in-the-loop validation interface
- Implement few-shot examples UI for AI fields
- Create comprehensive API documentation
- Security audit and bug fixes
- Polish UI/UX and add search/filter features
- Prepare deployment documentation
- Bug bash and complete documentation
- **Deliverable:** Production-ready V1 launch

*(Each milestone corresponds to a key stage in development[\[12\]](https://www.wrike.com/agile-guide/faq/what-is-a-milestone-in-agile/#:~:text=An%20Agile%20milestone%20is%20a,still%20needs%20to%20be%20done), ensuring that by the end, all core features and quality standards are met.)*


### References

-   Docsumo -- *What is Document Parsing?* (defines parsing steps and
    benefits)[\[1\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=Document%20parsing%20is%20the%20key,it%20into%20a%20usable%20format)[\[2\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,with%20sensitive%20information%20and%20regulatory)[\[4\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=The%20bottom%20line%20is%20that,compatible%20with%20multiple%20programming%20languages).
-   Perforce -- *How to Write a PRD* (guidelines: personas, MoSCoW,
    flows, NFR,
    roadmap)[\[5\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=2,or%20user%20flow%20diagrams%20to)[\[13\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=3,will%20interact%20with%20the%20product)[\[14\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=provide%20visual%20context%20for%20how,needs%2C%20and%20regulatory%20compliance%20obligations)[\[15\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=9,in%20before%20development%20starts).
-   Swagger -- *API-First Approach* (API-first development
    principles)[\[3\]](https://swagger.io/resources/articles/adopting-an-api-first-approach/#:~:text=An%20API,with%20the%20stakeholders%20providing%20feedback).
-   UX Design Institute -- *Neumorphism in UI Design* (soft UI
    principles)[\[9\]](https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/#:~:text=Neumorphism%20is%20all%20about%20creating,help%20to%20create%20this%20effect).
-   CC Creative -- *Neobrutalism vs Brutalism* (bold outlines, playful
    colors in
    UI)[\[10\]](https://www.cccreative.design/blogs/brutalism-vs-neubrutalism-in-ui-design#:~:text=Neobrutalism%2C%20as%20the%20name%20suggests%2C,while%20offering%20more%20visual%20friendliness).
-   Perforce (ALM Blog) -- *Non-Functional Requirements Guide* (defines
    performance, security,
    etc.)[\[8\]](https://www.perforce.com/blog/alm/what-are-non-functional-requirements-examples#:~:text=%3E%20Non,security%2C%20usability%2C%20reliability%2C%20and%20scalability).
-   Wrike Agile Guide -- *What Is a Milestone in Agile?* (milestone
    definition in agile
    projects)[\[12\]](https://www.wrike.com/agile-guide/faq/what-is-a-milestone-in-agile/#:~:text=An%20Agile%20milestone%20is%20a,still%20needs%20to%20be%20done).

[\[1\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=Document%20parsing%20is%20the%20key,it%20into%20a%20usable%20format)
[\[2\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,with%20sensitive%20information%20and%20regulatory)
[\[4\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=The%20bottom%20line%20is%20that,compatible%20with%20multiple%20programming%20languages)
[\[7\]](https://www.docsumo.com/blogs/data-extraction/document-parsing#:~:text=,other%20text%20extraction%20methods%2C%20too)
What is Document Parsing? A Comprehensive Guide to Understanding and
Utilizing This Crucial Process

<https://www.docsumo.com/blogs/data-extraction/document-parsing>

[\[3\]](https://swagger.io/resources/articles/adopting-an-api-first-approach/#:~:text=An%20API,with%20the%20stakeholders%20providing%20feedback)
Understanding  the API-First Approach to Building Products

<https://swagger.io/resources/articles/adopting-an-api-first-approach/>

[\[5\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=2,or%20user%20flow%20diagrams%20to)
[\[6\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=3,to%20guide%20development%20efforts)
[\[11\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=Could,will%20interact%20with%20the%20product)
[\[13\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=3,will%20interact%20with%20the%20product)
[\[14\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=provide%20visual%20context%20for%20how,needs%2C%20and%20regulatory%20compliance%20obligations)
[\[15\]](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd#:~:text=9,in%20before%20development%20starts)
How to Write a PRD: Your Complete Guide to Product Requirements
Documents \| Perforce Software

<https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd>

[\[8\]](https://www.perforce.com/blog/alm/what-are-non-functional-requirements-examples#:~:text=%3E%20Non,security%2C%20usability%2C%20reliability%2C%20and%20scalability)
Non-Functional Requirements: Tips, Tools, and Examples \| Perforce
Software

<https://www.perforce.com/blog/alm/what-are-non-functional-requirements-examples>

[\[9\]](https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/#:~:text=Neumorphism%20is%20all%20about%20creating,help%20to%20create%20this%20effect)
What Is Neumorphism in UI Design? \[And How To Use It\]

<https://www.uxdesigninstitute.com/blog/neumorphism-in-ui-design/>

[\[10\]](https://www.cccreative.design/blogs/brutalism-vs-neubrutalism-in-ui-design#:~:text=Neobrutalism%2C%20as%20the%20name%20suggests%2C,while%20offering%20more%20visual%20friendliness)
Brutalism vs Neubrutalism in UI Design: Unpacking the Differences

<https://www.cccreative.design/blogs/brutalism-vs-neubrutalism-in-ui-design>

[\[12\]](https://www.wrike.com/agile-guide/faq/what-is-a-milestone-in-agile/#:~:text=An%20Agile%20milestone%20is%20a,still%20needs%20to%20be%20done)
What Is a Milestone in Agile? \| Wrike Agile Guide

<https://www.wrike.com/agile-guide/faq/what-is-a-milestone-in-agile/>
