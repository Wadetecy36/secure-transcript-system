import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../models/database.ts';
import crypto from 'crypto';

import { logAudit } from '../services/auditService.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

const loginSchema = z.object({
  accessCode: z.string().min(4),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  email: z.string().email().optional(),
}).refine(data => data.dob || data.email, {
  message: "Either DOB or Email must be provided"
});

export const verifyAccess = async (req: Request, res: Response) => {
  try {
    const { accessCode, dob, email } = loginSchema.parse(req.body);
    
    let user: any = null;
    if (dob) {
      user = db.prepare("SELECT id, fullName, role, is_verified FROM users WHERE dateOfBirth = ? AND role = 'student'").get(dob);
    } else if (email) {
      user = db.prepare("SELECT id, fullName, role, is_verified FROM users WHERE email = ? AND role IN ('staff', 'admin')").get(email);
    }

    if (!user) {
      logAudit({ action: 'LOGIN', resourceType: 'AUTH', details: { error: 'User not found', dob, email }, req });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ error: 'Please verify your email before logging in.' });
    }

    const creds = db.prepare('SELECT * FROM access_credentials WHERE user_id = ?').get(user.id) as any;

    if (!creds || !creds.is_active) {
      logAudit({ userId: user.id, action: 'LOGIN', resourceType: 'AUTH', details: { error: 'Account inactive' }, req });
      return res.status(401).json({ error: 'Access denied' });
    }

    if (creds.locked_until && new Date(creds.locked_until) > new Date()) {
      return res.status(403).json({ error: 'Account temporarily locked' });
    }

    const isValid = await bcrypt.compare(accessCode, creds.hashed_code);

    if (!isValid) {
      const newAttempts = (creds.failed_attempts || 0) + 1;
      let lockedUntil = null;
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }
      
      db.prepare('UPDATE access_credentials SET failed_attempts = ?, locked_until = ? WHERE user_id = ?')
        .run(newAttempts, lockedUntil, user.id);

      logAudit({ userId: user.id, action: 'LOGIN', resourceType: 'AUTH', details: { error: 'Password mismatch' }, req });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    db.prepare('UPDATE access_credentials SET failed_attempts = 0, locked_until = NULL WHERE user_id = ?')
      .run(user.id);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    logAudit({ userId: user.id, action: 'LOGIN', resourceType: 'AUTH', req });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Auth Error [SEVERE]:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : 'No stack trace';
    res.status(500).json({ 
      error: `Auth Controller Failure: ${message}`,
      details: process.env.NODE_ENV === 'development' ? stack : undefined
    });
  }
};

