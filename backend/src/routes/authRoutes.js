import express from 'express';

const router = express.Router();

// We'll create these controller functions in the next step
// For now, we'll just import them.
import { registerUser } from '../controllers/authController.js';

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Log in a user and get a token
// router.post('/login', loginUser);


// --- TEMPORARY TEST ROUTES ---
// Let's add simple test routes so we know the file is working

// router.post('/register', (req, res) => {
//   res.json({ message: 'Register route hit!' });
// });

router.post('/login', (req, res) => {
  res.json({ message: 'Login route hit!' });
});

export default router;