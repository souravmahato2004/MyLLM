import { Router } from 'express';
import { registerUser, verifyEmail, signinUser, googleSignin, sendForgotPassword, resetPassword } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validate.js';
import { registerSchema, verifyEmailSchema, signinSchema } from '../schemas/authSchemas.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.get('/verify-email', validateRequest(verifyEmailSchema), verifyEmail);
router.post('/signin',validateRequest(signinSchema),signinUser);
router.post('/google-signin', googleSignin);
router.post('/forgot-password', sendForgotPassword);
router.post('/reset-password', resetPassword);

export default router;