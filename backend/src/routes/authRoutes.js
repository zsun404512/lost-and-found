import express from 'express';

const router = express.Router();

// Import controller functions from controller
import { registerUser, loginUser } from '../controllers/authController.js';

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Log in a user and get a token
router.post('/login', loginUser);

export default router;