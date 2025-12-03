import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// middleware to protect routes
const protect = (req, res, next) => {
  let token;

  // try to obtain the token and verify token is real
  // catch errors for token verification errors
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } 
    catch (error) {
      console.error('Token verification failed', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };