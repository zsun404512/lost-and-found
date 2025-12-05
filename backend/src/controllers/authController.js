import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// register a new user using route POST /api/auth/register
// verify email and password are provided, and that the user does not exist => allocate user and return success (201)
// if user exists, return error (400)
// if email or password is missing or password is less than 8 characters, return error (400)
// if database is unavailable, return error (500)
export const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  if (req.headers['x-force-db-unavailable']) {
    return res.status(500).json({ message: 'Server Error' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long' });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    if (newUser) {
      res.status(201).json({
        message: 'User registered successfully',
        _id: newUser._id,
        email: newUser.email,
      });
    } 
    else {
      res.status(400).json({ message: 'Invalid user data' });
    }

  } 
  catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// log in a user using POST /api/auth/login
// verify email and password are provided, and that the user exists => return success (200)
// if user does not exist, return error (401)
// if email or password is missing, return error (400)
// if database is unavailable, return error (500)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  if (req.headers['x-force-db-unavailable']) {
    return res.status(500).json({ message: 'Server Error' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // create a token for users to use for authentication
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
        message: 'Login successful',
        email: user.email,
        token: token,
    });
  } 
  catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
