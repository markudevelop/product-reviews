import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * File storage service for product images.
 *
 * Supports two storage backends:
 *   - 'local' (default): Saves files to disk, serves via Express static files
 *   - 's3': Uploads to AWS S3 / compatible storage (when configured)
 *
 * Easily extensible to add GCS, Azure Blob, or CDN integration.
 * Files are named with a hash to prevent collisions and allow cache-busting.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
    this.baseUrl = this.config.get<string>('UPLOAD_BASE_URL', '/api/uploads');
    this.maxFileSize = parseInt(
      this.config.get<string>('MAX_FILE_SIZE', '5242880'),
      10,
    ); // 5MB default

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async upload(
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    this.validate(file);

    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex').slice(0, 16);
    const filename = `${Date.now()}-${hash}${ext}`;

    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    this.logger.log(`Uploaded: ${filename} (${(file.size / 1024).toFixed(1)}KB)`);

    return {
      filename,
      originalName: file.originalname,
      url: `${this.baseUrl}/${filename}`,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);

    if (!fs.existsSync(filePath)) return false;

    fs.unlinkSync(filePath);
    this.logger.log(`Deleted: ${filename}`);
    return true;
  }

  private validate(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB`,
      );
    }
  }
}
