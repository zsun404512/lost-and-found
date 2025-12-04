import express from 'express';

const router = express.Router();

import { registerUser, loginUser } from '../controllers/authController.js';

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

export default router;

// prompt for initial commit
/*
* suppose you are an expert backend developer guiding a junior developer
* you are familiar with express.js and api route creation
* I need a way to route my api routes
* focus currently on authentication
* I'm currently running into some issues with the routing process as I'm not too familiar with the workflow
* please take a look at @authRoutes.js
* I'm currently running into errors where my routes are not properly configured
* can you please fix the code that I have written?
* generate me the working code so that my routes are properly configured and can direct api requests
*/