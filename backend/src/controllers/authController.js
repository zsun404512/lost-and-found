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

  try {
    // 3. Check if the user already exists in the database
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create the new user in the database
    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    // 6. Send a successful response
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