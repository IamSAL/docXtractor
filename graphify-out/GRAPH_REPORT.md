# Graph Report - server + client  (2026-04-13)

## Corpus Check
- Large corpus: 466 files

## Summary
- 1607 nodes · 2327 edges · 132 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.86)
- Token cost: 3,072 input · 1,536 output

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 25 edges
2. `RunsService` - 23 edges
3. `RunsGateway` - 23 edges
4. `DocXtractor NestJS Server` - 17 edges
5. `AuthController` - 16 edges
6. `NotificationService` - 16 edges
7. `WorkflowsService` - 14 edges
8. `ExtractorsService` - 14 edges
9. `getSocket()` - 14 edges
10. `DocXtractor React Client (TanStack App)` - 14 edges

## Surprising Connections (you probably didn't know these)
- `DocXtractor React Client (TanStack App)` --conceptually_related_to--> `DocXtractor NestJS Server`  [INFERRED]
  client/README.md → server/README.md
- `DocXtractor React Client (TanStack App)` --conceptually_related_to--> `robots.txt (Allow All Crawlers)`  [INFERRED]
  client/README.md → client/public/robots.txt
- `React Logo SVG` --conceptually_related_to--> `Atomic/Orbital Symbol Shape`  [EXTRACTED]
  client/public/logo.svg → client/src/logo.svg
- `React Logo SVG` --conceptually_related_to--> `React Brand Identity`  [EXTRACTED]
  client/public/logo.svg → client/src/logo.svg
- `React Logo SVG` --references--> `Client Source Directory`  [EXTRACTED]
  client/public/logo.svg → client/src/logo.svg

## Communities

### Community 0 - "AI Chat UI"
Cohesion: 0.02
Nodes (12): getImageSrc(), handleDownload(), dashboardControllerGetStats(), getDashboardControllerGetStatsQueryKey(), getDashboardControllerGetStatsQueryOptions(), getDashboardControllerGetStatsUrl(), useDashboardControllerGetStats(), StoreDevtoolsEventClient (+4 more)

### Community 1 - "Core Server & Workflow Nodes"
Cohesion: 0.02
Nodes (52): AppController, AppModule, CreateRunDto, RunSourceDto, CreateWorkflowDto, DashboardController, DashboardModule, DashboardService (+44 more)

### Community 2 - "Admin & Invite System"
Cohesion: 0.03
Nodes (34): AcceptInviteDto, AdminController, Admin, AdminModule, AdminPaginatedDto, AdminResponseDto, AdminSetupDto, AuthModule (+26 more)

### Community 3 - "Frontend UI Components"
Cohesion: 0.02
Nodes (5): asObjectSchema(), getSchemaDescription(), isBooleanSchema(), isObjectSchema(), withObjectSchema()

### Community 4 - "Auth API Client Hooks"
Cohesion: 0.05
Nodes (59): authControllerAdminSetup(), authControllerForgotPassword(), authControllerGoogleAuth(), authControllerGoogleAuthRedirect(), authControllerInitiateEmailVerification(), authControllerLogin(), authControllerRefreshToken(), authControllerResetPassword() (+51 more)

### Community 5 - "Extractor Domain"
Cohesion: 0.05
Nodes (13): CreateExtractorDto, FewShotExampleDto, FewShotExampleSourceDto, Extractor, ExtractorsController, ExtractorsModule, ExtractorsService, GenerateExtractorDto (+5 more)

### Community 6 - "Notification System"
Cohesion: 0.05
Nodes (12): BulkNotificationDto, CreateNotificationDto, NotificationController, Notification, NotificationModule, NotificationService, PushKeys, PushSubscriptionContent (+4 more)

### Community 7 - "Workflow API Client Hooks"
Cohesion: 0.07
Nodes (44): getWorkflowsControllerActivateMutationOptions(), getWorkflowsControllerActivateUrl(), getWorkflowsControllerCreateMutationOptions(), getWorkflowsControllerCreateUrl(), getWorkflowsControllerFindAllQueryKey(), getWorkflowsControllerFindAllQueryOptions(), getWorkflowsControllerFindAllUrl(), getWorkflowsControllerFindOneQueryKey() (+36 more)

