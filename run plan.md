Run Entity & CRUD Implementation Plan
Goal
Implement the Run entity and its complete lifecycle to enable document extraction workflows. A Run is created when a user "runs" an extractor on selected documents/URLs, then automatically progresses through parsing → combining → extracting stages until completion (or failure). Users can monitor progress in real-time via WebSocket (Socket.IO), pause/resume/cancel runs, and review/download results.

System Architecture
⚠️ Failed to render Mermaid diagram: Parse error on line 21
flowchart TB
    subgraph Client["Client (React)"]
        UI[Runs UI]
        WS[Socket.IO Client]
    end
    
    subgraph Server["Core Backend (NestJS)"]
        API[Runs Controller]
        WS_GW[WebSocket Gateway]
        SVC[Runs Service]
        KAFKA_PROD[Kafka Producer]
        KAFKA_CONS[Kafka Consumer]
        DB[(PostgreSQL)]
    end
    
    subgraph Workers["Worker Services"]
        subgraph Parser["parser-service (Python)"]
            DOCLING[Docling Parser]
        end
        subgraph ChatExtractor["extraction-worker (NestJS)"]
            DOCLO[@doclo/flows]
        end
        subgraph LangExtractor["extraction-service (Python)"]
            LANGX[LangExtract]
        end
    end
    
    UI --> API
    WS <-.->|Real-time updates| WS_GW
    API --> SVC
    SVC --> DB
    SVC --> KAFKA_PROD
    SVC --> WS_GW
    
    KAFKA_PROD -->|documents.uploaded| Parser
    Parser -->|documents.parsed| KAFKA_CONS
    
    KAFKA_PROD -->|extraction.requests.chat| ChatExtractor
    ChatExtractor -->|extraction.completed| KAFKA_CONS
    
    KAFKA_PROD -->|extraction.requests.langextract| LangExtractor
    LangExtractor -->|extraction.completed| KAFKA_CONS
    
    KAFKA_CONS --> SVC
Kafka Topics
Topic	Producer	Consumer	Purpose
docxtractor.documents.uploaded	Server	parser-service	Trigger document parsing
docxtractor.documents.parsed	parser-service	Server	Parsed content ready
docxtractor.extraction.requests.chat	Server	extraction-worker (NestJS)	LLM extraction via @doclo/flows
docxtractor.extraction.requests.langextract	Server	extraction-service (Python)	LangExtract extraction
docxtractor.extraction.completed	Both extraction workers	Server	Extraction results
Kafka Error Handling & Retry
All Kafka consumers implement automatic retry with dead letter queue:

// Consumer configuration with retry
{
  retry: {
    initialRetryTime: 1000,      // 1 second initial delay
    retries: 3,                  // Max 3 retries per message
    multiplier: 2,               // Exponential backoff
    maxRetryTime: 30000,         // Max 30 seconds
  },
  deadLetterQueue: 'docxtractor.dlq'  // Failed messages go here
}
Processing Flow
User creates Run via RunExtractorModal
Server creates Run record with status PENDING
Client subscribes to WebSocket room run:{runId}
Server sends each source to documents.uploaded topic
Parser-service parses with Docling, sends result to documents.parsed
Server receives parsed content, updates source status, emits WebSocket event
When all parsed, Server combines content and sends to appropriate extraction topic:
extraction.requests.chat for LLM (default)
extraction.requests.langextract for LangExtract
Extraction worker extracts and sends to extraction.completed
Server receives results, updates Run to DONE or REVIEW, emits WebSocket event
Client receives real-time updates via WebSocket
Proposed Changes
Component 1: Server - Run Entity & Database
[MODIFY] 

run.entity.ts
Enums:

