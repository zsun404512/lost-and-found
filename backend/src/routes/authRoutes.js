import express from 'express';

const router = express.Router();

import { registerUser, loginUser } from '../controllers/authController.js';

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

export default router;