import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface StorageService {
  getSignedUrl(fileKey: string, expirySeconds: number): Promise<string>;
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
}

class LocalStorageService implements StorageService {
  private uploadDir = path.resolve(process.cwd(), 'uploads');
  private baseUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async getSignedUrl(fileKey: string, expirySeconds: number): Promise<string> {
    // For local storage, we generate a short-lived token that the backend can verify
    // This token is appended to a special internal route
    const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${fileKey}:${expiresAt}`)
      .digest('hex');

    return `${this.baseUrl}/api/files/download/${fileKey}?expires=${expiresAt}&signature=${signature}`;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileKey = `${crypto.randomUUID()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileKey);
    
    fs.writeFileSync(filePath, file.buffer);
    return fileKey;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// In a real app, you would have an S3StorageService here
export const storageService = new LocalStorageService();
