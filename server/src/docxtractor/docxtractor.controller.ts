import { Controller, Post, UploadedFile, UseInterceptors, Logger, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KafkaProducerService } from './kafka.producer';
import { StorageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('docxtractor')
export class DocxtractorController {
  private readonly logger = new Logger(DocxtractorController.name);

  constructor(
    private readonly kafkaService: KafkaProducerService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Body('job_id') jobId?: string) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const finalJobId = jobId || uuidv4();
    const documentId = uuidv4();
    const uniqueFileName = `${finalJobId}/${documentId}_${file.originalname}`;

    // 1. Upload to MinIO
    await this.storageService.uploadFile(uniqueFileName, file.buffer, file.mimetype);

    // 2. Send Event to Kafka
    const event = {
      job_id: finalJobId,
      document_id: documentId,
      file_key: uniqueFileName, // Parser uses this to download
      mime_type: file.mimetype,
      original_filename: file.originalname,
    };

    await this.kafkaService.sendMessage('docxtractor.documents.uploaded', event);

    return {
      success: true,
      job_id: finalJobId,
      document_id: documentId,
      message: 'Document uploaded and processing started',
    };
  }
}
