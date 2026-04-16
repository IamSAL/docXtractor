import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  BadRequestException,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { GetUser } from '../auth/decorators/get-user.decorator';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/tiff',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
]);

const multerOptions = {
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: (err: Error | null, accept: boolean) => void,
  ) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Unsupported file type: ${file.mimetype}. Allowed types: PDF, images (PNG/JPEG/WEBP/TIFF), plain text, CSV, Word and Excel documents.`,
        ),
        false,
      );
    }
  },
};

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiOperation({
    summary: 'Upload a single file',
    description:
      'Upload a file with user-scoped security. Files are encrypted at rest (SSE-S3) and isolated per user. Returns file ID, URL, and storage key for referencing in other CRUD operations.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'userId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        userId: {
          type: 'string',
          description:
            'User ID (will be extracted from JWT token in production)',
          example: 'user-123',
        },
        metadata: {
          type: 'string',
          description: 'Optional JSON metadata (e.g., {"runId": "run-456"})',
          example: '{"runId": "run-456", "documentType": "invoice"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique file ID',
          example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
        url: {
          type: 'string',
          description: 'Direct URL to access the file',
          example:
            'http://minio:9000/docxtractor-documents/user-123/1706345678_abc123_invoice.pdf',
        },
        storageKey: {
          type: 'string',
          description: 'S3 storage key for the file',
          example: 'user-123/1706345678_abc123_invoice.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or missing userId',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser('sub') userId: string,
    @Body('metadata') metadataStr?: string,
  ) {
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};
    return this.filesService.uploadFile(userId, file, metadata);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions)) // Max 10 files, 50 MB each
  @ApiOperation({
    summary: 'Upload multiple files at once',
    description:
      'Upload up to 10 files in a single request. All files are user-scoped and encrypted at rest. Returns an array of file references.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'userId'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of files to upload (max 10)',
        },
        userId: {
          type: 'string',
          description:
            'User ID (will be extracted from JWT token in production)',
          example: 'user-123',
        },
        metadata: {
          type: 'string',
          description: 'Optional JSON metadata applied to all files',
          example: '{"batchId": "batch-789"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          },
          url: {
            type: 'string',
            example:
              'http://minio:9000/docxtractor-documents/user-123/1706345678_abc123_file1.pdf',
          },
          storageKey: {
            type: 'string',
            example: 'user-123/1706345678_abc123_file1.pdf',
          },
          originalName: { type: 'string', example: 'invoice.pdf' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid files or missing userId',
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('sub') userId: string,
    @Body('metadata') metadataStr?: string,
  ) {
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};
    return this.filesService.uploadMultipleFiles(userId, files, metadata);
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm files (mark as completed)',
    description: 'Mark a list of files as completed/committed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fileIds', 'userId'],
      properties: {
        fileIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        },
        userId: { type: 'string', example: 'user-123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files confirmed successfully' })
  async confirmFiles(
    @Body('fileIds') fileIds: string[],
    @GetUser('sub') userId: string,
  ) {
    return this.filesService.completeFiles(userId, fileIds);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get file metadata by ID',
    description:
      'Retrieve file metadata for a specific file. User-scoped - users can only access their own files.',
  })
  @ApiParam({
    name: 'id',
    description: 'File ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'File metadata retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        originalName: { type: 'string', example: 'invoice.pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 1024000 },
        storageKey: { type: 'string' },
        bucket: { type: 'string', example: 'docxtractor-documents' },
        status: { type: 'string', example: 'uploaded' },
        userId: { type: 'string' },
        metadata: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found or access denied' })
  async getFile(@Param('id') fileId: string, @GetUser('sub') userId: string) {
    return this.filesService.getFile(userId, fileId);
  }

  @Get()
  @ApiOperation({
    summary: 'List all files for a user',
    description:
      'Retrieve all files uploaded by the authenticated user, ordered by creation date (newest first).',
  })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          originalName: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'number' },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async listFiles(@GetUser('sub') userId: string) {
    return this.filesService.listFiles(userId);
  }
}
