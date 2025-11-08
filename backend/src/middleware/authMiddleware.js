import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Make sure it can read the JWT_SECRET

const protect = (req, res, next) => {
  let token;

  // 1. Check if the 'Authorization' header exists and has the token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Get the token from the header (e.g., "Bearer [token]")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token is real using our secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach the user's info to the request object
      // We'll use this in our "create post" controller
      req.user = decoded; // This contains { userId, email }

      // 5. Call 'next()' to pass the request to the next function
      next();

    } catch (error) {
      console.error('Token verification failed', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };