import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private readonly logger = new Logger(UploadService.name);

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.AWS_ENDPOINT,
      forcePathStyle: process.env.AWS_USE_PATH_STYLE_ENDPOINT === 'true',
    });
  }

  async uploadImage(file: Express.Multer.File, entity: string, tenantId: string): Promise<string> {
    const bucket = process.env.AWS_BUCKET;
    if (!bucket) {
      throw new InternalServerErrorException('AWS_BUCKET not configured');
    }

    const timestamp = Date.now();
    const extension = extname(file.originalname);
    const key = `TicketRush/${entity === 'tenant' ? 'Tenants' : 'Events'}/${tenantId}_${timestamp}${extension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const baseUrl = process.env.AWS_URL || `https://${bucket}.${process.env.AWS_ENDPOINT?.replace('https://', '') || 's3.amazonaws.com'}`;
      return `${baseUrl}/${key}`;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error uploading image to cloud storage');
    }
  }
}