### Community 8 - "Extractor API Client Hooks"
Cohesion: 0.07
Nodes (42): extractorsControllerAddVariant(), extractorsControllerCreate(), extractorsControllerDeleteVariant(), extractorsControllerFindAll(), extractorsControllerFindOne(), extractorsControllerGenerateExtractor(), extractorsControllerGenerateSchema(), extractorsControllerRemove() (+34 more)

### Community 9 - "Frontend Config & Dev Tools"
Cohesion: 0.06
Nodes (40): Anthropic API, Biome (Linting & Formatting), TanStack Chat Application (Demo Feature), Claude AI (Anthropic Claude 3.5 Sonnet), Rationale: Derived State Updates Automatically from Base State, Client Env Config (src/env.mjs), File-Based Routing (src/routes/), Lucide Icons (+32 more)

### Community 10 - "Runs API Client Hooks"
Cohesion: 0.09
Nodes (34): getRunsControllerCreateMutationOptions(), getRunsControllerCreateUrl(), getRunsControllerFindAllQueryKey(), getRunsControllerFindAllQueryOptions(), getRunsControllerFindAllUrl(), getRunsControllerFindOneQueryKey(), getRunsControllerFindOneQueryOptions(), getRunsControllerFindOneUrl() (+26 more)

### Community 11 - "Runs HTTP Controller"
Cohesion: 0.06
Nodes (2): RunsController, RunsGateway

### Community 12 - "Workflow Builder UI"
Cohesion: 0.09
Nodes (14): getSocket(), joinWorkflow(), joinWorkflowExecution(), joinWorkflowsList(), leaveWorkflow(), leaveWorkflowExecution(), leaveWorkflowsList(), onWorkflowExecutionCompleted() (+6 more)

### Community 13 - "Auth Service Logic"
Cohesion: 0.13
Nodes (1): AuthService

### Community 14 - "Instance Settings UI"
Cohesion: 0.12
Nodes (18): getInstanceSettingsControllerGetPublicStatusQueryKey(), getInstanceSettingsControllerGetPublicStatusQueryOptions(), getInstanceSettingsControllerGetPublicStatusUrl(), getInstanceSettingsControllerGetSettingsQueryKey(), getInstanceSettingsControllerGetSettingsQueryOptions(), getInstanceSettingsControllerGetSettingsUrl(), getInstanceSettingsControllerTestSmtpMutationOptions(), getInstanceSettingsControllerTestSmtpUrl() (+10 more)

### Community 15 - "Runs Orchestration Service"
Cohesion: 0.25
Nodes (1): RunsService

### Community 16 - "Users API Client Hooks"
Cohesion: 0.13
Nodes (22): getUserControllerCreateMutationOptions(), getUserControllerCreateUrl(), getUserControllerFindAllQueryKey(), getUserControllerFindAllQueryOptions(), getUserControllerFindAllUrl(), getUserControllerFindOneQueryKey(), getUserControllerFindOneQueryOptions(), getUserControllerFindOneUrl() (+14 more)

### Community 17 - "Files API Client Hooks"
Cohesion: 0.13
Nodes (22): filesControllerConfirmFiles(), filesControllerGetFile(), filesControllerListFiles(), filesControllerUploadFile(), filesControllerUploadMultipleFiles(), getFilesControllerConfirmFilesMutationOptions(), getFilesControllerConfirmFilesUrl(), getFilesControllerGetFileQueryKey() (+14 more)

### Community 18 - "Invites API Client Hooks"
Cohesion: 0.13
Nodes (22): getInviteControllerAcceptMutationOptions(), getInviteControllerAcceptUrl(), getInviteControllerCreateMutationOptions(), getInviteControllerCreateUrl(), getInviteControllerFindAllQueryKey(), getInviteControllerFindAllQueryOptions(), getInviteControllerFindAllUrl(), getInviteControllerRevokeMutationOptions() (+14 more)

### Community 19 - "Run Data Models"
Cohesion: 0.11
Nodes (0): 

### Community 20 - "Workflow DTOs"
Cohesion: 0.11
Nodes (5): WorkflowConnectionDto, WorkflowDefinitionDto, WorkflowNodeDto, WorkflowNodePositionDto, WorkflowsController

### Community 21 - "Auth HTTP Controller"
Cohesion: 0.12
Nodes (1): AuthController

### Community 22 - "Ollama AI Service"
Cohesion: 0.15
Nodes (2): OllamaService, Semaphore

### Community 23 - "Workflows Service"
Cohesion: 0.26
Nodes (1): WorkflowsService

### Community 24 - "Schema Editor Logic"
Cohesion: 0.22
Nodes (6): copySchema(), removeObjectProperty(), renameObjectProperty(), reorderFields(), updateObjectProperty(), updatePropertyRequired()

### Community 25 - "User Service"
Cohesion: 0.3
Nodes (1): UserService

### Community 26 - "Guitar Racing Example"
Cohesion: 0.23
Nodes (12): Candy Apple Red Finish, Chrome Hardware, DocXtractor Example Asset, Dual Humbucker Pickups, Electric Guitar, Example Guitar Racing Image, Knurled Control Knobs, Motorsport / Racing Aesthetic (+4 more)

### Community 27 - "Extract Data Workflow Node"
Cohesion: 0.24
Nodes (2): ExtractDataNode, FilterNode

### Community 28 - "Schema Inference"
Cohesion: 0.35
Nodes (10): createSchemaFromJson(), detectEnumsInArrayItems(), detectSemanticFormatsInArrayItems(), inferArraySchema(), inferNumberSchema(), inferObjectSchema(), inferSchema(), inferStringSchema() (+2 more)

### Community 29 - "Extractor Zod Schemas"
Cohesion: 0.18
Nodes (0): 

### Community 30 - "Instance Settings Service"
Cohesion: 0.33
Nodes (1): InstanceSettingsService

### Community 31 - "App Health Check API"
Cohesion: 0.31
Nodes (9): appControllerHandleGetRequest(), appControllerHandleHeadRequest(), getAppControllerHandleGetRequestQueryKey(), getAppControllerHandleGetRequestQueryOptions(), getAppControllerHandleGetRequestUrl(), getAppControllerHandleHeadRequestMutationOptions(), getAppControllerHandleHeadRequestUrl(), useAppControllerHandleGetRequest() (+1 more)

### Community 32 - "Chat API Client Hooks"
Cohesion: 0.31
Nodes (9): chatControllerCreate(), chatControllerTest(), getChatControllerCreateMutationOptions(), getChatControllerCreateUrl(), getChatControllerTestQueryKey(), getChatControllerTestQueryOptions(), getChatControllerTestUrl(), useChatControllerCreate() (+1 more)

### Community 33 - "Workflow Trigger Config DTOs"
Cohesion: 0.22
Nodes (0): 

### Community 34 - "Guitar Motherboard Example"
Cohesion: 0.31
Nodes (10): Binary Code Fretboard Inlays, Circuit Board / PCB (Motherboard), Circuit-Style Headstock Logo, Electric Guitar, DocXtractor Example Document (Demo Asset), Guitar Circuit Board Hybrid (Concept Art), Humbucker Pickups (Guitar), Illuminated LED Circuit Traces (Blue, Green, Red) (+2 more)

### Community 35 - "Guitar Steamer Trunk Example"
Cohesion: 0.27
Nodes (10): Heavily Aged / Relic Wood Finish, Bigsby-Style Tremolo Bridge, Custom / Luthier-Built Instrument, DocXtractor Example Document Asset, Gold Hardware (Tuners, Pickguard, Knobs), Guitar Steamer Trunk (Custom Electric Guitar), Dual Humbucker Pickups, Semi-Hollow Body Guitar Design (+2 more)

