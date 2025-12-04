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

// prompt for initial commit
/*
* suppose you are an expert backend developer guiding a junior developer
* I need a way to protect my api routes
* I want to make sure that only authenticated users can access them
* however, I'm not sure how to do this
* please take a look at @index.js and @authController.js for the current implementation
* can you help guide me to do this? don't write actual code, just guide me step by step
* as I'd like to learn and type the code myself
* include detailed comments as well so I can understand what's going on
* I will refactor the code after you guide me through the process
*/