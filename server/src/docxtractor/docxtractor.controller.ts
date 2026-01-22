import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Logger,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { KafkaProducerService } from './kafka.producer';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';
import { Public } from '../auth/decorators/public.decorators';

@ApiTags('Docxtractor')
@Controller('docxtractor')
export class DocxtractorController {
  private readonly logger = new Logger(DocxtractorController.name);

  constructor(
    private readonly kafkaService: KafkaProducerService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @Public()
  @ApiOperation({ summary: 'Upload a document for processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        job_id: {
          type: 'string',
          format: 'uuid',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'The file has been successfully uploaded and processing started.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        job_id: { type: 'string' },
        document_id: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('job_id') jobId?: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const finalJobId = jobId || uuidv4();
    const documentId = uuidv4();
    const uniqueFileName = `${finalJobId}/${documentId}_${file.originalname}`;

    // 1. Upload to MinIO
    await this.storageService.uploadFile(
      uniqueFileName,
      file.buffer,
      file.mimetype,
    );

    // 2. Send Event to Kafka
    const event = {
      job_id: finalJobId,
      document_id: documentId,
      file_key: uniqueFileName, // Parser uses this to download
      mime_type: file.mimetype,
      original_filename: file.originalname,
    };

    await this.kafkaService.sendMessage(
      'docxtractor.documents.uploaded',
      event,
    );

    return {
      success: true,
      job_id: finalJobId,
      document_id: documentId,
      message: 'Document uploaded and processing started',
    };
  }
}