### Community 36 - "Admin Service"
Cohesion: 0.42
Nodes (1): AdminService

### Community 37 - "JSON Schema Validation"
Cohesion: 0.39
Nodes (7): buildValidationTree(), getJsonArrayType(), getJsonNumberType(), getJsonObjectType(), getJsonStringType(), getTypeValidation(), validateSchemaByType()

### Community 38 - "JSON Validator Component"
Cohesion: 0.25
Nodes (2): extractErrorPosition(), validateJson()

### Community 39 - "Run Creation DTOs"
Cohesion: 0.22
Nodes (0): 

### Community 40 - "Guitar Video Game Example"
Cohesion: 0.33
Nodes (9): D-Pad / Cross Controller Icon (Pixel Art), Electric Guitar (Instrument Type), Example Document Asset (DocXtractor), Video Game Themed Electric Guitar, Pac-Man Ghost (Pixel Art), Retro Pixel Art Decoration, Product Photography, Retro Video Games (Theme/Culture) (+1 more)

### Community 41 - "React Brand Assets"
Cohesion: 0.39
Nodes (9): Client Source Directory, Atomic Orbits Design (Three Elliptical Orbits + Center Dot), Atomic/Orbital Symbol Shape, DocXtractor Client Application, React Brand Color #61DAFB (Cyan-Blue), React Brand Identity, React JavaScript Framework, React Logo SVG (+1 more)

### Community 42 - "Guitar Flowers Example"
Cohesion: 0.33
Nodes (9): Floral-Painted Acoustic Guitar, DocXtractor Example Input File, Hand-Painted Floral Artwork, Flowerly Love Guitars (Brand), Natural Maple Guitar Body, Wooden Guitar Stand, Poppies (Red, Pink), Product Photography (+1 more)

### Community 43 - "Workflow Trigger Manager"
Cohesion: 0.36
Nodes (1): TriggerManagerService

### Community 44 - "Workflow Executor"
Cohesion: 0.43
Nodes (1): WorkflowExecutorService

### Community 45 - "Mail Service"
Cohesion: 0.43
Nodes (1): MailService

### Community 46 - "Queue Service"
Cohesion: 0.43
Nodes (1): QueueService

### Community 47 - "Workflow Node Registry"
Cohesion: 0.43
Nodes (1): NodeRegistryService

### Community 48 - "Files Service"
Cohesion: 0.29
Nodes (1): FilesService

### Community 49 - "Files HTTP Controller"
Cohesion: 0.29
Nodes (1): FilesController

### Community 50 - "Object Schema Editor"
Cohesion: 0.33
Nodes (0): 

### Community 51 - "Guitar Traveling Example"
Cohesion: 0.4
Nodes (6): Acoustic Guitar with Travel Postcard Artwork, Example Document for Extraction (Guitar Travel Theme), Eiffel Tower (Paris), New York City Landmark, Vintage Travel Postcards Collage, Vintage Postage Stamps

### Community 52 - "TanStack Demo Asset"
Cohesion: 0.6
Nodes (6): Tropical Beach Sunset Scene, TanStack Brand / Logo, DocXtractor Client Public Assets, TanStack Ukulele Example Image, Marketing / Promotional Asset, Ukulele (Musical Instrument)

### Community 53 - "Guitar Superhero Example"
Cohesion: 0.4
Nodes (6): Chrome Hardware (Bridge, Knobs, Toggle Switch), Electric Guitar (Black, Les Paul Style), DocXtractor Example Document Asset, Dual Humbucker Pickups, Rosewood Fretboard with Dot Inlays, Superhero Shield Logo with Wings (Letter S)

### Community 54 - "Email Workflow Node"
Cohesion: 0.5
Nodes (1): SendEmailNode

### Community 55 - "Number Schema Editor"
Cohesion: 0.6
Nodes (3): handleAddEnumValue(), handleRemoveEnumValue(), handleValidationChange()

