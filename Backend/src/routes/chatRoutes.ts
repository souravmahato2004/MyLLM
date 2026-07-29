import { Router } from 'express';
import { sendChatMessage, streamChatMessage } from '../controllers/chatController.js';
import { validateRequest } from '../middlewares/validate.js';
import { chatSchema } from '../schemas/chatSchemas.js';

const router = Router();

router.post('/', validateRequest(chatSchema), sendChatMessage);
router.post('/stream', validateRequest(chatSchema), streamChatMessage);

export default router;