export enum RunStatus {
  PENDING = 'pending',      // Created, not yet processing
  QUEUED = 'queued',        // Sent to Kafka for parsing
  RUNNING = 'running',      // Worker(s) processing
  DONE = 'done',            // Successfully completed
  FAILED = 'failed',        // Extraction failed
  PAUSED = 'paused',        // User paused
  CANCELLED = 'cancelled',  // User cancelled
  REVIEW = 'review',        // Needs human review (low confidence)
}
export enum ProcessingMode {
  UNIFIED = 'unified',
  PER_DOCUMENT = 'per_document',
  HYBRID = 'hybrid',
}
export enum RunStep {
  PENDING = 'pending',      // Not started
  PARSING = 'parsing',      // Docling parsing documents
  COMBINING = 'combining',  // Merging parsed content
  EXTRACTING = 'extracting', // LLM extraction
  COMPLETE = 'complete',    // Finished
}
export enum ExtractionProvider {
  CHAT = 'chat',              // Default: @doclo/flows (NestJS worker)
  LANGEXTRACT = 'langextract', // LangExtract (Python worker)
}
Interfaces:

export interface RunSource {
  id: string;
  type: 'file' | 'url';
  name: string;
  url?: string;
  fileId?: string;
  status: 'pending' | 'parsing' | 'parsed' | 'failed';
  error?: string;
  parsedContent?: string;  // Markdown from Docling
  tokenCount?: number;
}
export interface RunProgress {
  parsed: number;
  total: number;
}
export interface RunLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;  // 'server', 'parser', 'extractor'
}
Entity Fields:

id (UUID, primary key)
extractorId (UUID, FK to Extractor)
userId (UUID, FK to User)
sources (JSONB array of RunSource)
processingMode (enum)
extractionProvider (enum, default: CHAT)
status (enum)
currentStep (enum)
progress (JSONB)
results (JSONB)
citations (JSONB)
logs (JSONB array)
error (text)
consensusEnabled (boolean)
citationEnabled (boolean)
startedAt, finishedAt (timestamps)
createdAt, updatedAt (auto)
Component 2: Server - DTOs
[MODIFY] 

create-run.dto.ts
export class CreateRunDto {
  @IsUUID()
  extractorId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunSourceDto)
  sources: RunSourceDto[];
  @IsOptional()
  @IsEnum(ProcessingMode)
  processingMode?: ProcessingMode;
  @IsOptional()
  @IsEnum(ExtractionProvider)
  extractionProvider?: ExtractionProvider;  // Default: CHAT
  @IsOptional()
  @IsBoolean()
  consensusEnabled?: boolean;
  @IsOptional()
  @IsBoolean()
  citationEnabled?: boolean;
}
Component 3: Server - Kafka Integration with Retry
[NEW] 

kafka.module.ts
Create a dedicated Kafka module with retry support:

@Module({
  providers: [KafkaService],
  exports: [KafkaService]
})
export class KafkaModule {}
[NEW] 