### Community 56 - "Webhook Trigger API"
Cohesion: 0.6
Nodes (4): getWebhookTriggerControllerHandleWebhookMutationOptions(), getWebhookTriggerControllerHandleWebhookUrl(), useWebhookTriggerControllerHandleWebhook(), webhookTriggerControllerHandleWebhook()

### Community 57 - "Files DB Migration"
Cohesion: 0.5
Nodes (1): CreateFilesTable1706345678000

### Community 58 - "Dashboard DTOs"
Cohesion: 0.5
Nodes (2): CreateDashboardDto, UpdateDashboardDto

### Community 59 - "Schema Property Editor"
Cohesion: 0.5
Nodes (0): 

### Community 60 - "Schema Field Component"
Cohesion: 0.5
Nodes (0): 

### Community 61 - "String Schema Editor"
Cohesion: 0.83
Nodes (3): handleAddEnumValue(), handleRemoveEnumValue(), handleValidationChange()

### Community 62 - "Array Schema Editor"
Cohesion: 0.67
Nodes (2): buildValidationProps(), handleValidationChange()

### Community 63 - "Dashboard & Run Summary DTOs"
Cohesion: 0.5
Nodes (0): 

### Community 64 - "i18n Translation Hook"
Cohesion: 0.67
Nodes (0): 

### Community 65 - "Dashboard Entity"
Cohesion: 1.0
Nodes (1): Dashboard

### Community 66 - "Add Field Button"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "JSON Schema Editor Root"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Schema Field List"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Schema Visualizer"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Schema Type Dropdown"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Boolean Schema Editor"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Schema Inferencer"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Monaco Theme Hook"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "File Download Response"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Schema Variant Creation DTO"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Runs List Filter Params"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "Schema Variant Update DTO"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "Create User DTO"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "Chat DTOs"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "Create Invite DTO"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "Update User DTO"
Cohesion: 1.0
Nodes (0): 

### Community 82 - "User List Filter Params"
Cohesion: 1.0
Nodes (0): 

### Community 83 - "Auth Response Models"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "VAPID Key Generator"
Cohesion: 1.0
Nodes (0): 

### Community 85 - "Orval Config"
Cohesion: 1.0
Nodes (0): 

### Community 86 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 87 - "Client Env Config"
Cohesion: 1.0
Nodes (0): 

### Community 88 - "Type Editor Component"
Cohesion: 1.0
Nodes (0): 

### Community 89 - "Schema Type Selector"
Cohesion: 1.0
Nodes (0): 

### Community 90 - "i18n Translation Keys"
Cohesion: 1.0
Nodes (0): 

### Community 91 - "i18n Translation Context"
Cohesion: 1.0
Nodes (0): 

### Community 92 - "German Translations"
Cohesion: 1.0
Nodes (0): 

### Community 93 - "Spanish Translations"
Cohesion: 1.0
Nodes (0): 

### Community 94 - "English Translations"
Cohesion: 1.0
Nodes (0): 

### Community 95 - "Ukrainian Translations"
Cohesion: 1.0
Nodes (0): 

### Community 96 - "Chinese Translations"
Cohesion: 1.0
Nodes (0): 

### Community 97 - "French Translations"
Cohesion: 1.0
Nodes (0): 

### Community 98 - "Russian Translations"
Cohesion: 1.0
Nodes (0): 

### Community 99 - "File List Item Model"
Cohesion: 1.0
Nodes (0): 

### Community 100 - "File Upload Response"
Cohesion: 1.0
Nodes (0): 

### Community 101 - "Update Instance Settings DTO"
Cohesion: 1.0
Nodes (0): 

### Community 102 - "File Upload Body"
Cohesion: 1.0
Nodes (0): 

### Community 103 - "Admin Setup DTO"
Cohesion: 1.0
Nodes (0): 

### Community 104 - "Create Dashboard DTO"
Cohesion: 1.0
Nodes (0): 

### Community 105 - "Generate Extractor DTO"
Cohesion: 1.0
Nodes (0): 

