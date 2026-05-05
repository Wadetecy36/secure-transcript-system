import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

router.get('/download/:fileKey', (req: Request, res: Response) => {
  const { fileKey } = req.params;
  const { expires, signature } = req.query;

  if (!expires || !signature) {
    return res.status(403).json({ error: 'Missing signature parameters' });
  }

  // 1. Verify expiry
  if (Math.floor(Date.now() / 1000) > parseInt(expires as string)) {
    return res.status(403).json({ error: 'Signed URL has expired' });
  }

  // 2. Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${fileKey}:${expires}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // 3. Serve file
  const safeFileKey = path.basename(fileKey);
  const filePath = path.resolve(process.cwd(), 'uploads', safeFileKey);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { download } = req.query;
  const originalName = safeFileKey.split('-').slice(1).join('-');

  if (download === 'true') {
    res.download(filePath, originalName);
  } else {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
    res.sendFile(filePath);
  }
});

export default router;
