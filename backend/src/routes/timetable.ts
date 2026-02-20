import { Router } from 'express';
import * as timetableController from '../controllers/timetableController';
import { protect } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/', timetableController.getTimetable);
router.get('/upcoming', timetableController.getUpcomingClasses);
router.post('/upload', upload.single('file'), timetableController.uploadTimetable);
router.post('/entries', timetableController.addTimetableEntry);

export default router;