### Community 106 - "Invite List Filter Params"
Cohesion: 1.0
Nodes (0): 

### Community 107 - "Accept Invite DTO"
Cohesion: 1.0
Nodes (0): 

### Community 108 - "Login DTO"
Cohesion: 1.0
Nodes (0): 

### Community 109 - "Extractor Few Shot Item DTO"
Cohesion: 1.0
Nodes (0): 

### Community 110 - "Multi-File Upload Body"
Cohesion: 1.0
Nodes (0): 

### Community 111 - "Update Dashboard DTO"
Cohesion: 1.0
Nodes (0): 

### Community 112 - "Confirm Files Body"
Cohesion: 1.0
Nodes (0): 

### Community 113 - "Generate Schema DTO"
Cohesion: 1.0
Nodes (0): 

### Community 114 - "Test SMTP DTO"
Cohesion: 1.0
Nodes (0): 

### Community 115 - "Update Extractor Few Shot DTO"
Cohesion: 1.0
Nodes (0): 

### Community 116 - "Email Verification Body"
Cohesion: 1.0
Nodes (0): 

### Community 117 - "Sign Up Response"
Cohesion: 1.0
Nodes (0): 

### Community 118 - "Sign Up DTO"
Cohesion: 1.0
Nodes (0): 

### Community 119 - "Update Email DTO"
Cohesion: 1.0
Nodes (0): 

### Community 120 - "Verify Email DTO"
Cohesion: 1.0
Nodes (0): 

### Community 121 - "Multi-File Upload Response"
Cohesion: 1.0
Nodes (0): 

### Community 122 - "Chat Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 123 - "Auth Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 124 - "Workflows Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 125 - "Dashboard Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 126 - "Users Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 127 - "Instance Settings Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 128 - "Files Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 129 - "Webhook Trigger Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 130 - "Invites Zod Schema"
Cohesion: 1.0
Nodes (0): 

### Community 131 - "Runs Zod Schema"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `DocXtractor React Client (TanStack App)` → `TanStack Chat Application (Demo Feature)`  [AMBIGUOUS]
  client/README.md · relation: conceptually_related_to

## Knowledge Gaps
- **123 isolated node(s):** `AppModule`, `DatabaseModule`, `InstanceSettingsModule`, `UpdateInstanceSettingsDto`, `TestSmtpDto` (+118 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Dashboard Entity`** (2 nodes): `dashboard.entity.ts`, `Dashboard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Add Field Button`** (2 nodes): `AddFieldButton.tsx`, `AddFieldButton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JSON Schema Editor Root`** (2 nodes): `JsonSchemaEditor.tsx`, `JsonSchemaEditor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Field List`** (2 nodes): `SchemaFieldList.tsx`, `SchemaFieldList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Visualizer`** (2 nodes): `JsonSchemaVisualizer.tsx`, `JsonSchemaVisualizer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Type Dropdown`** (2 nodes): `TypeDropdown.tsx`, `handleClickOutside()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Boolean Schema Editor`** (2 nodes): `BooleanEditor.tsx`, `handleAllowedChange()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Inferencer`** (2 nodes): `SchemaInferencer.tsx`, `SchemaInferencer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Monaco Theme Hook`** (2 nodes): `use-monaco-theme.ts`, `useMonacoTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Download Response`** (2 nodes): `filesControllerGetFile200.ts`, `filesControllerGetFile200Metadata.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Variant Creation DTO`** (2 nodes): `createSchemaVariantDto.ts`, `createSchemaVariantDtoSchema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Runs List Filter Params`** (2 nodes): `runsControllerFindAllParams.ts`, `runsControllerFindAllStatus.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Variant Update DTO`** (2 nodes): `updateSchemaVariantDto.ts`, `updateSchemaVariantDtoSchema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create User DTO`** (2 nodes): `createUserDto.ts`, `createUserDtoRole.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chat DTOs`** (2 nodes): `createChatDto.ts`, `messageDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Invite DTO`** (2 nodes): `createInviteDto.ts`, `createInviteDtoRole.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update User DTO`** (2 nodes): `updateUserDto.ts`, `updateUserDtoRole.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User List Filter Params`** (2 nodes): `userControllerFindAllParams.ts`, `userControllerFindAllRole.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Response Models`** (2 nodes): `authResponse.ts`, `userResponseDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `VAPID Key Generator`** (1 nodes): `generate-vapid.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Orval Config`** (1 nodes): `orval.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Client Env Config`** (1 nodes): `env.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Editor Component`** (1 nodes): `TypeEditor.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Type Selector`** (1 nodes): `SchemaTypeSelector.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `i18n Translation Keys`** (1 nodes): `translation-keys.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `i18n Translation Context`** (1 nodes): `translation-context.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `German Translations`** (1 nodes): `de.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spanish Translations`** (1 nodes): `es.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `English Translations`** (1 nodes): `en.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ukrainian Translations`** (1 nodes): `uk.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chinese Translations`** (1 nodes): `zh.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `French Translations`** (1 nodes): `fr.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Russian Translations`** (1 nodes): `ru.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File List Item Model`** (1 nodes): `filesControllerListFiles200Item.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Upload Response`** (1 nodes): `filesControllerUploadFile201.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update Instance Settings DTO`** (1 nodes): `updateInstanceSettingsDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Upload Body`** (1 nodes): `filesControllerUploadFileBody.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Setup DTO`** (1 nodes): `adminSetupDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Dashboard DTO`** (1 nodes): `createDashboardDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Generate Extractor DTO`** (1 nodes): `generateExtractorDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Invite List Filter Params`** (1 nodes): `inviteControllerFindAllParams.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Accept Invite DTO`** (1 nodes): `acceptInviteDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login DTO`** (1 nodes): `loginDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Extractor Few Shot Item DTO`** (1 nodes): `createExtractorDtoFewShotExamplesItem.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Multi-File Upload Body`** (1 nodes): `filesControllerUploadMultipleFilesBody.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update Dashboard DTO`** (1 nodes): `updateDashboardDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Confirm Files Body`** (1 nodes): `filesControllerConfirmFilesBody.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Generate Schema DTO`** (1 nodes): `generateSchemaDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test SMTP DTO`** (1 nodes): `testSmtpDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update Extractor Few Shot DTO`** (1 nodes): `updateExtractorDtoFewShotExamplesItem.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Email Verification Body`** (1 nodes): `authControllerInitiateEmailVerificationBody.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sign Up Response`** (1 nodes): `authControllerSignUp201.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sign Up DTO`** (1 nodes): `signUpDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update Email DTO`** (1 nodes): `updateEmailDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Verify Email DTO`** (1 nodes): `verifyEmailDto.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Multi-File Upload Response`** (1 nodes): `filesControllerUploadMultipleFiles201Item.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chat Zod Schema`** (1 nodes): `chat.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Zod Schema`** (1 nodes): `auth.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workflows Zod Schema`** (1 nodes): `workflows.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Zod Schema`** (1 nodes): `dashboard.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Users Zod Schema`** (1 nodes): `users.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Instance Settings Zod Schema`** (1 nodes): `instance.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Files Zod Schema`** (1 nodes): `files.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Webhook Trigger Zod Schema`** (1 nodes): `webhook-trigger.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Invites Zod Schema`** (1 nodes): `invites.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Runs Zod Schema`** (1 nodes): `runs.zod.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `DocXtractor React Client (TanStack App)` and `TanStack Chat Application (Demo Feature)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `AuthService` connect `Auth Service Logic` to `Admin & Invite System`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `RunsGateway` connect `Runs HTTP Controller` to `Core Server & Workflow Nodes`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `RunsService` connect `Runs Orchestration Service` to `Core Server & Workflow Nodes`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `AppModule`, `DatabaseModule`, `InstanceSettingsModule` to the rest of the system?**
  _123 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Chat UI` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Core Server & Workflow Nodes` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._