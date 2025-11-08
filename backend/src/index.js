import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// --- Our new imports ---
import authRoutes from './routes/authRoutes.js';
import Item from './models/itemModel.js'; // 1. IMPORT our new Item model
import { protect } from './middleware/authMiddleware.js'; // 2. IMPORT our middleware

const require = createRequire(import.meta.url);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

// --- API Routes ---
app.use('/api/auth', authRoutes);

// 3. DELETE the old itemSchema and Item model. It's gone from here.

// Try to connect to MongoDB...
// ... (all the MongoDB connection logic stays exactly the same) ...
const mongoUri = process.env.MONGODB_URI;
// ... (etc) ...

// In-memory fallback...
// ... (this logic also stays the same) ...

app.get('/api/ping', (req, res) => {
  // ... (this route stays the same) ...
});

app.get('/api', (req, res) => {
  // ... (this route stays the same) ...
});

// GET /api/items (This route is still public, anyone can see items)
app.get('/api/items', async (req, res) => {
  console.log('[GET] /api/items');
  if (useDb && mongoose.connection.readyState === 1) {
    try {
      // Find items and sort by newest
      const docs = await Item.find().sort({ createdAt: -1 }).lean();
      return res.json(docs);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  return res.json(inMemoryItems);
});

// 4. UPDATE the "create post" route
//    We've added 'protect' as the second argument.
//    This route is now PROTECTED.
app.post('/api/items', protect, async (req, res) => {
  const payload = req.body;
  console.log('[POST] /api/items - payload:', payload);
  if (!payload || !payload.title) return res.status(400).json({ error: 'Missing item title' });

  if (useDb && mongoose.connection.readyState === 1) {
    try {
      // 5. UPDATE the create logic to include the user
      const doc = await Item.create({
        ...payload,
        user: req.user.userId // Get the user ID from our 'protect' middleware
      });
      
      console.log('Created item in DB:', doc._id, 'by user:', req.user.email);
      return res.status(201).json(doc);
    } catch (e) {
      console.error('DB create error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // ... (In-memory fallback logic can stay, but it won't have a user)
  payload.id = inMemoryItems.length ? Math.max(...inMemoryItems.map(i => i.id || 0)) + 1 : 1;
  inMemoryItems.unshift(payload);
  console.log('Stored item in-memory (unprotected):', payload.id);
  return res.status(201).json(payload);
});

// get single item...
// ... (this route stays the same) ...

// Serve static files...
// ... (this route stays the same) ...

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});