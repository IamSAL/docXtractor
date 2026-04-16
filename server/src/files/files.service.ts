import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { File } from './entities/file.entity';
import { FileStatus } from './enums/file-status.enum';
import { StorageService } from './storage.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly minioPublicUrl: string;
  private readonly bucketName: string;

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.minioPublicUrl =
      this.configService.get<string>('MINIO_PUBLIC_URL') ||
      this.configService.get<string>('MINIO_ENDPOINT') ||
      'http://localhost:9000';
    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET') || 'docxtractor-documents';
  }

  /**
   * Upload file with user-scoped security
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    metadata?: Record<string, any>,
  ): Promise<{ id: string; url: string; storageKey: string }> {
    // Generate user-scoped storage key
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${userId}/${timestamp}_${uuid}_${sanitized}`;

    // Upload to S3 with encryption
    await this.storageService.uploadFile(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    // Save file record
    const fileRecord = await this.fileRepository.save({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      bucket: 'docxtractor-documents',
      status: FileStatus.PENDING, // Start as PENDING
      userId, // User-scoped
      metadata: metadata || {},
    });

    this.logger.log(
      `File uploaded (pending): ${fileRecord.id} by user ${userId}`,
    );

    // Return file reference
    // Note: In a real app, the URL might be a signed URL or a proxy URL
    return {
      id: fileRecord.id,
      url: `${this.minioPublicUrl}/${this.bucketName}/${storageKey}`,
      storageKey,
    };
  }

  /**
   * Mark files as completed (committed)
   */
  async completeFiles(userId: string, fileIds: string[]): Promise<void> {
    if (!fileIds || fileIds.length === 0) return;

    await this.fileRepository.update(
      { id: In(fileIds), userId },
      { status: FileStatus.COMPLETED },
    );

    this.logger.log(
      `Files completed: ${fileIds.join(', ')} for user ${userId}`,
    );
  }

  /**
   * Upload multiple files at once
   */
  async uploadMultipleFiles(
    userId: string,
    files: Express.Multer.File[],
    metadata?: Record<string, any>,
  ): Promise<
    Array<{ id: string; url: string; storageKey: string; originalName: string }>
  > {
    const uploadPromises = files.map((file) =>
      this.uploadFile(userId, file, metadata),
    );
    const results = await Promise.all(uploadPromises);

    // Add original names to results
    return results.map((result, index) => ({
      ...result,
      originalName: files[index].originalname,
    }));
  }

  /**
   * Get file by ID (user-scoped)
   */
  async getFile(userId: string, fileId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId }, // User isolation
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /**
   * List user's files
   */
  async listFiles(userId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Compute the public URL for a file given its storage key.
   */
  getPublicFileUrl(fileKey: string): string {
    return `${this.minioPublicUrl}/${this.bucketName}/${fileKey}`;
  }
}
