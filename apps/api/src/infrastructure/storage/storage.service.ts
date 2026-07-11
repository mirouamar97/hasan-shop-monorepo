import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { FileValidationService } from '../security/file-validation.service';

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private bucket = '';
  private publicUrl = '';
  private enabled = false;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(FileValidationService) private readonly fileValidation: FileValidationService,
  ) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKey = this.config.get<string>('S3_ACCESS_KEY');
    const secretKey = this.config.get<string>('S3_SECRET_KEY');
    this.bucket = this.config.get<string>('S3_BUCKET', 'hasan-shop');
    this.publicUrl = this.config.get<string>('S3_PUBLIC_URL', '');

    if (endpoint && accessKey && secretKey) {
      this.client = new S3Client({
        endpoint,
        region: this.config.get<string>('S3_REGION', 'auto'),
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        forcePathStyle: true,
      });
      this.enabled = true;
      void this.ensureBucket();
    } else {
      this.logger.warn('S3 credentials not configured — file uploads disabled');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  private async ensureBucket() {
    if (!this.client) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created S3 bucket: ${this.bucket}`);
      } catch (error) {
        this.logger.warn(`Could not create bucket: ${error}`);
      }
    }
  }

  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder = 'products',
    expiresIn = 3600,
    sizeBytes = 0,
  ): Promise<PresignedUploadResult> {
    if (!this.client) {
      throw new Error('Storage service is not configured');
    }
    this.fileValidation.validateUpload(filename, contentType, sizeBytes);

    const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const key = `${folder}/${uuid()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const publicUrl = this.publicUrl
      ? `${this.publicUrl.replace(/\/$/, '')}/${key}`
      : uploadUrl.split('?')[0]!;

    return { uploadUrl, publicUrl, key, expiresIn };
  }

  async deleteObject(key: string) {
    if (!this.client) return;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
