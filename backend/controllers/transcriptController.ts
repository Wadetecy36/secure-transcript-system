import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import db from '../models/database.ts';
import { storageService } from '../services/storageService.ts';
import { logAudit } from '../services/auditService.ts';
import { v4 as uuidv4 } from 'uuid';

export const getTranscripts = (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  
  let transcripts: any[];
  if (role === 'student') {
    transcripts = db.prepare(`
      SELECT id, semester, version, created_at 
      FROM transcripts 
      WHERE student_id = ? AND is_published = 1
      ORDER BY semester DESC, version DESC
    `).all(userId);
  } else {
    // Staff and Admin can see all for management
    transcripts = db.prepare(`
      SELECT t.*, u.fullName as studentName 
      FROM transcripts t 
      JOIN users u ON t.student_id = u.id
      ORDER BY t.created_at DESC
    `).all();
  }

  res.json(transcripts);
};

export const getSignedUrl = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const role = req.user?.role;

  const transcript = db.prepare('SELECT * FROM transcripts WHERE id = ?').get(id) as any;

  if (!transcript) return res.status(404).json({ error: 'Transcript not found' });
  
  // Verify ownership or staff access
  if (role === 'student' && transcript.student_id !== userId) {
    logAudit({ userId, action: 'VIEW', resourceType: 'TRANSCRIPT', resourceId: id, details: { error: 'Unauthorized' }, req });
    return res.status(403).json({ error: 'Unauthorized access' });
  }

  try {
    const url = await storageService.getSignedUrl(transcript.file_key, 60);
    
    logAudit({ 
      userId, 
      action: req.query.download === 'true' ? 'DOWNLOAD' : 'VIEW', 
      resourceType: 'TRANSCRIPT', 
      resourceId: id, 
      req 
    });

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to access document' });
  }
};

export const requestTranscript = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { reason } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const requestId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO transcript_requests (id, student_id, reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(requestId, userId, reason || 'Official Transcript Request', now, now);

    logAudit({ userId, action: 'UPLOAD', resourceType: 'SYSTEM', resourceId: requestId, details: { action: 'REQUEST_TRANSCRIPT' }, req });

    res.status(201).json({ message: 'Transcript request submitted successfully', requestId });
  } catch (error) {
    console.error('Request Transcript Error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

export const getTranscriptRequests = (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let requests;
  if (role === 'student') {
    requests = db.prepare(`
      SELECT * FROM transcript_requests 
      WHERE student_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
  } else {
    // Staff/Admin see all pending or fulfilled
    requests = db.prepare(`
      SELECT tr.*, u.fullName as studentName 
      FROM transcript_requests tr
      JOIN users u ON tr.student_id = u.id
      ORDER BY tr.created_at DESC
    `).all();
  }

  res.json(requests);
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const staffId = req.user?.userId;
  const role = req.user?.role;

  if (role === 'student') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE transcript_requests 
      SET status = ?, assigned_staff_id = ?, updated_at = ?
      WHERE id = ?
    `).run(status, staffId, now, id);

    logAudit({ userId: staffId, action: 'UPLOAD', resourceType: 'SYSTEM', resourceId: id, details: { newStatus: status }, req });

    res.json({ message: 'Request status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request' });
  }
};

export const getStudents = (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  if (role === 'student') return res.status(403).json({ error: 'Unauthorized' });

  try {
    const students = db.prepare(`
      SELECT id, fullName, email, dateOfBirth, createdAt 
      FROM users 
      WHERE role = 'student'
      ORDER BY fullName ASC
    `).all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student directory' });
  }
};
