import db from '../models/database.ts';
import crypto from 'crypto';

export type AuditAction = 'LOGIN' | 'UPLOAD' | 'VIEW' | 'DOWNLOAD' | 'DELETE' | 'LOGOUT' | 'SIGNUP' | 'VERIFY_EMAIL';
export type ResourceType = 'TRANSCRIPT' | 'USER' | 'AUTH' | 'SYSTEM';

interface AuditParams {
  userId?: string | null;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: any;
  req?: any;
}

export function logAudit({ userId, action, resourceType, resourceId, details, req }: AuditParams) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const ipAddress = req?.ip || '0.0.0.0';
  const userAgent = req?.get('User-Agent') || 'Unknown';
  const detailsStr = details ? JSON.stringify(details) : null;

  try {
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId || null, action, resourceType, resourceId || null, detailsStr, ipAddress, userAgent, createdAt);
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
