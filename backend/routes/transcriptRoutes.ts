import { Router } from 'express';
import { getTranscripts, getSignedUrl, requestTranscript, getTranscriptRequests, updateRequestStatus, getStudents } from '../controllers/transcriptController.ts';
import { authenticateToken, requireStaff } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/', authenticateToken, getTranscripts);
router.post('/request', authenticateToken, requestTranscript);
router.get('/requests', authenticateToken, getTranscriptRequests);
router.get('/students', authenticateToken, requireStaff, getStudents);
router.patch('/requests/:id', authenticateToken, requireStaff, updateRequestStatus);
router.get('/:id/url', authenticateToken, getSignedUrl);

export default router;
