import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../models/database.ts';
import { logAudit } from '../services/auditService.ts';

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['student', 'staff']).default('student'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullName, email, role, dateOfBirth } = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const userId = uuidv4();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();

    // Generate a secure random access code (OTP style)
    const accessCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g., "A1B2C3D4"

    // Create user
    db.prepare('INSERT INTO users (id, fullName, email, role, dateOfBirth, is_verified, verification_token, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?)')
      .run(userId, fullName, email, role, dateOfBirth || null, verificationToken, createdAt);

    // Create credentials using the random access code
    const hashedCode = await bcrypt.hash(accessCode, 10);
    db.prepare('INSERT INTO access_credentials (user_id, hashed_code, is_active) VALUES (?, ?, 1)')
      .run(userId, hashedCode);

    // In a real app, send email here. 
    const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
    
    console.log('--- SECURE MAIL DELIVERY SIMULATION ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Your secure access credentials for SIS`);
    console.log(`Your randomized Access Code: ${accessCode}`);
    console.log(`Please verify your email to activate this code: ${verificationLink}`);
    console.log('----------------------------------------');

    logAudit({ userId, action: 'SIGNUP', resourceType: 'USER', details: { email, role }, req });

    res.status(201).json({ 
      message: 'Registration successful! Your secure access code and verification link have been sent to your email.',
      debugCode: process.env.NODE_ENV === 'development' ? accessCode : undefined,
      debugLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined 
    });

  } catch (error: any) {
    console.error('Signup Error [SEVERE]:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Registration Failure: ${message}` });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing verification token' });
  }

  try {
    const user = db.prepare('SELECT id FROM users WHERE verification_token = ?').get(token) as any;

    if (!user) {
      return res.status(404).json({ error: 'Invalid verification token' });
    }

    db.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?')
      .run(user.id);

    logAudit({ userId: user.id, action: 'VERIFY_EMAIL', resourceType: 'USER', req });

    res.json({ message: 'Email verified successfully. You can now log in.' });

  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
