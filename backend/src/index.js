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
import Item from './models/itemModel.js';
import { protect } from './middleware/authMiddleware.js';

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


// Try to connect to MongoDB...
const mongoUri = process.env.MONGODB_URI;

// --- THIS LINE WAS MISSING ---
let useDb = false; 
// -----------------------------

if (mongoUri) {
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      useDb = true;
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      useDb = false;
      console.error('Failed to connect to MongoDB:', err.message);
    });
} else {
  console.log('No MONGODB_URI set — running with in-memory fallback.');
}

// In-memory fallback...
let inMemoryItems = [];
try {
  inMemoryItems = require('./data.json');
} catch (e) {
  inMemoryItems = [];
}

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', time: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the Lost and Found API!' });
});

// GET /api/items (This route is still public, anyone can see items)
app.get('/api/items', async (req, res) => {
  console.log('[GET] /api/items');
  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const docs = await Item.find().sort({ createdAt: -1 }).lean();
      return res.json(docs);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  return res.json(inMemoryItems);
});

// POST /api/items (Protected)
app.post('/api/items', protect, async (req, res) => {
  const payload = req.body;
  console.log('[POST] /api/items - payload:', payload);
  if (!payload || !payload.title) return res.status(400).json({ error: 'Missing item title' });

  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const doc = await Item.create({
        ...payload,
        user: req.user.userId 
      });
      
      console.log('Created item in DB:', doc._id, 'by user:', req.user.email);
      return res.status(201).json(doc);
    } catch (e) {
      console.error('DB create error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // In-memory fallback
  payload.id = inMemoryItems.length ? Math.max(...inMemoryItems.map(i => i.id || 0)) + 1 : 1;
  inMemoryItems.unshift(payload);
  console.log('Stored item in-memory (unprotected):', payload.id);
  return res.status(201).json(payload);
});

// get single item...
app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const doc = await Item.findById(id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.json(doc);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  const it = inMemoryItems.find(i => String(i.id) === String(id));
  if (!it) return res.status(404).json({ error: 'Not found' });
  return res.json(it);
});

// Serve static files...
app.use(express.static(path.join(__dirname, '../../frontend/build')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});