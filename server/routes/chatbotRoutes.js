import { Router } from 'express';
import { sendMessage } from '../controllers/chatbotController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatMessageSchema } from '../utils/schemas.js';

const router = Router();
router.post('/message', optionalAuth, validate(chatMessageSchema), sendMessage);

export default router;
