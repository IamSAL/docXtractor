import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET') || 'docxtractor-documents';

    this.s3Client = new S3Client({
      region: 'us-east-1', // MinIO ignores this but SDK needs it
      endpoint:
        this.configService.get<string>('MINIO_ENDPOINT') || 'http://minio:9000',
      forcePathStyle: true, // Required for MinIO
      credentials: {
        accessKeyId:
          this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
        secretAccessKey:
          this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
      },
    });
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      this.logger.log(`Uploaded file ${key} to bucket ${this.bucketName}`);

      // Return the file key or simple S3 URI
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}`, error);
      throw error;
    }
  }
}