kafka.service.ts
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();
  
  // Topics
  static readonly DOCUMENTS_UPLOADED = 'docxtractor.documents.uploaded';
  static readonly DOCUMENTS_PARSED = 'docxtractor.documents.parsed';
  static readonly EXTRACTION_REQUESTS_CHAT = 'docxtractor.extraction.requests.chat';
  static readonly EXTRACTION_REQUESTS_LANGEXTRACT = 'docxtractor.extraction.requests.langextract';
  static readonly EXTRACTION_COMPLETED = 'docxtractor.extraction.completed';
  static readonly DLQ = 'docxtractor.dlq';  // Dead Letter Queue
  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: 'docxtractor-server',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 1000,
        retries: 5,
        maxRetryTime: 30000,
      }
    });
    
    this.producer = this.kafka.producer();
    await this.producer.connect();
  }
  async createConsumer(
    topic: string, 
    groupId: string, 
    handler: (message: any) => Promise<void>
  ): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value.toString());
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            await handler(data);
            break;  // Success, exit retry loop
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              // Send to DLQ
              await this.sendToDLQ(topic, data, error);
            } else {
              // Wait before retry (exponential backoff)
              await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            }
          }
        }
      }
    });
    
    this.consumers.set(topic, consumer);
    return consumer;
  }
  private async sendToDLQ(originalTopic: string, data: any, error: Error) {
    await this.producer.send({
      topic: KafkaService.DLQ,
      messages: [{
        value: JSON.stringify({
          originalTopic,
          data,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }]
    });
  }
  async sendDocumentForParsing(runId: string, source: RunSource): Promise<void>;
  async sendForExtraction(run: Run, combinedContent: string): Promise<void>;
}
Component 4: Server - WebSocket Gateway (Socket.IO)
[NEW] 

runs.gateway.ts
Robust WebSocket gateway using Socket.IO:

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/runs',
})
export class RunsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private connectedClients: Map<string, Set<string>> = new Map(); // runId -> socketIds
  afterInit(server: Server) {
    console.log('Runs WebSocket Gateway initialized');
  }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    // Clean up client from all rooms
    this.connectedClients.forEach((clients, runId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(runId);
      }
    });
  }
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, runId: string) {
    client.join(`run:${runId}`);
    
    if (!this.connectedClients.has(runId)) {
      this.connectedClients.set(runId, new Set());
    }
    this.connectedClients.get(runId).add(client.id);
    
    return { event: 'subscribed', data: { runId } };
  }
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, runId: string) {
    client.leave(`run:${runId}`);
    this.connectedClients.get(runId)?.delete(client.id);
    return { event: 'unsubscribed', data: { runId } };
  }
  // Called by RunsService when run is updated
  emitRunUpdate(runId: string, data: Partial<Run>) {
    this.server.to(`run:${runId}`).emit('run:update', data);
  }
  emitLogEntry(runId: string, log: RunLogEntry) {
    this.server.to(`run:${runId}`).emit('run:log', log);
  }
  emitSourceUpdate(runId: string, source: RunSource) {
    this.server.to(`run:${runId}`).emit('run:source', source);
  }
}
Dependencies to add:

pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
Component 5: Server - Kafka Consumers
[NEW] 

runs-kafka.controller.ts
Handle incoming Kafka messages with WebSocket broadcasts:

@Injectable()
export class RunsKafkaHandler implements OnModuleInit {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly runsService: RunsService,
    private readonly runsGateway: RunsGateway,
  ) {}
  async onModuleInit() {
    // Subscribe to parsed documents
    await this.kafkaService.createConsumer(
      KafkaService.DOCUMENTS_PARSED,
      'docxtractor-server-parsed',
      this.handleDocumentParsed.bind(this)
    );
    // Subscribe to extraction results
    await this.kafkaService.createConsumer(
      KafkaService.EXTRACTION_COMPLETED,
      'docxtractor-server-extraction',
      this.handleExtractionCompleted.bind(this)
    );
  }
  async handleDocumentParsed(data: {
    run_id: string;
    document_id: string;
    status: 'success' | 'failed';
    markdown_content?: string;
    token_count?: number;
    error?: string;
  }) {
    // Update source in Run
    const run = await this.runsService.updateSourceStatus(
      data.run_id,
      data.document_id,
      data.status === 'success' ? 'parsed' : 'failed',
      data.markdown_content,
      data.token_count,
      data.error
    );
    // Emit WebSocket update
    this.runsGateway.emitSourceUpdate(data.run_id, 
      run.sources.find(s => s.id === data.document_id)
    );
    // Check if all sources are parsed
    const allParsed = run.sources.every(s => s.status === 'parsed' || s.status === 'failed');
    if (allParsed) {
      await this.runsService.triggerExtraction(data.run_id);
    }
  }
  async handleExtractionCompleted(data: {
    run_id: string;
    status: 'success' | 'failed';
    data?: any;
    usage?: { total_tokens: number };
    error?: string;
    confidence?: number;
  }) {
    const run = await this.runsService.setResults(
      data.run_id,
      data.data,
      data.usage,
      data.error,
      data.confidence
    );
    // Emit final WebSocket update
    this.runsGateway.emitRunUpdate(data.run_id, run);
  }
}
Component 6: Server - Runs Controller
[MODIFY] 

runs.controller.ts
Full REST API endpoints:

