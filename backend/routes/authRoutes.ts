import { Router } from 'express';
import { verifyAccess } from '../controllers/authController.ts';
import { signup, verifyEmail } from '../controllers/registrationController.ts';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

router.post('/verify', authRateLimiter, verifyAccess);
router.post('/signup', authRateLimiter, signup);
router.get('/verify-email', verifyEmail);

export default router;
