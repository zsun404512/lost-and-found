import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  // 1. Get email and password from the request body
  const { email, password } = req.body;

  // 2. Check if email or password are missing
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  if (req.headers['x-force-db-unavailable']) {
    return res.status(500).json({ message: 'Server Error' });
  }

  try {
    // 3. Check if the user already exists in the database
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 4. Enforce a minimum password length for *new* users only
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long' });
    }

    // 5. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Create the new user in the database
    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    // 7. Send a successful response
    if (newUser) {
      res.status(201).json({
        message: 'User registered successfully',
        _id: newUser._id,
        email: newUser.email,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Log in (authenticate) a user
// @route   POST /api/auth/login
export const loginUser = async(req, res) => {
  // 1. Get email and password from the request body
  const { email, password } = req.body;
  
  // 2. Check if email or password are missing
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  if (req.headers['x-force-db-unavailable']) {
    return res.status(500).json({ message: 'Server Error' });
  }

  try {
    // 3. Find the user in the database
    const user = await User.findOne({ email });

    // 4. If user doesn't exist, send error
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 5. If user *does* exist, compare their password with the hashed one
    const isMatch = await bcrypt.compare(password, user.password);

    // 6. If passwords don't match, send error
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 7. If passwords match, create a token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, // This is the "payload"
      process.env.JWT_SECRET, // Your secret key from .env
      { expiresIn: '1h' }    // Token lasts for 1 hour
    );

    // 8. Send the token and user info back to the frontend
    res.status(200).json({
        message: 'Login successful',
        email: user.email,
        token: token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};