import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import db from '../models/database.ts';
import { storageService } from '../services/storageService.ts';
import { logAudit } from '../services/auditService.ts';
import crypto from 'crypto';

export const uploadTranscript = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, semester, isPublished } = req.body;
    const file = req.file;
    const staffId = req.user?.userId;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!staffId) return res.status(401).json({ error: 'Unauthenticated' });

    // Verify student exists
    const student = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'").get(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const fileKey = await storageService.uploadFile(file);

    // 1. Transaction to ensure version consistency
    const transaction = db.transaction(() => {
      // Find current max version for this student and semester
      const latest = db.prepare('SELECT MAX(version) as v FROM transcripts WHERE student_id = ? AND semester = ?')
        .get(studentId, semester) as any;
      
      const version = (latest?.v || 0) + 1;
      const transcriptId = crypto.randomUUID();

      db.prepare(`
        INSERT INTO transcripts (id, student_id, staff_id, semester, file_key, version, is_published, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        transcriptId,
        studentId,
        staffId,
        semester,
        fileKey,
        version,
        isPublished === 'true' || isPublished === true ? 1 : 0,
        new Date().toISOString()
      );

      return { transcriptId, version };
    });

    const { transcriptId, version } = transaction();

    logAudit({
      userId: staffId,
      action: 'UPLOAD',
      resourceType: 'TRANSCRIPT',
      resourceId: transcriptId,
      details: { studentId, semester, version },
      req
    });

    res.status(201).json({ success: true, version });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

export const getAuditLogs = (req: AuthRequest, res: Response) => {
  const logs = db.prepare(`
    SELECT l.*, u.fullName as userName 
    FROM audit_logs l 
    LEFT JOIN users u ON l.user_id = u.id 
    ORDER BY l.created_at DESC 
    LIMIT 100
  `).all();
  res.json(logs);
};

export const exportAuditLogs = (req: AuthRequest, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT l.created_at, u.fullName as user_name, l.action, l.resource_type, l.ip_address, l.user_agent 
      FROM audit_logs l 
      LEFT JOIN users u ON l.user_id = u.id 
      ORDER BY l.created_at DESC
    `).all() as any[];

    const header = 'Timestamp,User,Action,Resource,IP Address,User Agent\n';
    const csv = logs.map(l => {
      return `${l.created_at},"${l.user_name || 'SYSTEM'}",${l.action},${l.resource_type},${l.ip_address},"${l.user_agent.replace(/"/g, '""')}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs_export.csv');
    res.send(header + csv);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
};

export const getAdminStats = (req: AuthRequest, res: Response) => {
  try {
    const stats = {
      users: db.prepare("SELECT role, COUNT(*) as count FROM users GROUP BY role").all(),
      transcripts: db.prepare("SELECT COUNT(*) as count FROM transcripts").get() as any,
      requests: db.prepare("SELECT status, COUNT(*) as count FROM transcript_requests GROUP BY status").all(),
      recentActivity: db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE created_at > datetime('now', '-24 hours')").get() as any
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getUsers = (req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, fullName, role, email, dateOfBirth, createdAt FROM users').all();
  res.json(users);
};

export const updateUser = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { fullName, email, role, dateOfBirth } = req.body;

  try {
    // 1. Ownership check (optional but good: an admin shouldn't be able to demote themselves unless there's another admin)
    // For now, let's just ensure email uniqueness if changed
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
    if (existing) {
      return res.status(400).json({ error: 'Email already in use by another identity' });
    }

    db.prepare(`
      UPDATE users 
      SET fullName = ?, email = ?, role = ?, dateOfBirth = ?
      WHERE id = ?
    `).run(fullName, email, role, dateOfBirth, id);
    
    logAudit({ 
      userId: req.user?.userId, 
      action: 'SYSTEM' as any, 
      resourceType: 'USER', 
      resourceId: id, 
      details: { 
        action: 'UPDATE_USER', 
        fieldsChanged: Object.keys(req.body) 
      }, 
      req 
    });
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const transcripts = db.prepare('SELECT file_key FROM transcripts WHERE student_id = ?').all(id) as any[];

    // 1. Delete associated physical files
    for (const t of transcripts) {
      await storageService.deleteFile(t.file_key);
    }

    // 2. Database purge in a transaction
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM transcripts WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM transcript_requests WHERE student_id = ? OR assigned_staff_id = ?').run(id, id);
      db.prepare('DELETE FROM access_credentials WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });

    transaction();
    
    logAudit({ 
      userId: req.user?.userId, 
      action: 'DELETE' as any, 
      resourceType: 'USER', 
      resourceId: id, 
      details: { action: 'PURGE_ACCOUNT' }, 
      req 
    });
    
    res.json({ message: 'User and associated records purged successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