@ApiTags('runs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('runs')
export class RunsController {
  @Post()
  @ApiOperation({ summary: 'Create and start a new extraction run' })
  create(@Body() createRunDto: CreateRunDto, @Request() req): Promise<Run>;
  @Get()
  @ApiOperation({ summary: 'List all runs for current user' })
  @ApiQuery({ name: 'status', required: false, enum: RunStatus })
  @ApiQuery({ name: 'extractorId', required: false })
  findAll(@Request() req, @Query() filters: RunFiltersDto): Promise<Run[]>;
  @Get(':id')
  @ApiOperation({ summary: 'Get run details' })
  findOne(@Param('id') id: string, @Request() req): Promise<Run>;
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a run' })
  remove(@Param('id') id: string, @Request() req): Promise<void>;
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a running extraction' })
  cancel(@Param('id') id: string, @Request() req): Promise<Run>;
  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a running extraction' })
  pause(@Param('id') id: string, @Request() req): Promise<Run>;
  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused extraction' })
  resume(@Param('id') id: string, @Request() req): Promise<Run>;
  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed extraction' })
  retry(@Param('id') id: string, @Request() req): Promise<Run>;
  @Get(':id/results')
  @ApiOperation({ summary: 'Download extraction results' })
  @ApiQuery({ name: 'format', enum: ['json', 'csv'], required: false })
  downloadResults(
    @Param('id') id: string, 
    @Query('format') format: 'json' | 'csv' = 'json',
    @Request() req,
    @Res() res: Response
  ): Promise<void>;
}
Component 7: NestJS Extraction Worker (Chat)
[NEW] workers/extraction-worker/ (NestJS Microservice)
Create a new NestJS microservice for LLM extraction using @doclo/flows:

Directory Structure:

workers/extraction-worker/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── extraction/
│   │   ├── extraction.module.ts
│   │   ├── extraction.consumer.ts  (Kafka handler)
│   │   ├── extraction.service.ts
│   │   └── doclo.service.ts
│   └── kafka/
│       └── kafka.module.ts
├── package.json
├── tsconfig.json
└── Dockerfile
extraction.consumer.ts:

@Injectable()
export class ExtractionConsumer implements OnModuleInit {
  async onModuleInit() {
    await this.kafkaService.createConsumer(
      'docxtractor.extraction.requests.chat',
      'extraction-worker-chat',
      this.handleExtractionRequest.bind(this)
    );
  }
  async handleExtractionRequest(data: {
    run_id: string;
    content: { combined_markdown: string };
    schema: object;
    consensus_enabled?: boolean;
    citation_enabled?: boolean;
    model_id?: string;
  }) {
    // Retry logic built into consumer
    const result = await this.extractionService.extract(
      data.content.combined_markdown,
      data.schema,
      {
        consensusEnabled: data.consensus_enabled,
        model: data.model_id || 'google/gemini-2.5-flash'
      }
    );
    await this.kafkaService.send('docxtractor.extraction.completed', {
      run_id: data.run_id,
      status: 'success',
      data: result.data,
      usage: result.usage,
      confidence: result.confidence
    });
  }
}
Component 8: Python LangExtract Service (Keep Implemented)
[MODIFY] 

consumer.py
Update topic to use 

langextract
 suffix:

TOPIC_REQUESTS = "docxtractor.extraction.requests.langextract"  # Updated
TOPIC_COMPLETED = "docxtractor.extraction.completed"
This service remains fully functional for users who select LangExtract provider.

Component 9: Client - Socket.IO Integration
[NEW] 

useRunSocket.ts
Robust Socket.IO hook with reconnection and caching:

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Run, RunSource, RunLogEntry } from '@/api/endpoints/runs/runs.types';
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Socket.IO client singleton with automatic reconnection
let socket: Socket | null = null;
function getSocket(): Socket {
  if (!socket) {
    socket = io(`${SOCKET_URL}/runs`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}
export function useRunSocket(
  runId: string,
  options: {
    enabled?: boolean;
    onUpdate?: (run: Partial<Run>) => void;
    onLog?: (log: RunLogEntry) => void;
    onSource?: (source: RunSource) => void;
  } = {}
) {
  const { enabled = true, onUpdate, onLog, onSource } = options;
  const [connected, setConnected] = useState(false);
  const subscribedRef = useRef(false);
  useEffect(() => {
    if (!enabled || !runId) return;
    const socket = getSocket();
    const handleConnect = () => {
      setConnected(true);
      if (!subscribedRef.current) {
        socket.emit('subscribe', runId);
        subscribedRef.current = true;
      }
    };
    const handleDisconnect = () => {
      setConnected(false);
      subscribedRef.current = false;
    };
    const handleUpdate = (data: Partial<Run>) => {
      onUpdate?.(data);
    };
    const handleLog = (log: RunLogEntry) => {
      onLog?.(log);
    };
    const handleSource = (source: RunSource) => {
      onSource?.(source);
    };
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('run:update', handleUpdate);
    socket.on('run:log', handleLog);
    socket.on('run:source', handleSource);
    // Subscribe if already connected
    if (socket.connected && !subscribedRef.current) {
      socket.emit('subscribe', runId);
      subscribedRef.current = true;
    }
    return () => {
      socket.emit('unsubscribe', runId);
      subscribedRef.current = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('run:update', handleUpdate);
      socket.off('run:log', handleLog);
      socket.off('run:source', handleSource);
    };
  }, [runId, enabled, onUpdate, onLog, onSource]);
  return { connected };
}
Dependencies to add:

pnpm add socket.io-client
Component 10: Client - Run Detail Page
[MODIFY] 

$id.tsx
Use WebSocket for real-time updates:

function RunDetailComponent() {
  const { id } = Route.useParams();
  
  // Initial fetch
  const { data: initialRun, refetch } = useRunsControllerFindOne(id);
  const [run, setRun] = useState<Run | null>(null);
  
  // Sync initial data
  useEffect(() => {
    if (initialRun) setRun(initialRun);
  }, [initialRun]);
  
  // Real-time updates via WebSocket
  const { connected } = useRunSocket(id, {
    enabled: run?.status === 'running' || run?.status === 'queued',
    onUpdate: (update) => {
      setRun(prev => prev ? { ...prev, ...update } : prev);
    },
    onSource: (source) => {
      setRun(prev => {
        if (!prev) return prev;
        const sources = prev.sources.map(s => 
          s.id === source.id ? source : s
        );
        return { ...prev, sources };
      });
    },
    onLog: (log) => {
      setRun(prev => {
        if (!prev) return prev;
        return { ...prev, logs: [...prev.logs, log] };
      });
    },
  });
  
  // ... rest of component with actual run data
}
Verification Plan
Browser Testing
Create and Run Flow:

Create extractor with schema
Click "Run" → add documents
Start extraction
Observe real-time updates in UI
WebSocket Connection:

Open browser DevTools → Network → WS
Verify socket connection to /runs namespace
Check subscribe and update events
Status Transitions:

Verify: PENDING → QUEUED → RUNNING → DONE
Test pause/resume/cancel buttons
Test retry on failed run
Results:

Verify results display when done
Test JSON download
Test CSV download
Implementation Order
Phase 1: Server Foundation (Day 1)
Run Entity with enums and interfaces
DTOs with validation
RunsModule with TypeORM
Database migration
Phase 2: Server Kafka + WebSocket (Days 2-3)
Install Socket.IO dependencies
Kafka module with retry logic
RunsGateway (WebSocket)
Kafka consumers with WebSocket broadcasts
RunsService with gateway integration
Phase 3: Extraction Workers (Days 4-5)
Create NestJS extraction-worker
Implement @doclo/flows integration
Update Python langextract topic
Docker configuration
Phase 4: Server API (Day 6)
RunsController with all endpoints
Results download (JSON/CSV)
Phase 5: Client Integration (Days 7-8)
Install socket.io-client
useRunSocket hook
Regenerate Orval API
RunExtractorModal → create mutation
Runs list page with real data
Run detail page with live updates