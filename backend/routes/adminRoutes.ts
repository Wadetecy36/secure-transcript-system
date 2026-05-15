import { Router } from 'express';
import multer from 'multer';
import { uploadTranscript, getAuditLogs, exportAuditLogs, getAdminStats, getUsers, updateUser, deleteUser, approveUser } from '../controllers/adminController.ts';
import { authenticateToken, requireStaff, requireAdmin } from '../middleware/authMiddleware.ts';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Staff & Admin can upload
router.post('/upload', authenticateToken, requireStaff, upload.single('transcript'), uploadTranscript);

// Only Admin can view logs and users
router.get('/audit-logs', authenticateToken, requireAdmin, getAuditLogs);
router.get('/audit-logs/export', authenticateToken, requireAdmin, exportAuditLogs);
router.get('/stats', authenticateToken, requireAdmin, getAdminStats);
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.patch('/users/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);
router.post('/users/:id/approve', authenticateToken, requireAdmin, approveUser);
export default router;
