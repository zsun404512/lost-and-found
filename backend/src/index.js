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
import uploadRoutes from './routes/uploadRoutes.js';
import messagesRoutes from './routes/messagesRoutes.js';

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
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', protect, messagesRoutes);

// make upload folder public
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// GET /api/items 
app.get('/api/items', async (req, res) => {
  console.log('[GET] /api/items');
  // search logic
  const { search, type } = req.query;

  const filter = {
    status: 'open'
  };

  // add to filter if search query is provided
  if (search) {
    // This will search the 'title' and 'description' fields
    // 'i' makes it case-insensitive
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // add to filter if title query is provided
  if (type && type !== 'all') {
    filter.type = type;
  }

  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const docs = await Item.find(filter).sort({ createdAt: -1 }).lean();
      return res.json(docs);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.json(inMemoryItems);
});

// POST /api/items (Protected)
app.post('/api/items', protect, async (req, res) => {
  const { title, type, description, location, date, image } = req.body;
  console.log('[POST] /api/items - payload:', req.body);
  if (!title) return res.status(400).json({ error: 'Missing item title' });

  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const doc = await Item.create({
        title,
        type,
        description,
        location,
        date,
        image,
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

// delete items
app.delete('/api/items/:id', protect, async (req, res) => {
  console.log(`[DELETE] /api/items/${req.params.id}`);

  // Check for DB connection
  if (!useDb || mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  try {
    // find item in database
    const item = await Item.findById(req.params.id);

    // check if item exists
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // compare item's 'user' field with the user from the token
    if (item.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // delete the item
    await Item.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// update an existing item (owner only)
app.put('/api/items/:id', protect, async (req, res) => {
  console.log(`[PUT] /api/items/${req.params.id}`);

  // Check for DB connection
  if (!useDb || mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  const { title, type, description, location, date, image } = req.body;

  try {
    // find item in database
    const item = await Item.findById(req.params.id);

    // check if item exists
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // compare item's 'user' field with the user from the token
    if (item.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Apply partial updates (only if field is provided)
    if (title !== undefined) item.title = title;
    if (type !== undefined) item.type = type;
    if (description !== undefined) item.description = description;
    if (location !== undefined) item.location = location;
    if (date !== undefined) item.date = date;
    if (image !== undefined) item.image = image;

    const updatedItem = await item.save();

    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Update Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// toggle post status between open and resolved (owner of post only)
app.put('/api/items/:id/toggle-resolve', protect, async (req, res) => {
  console.log(`[PUT] /api/items/${req.params.id}/toggle-resolve`);

  // Check for DB connection
  if (!useDb || mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  try {
    // find the item
    const item = await Item.findById(req.params.id);

    // check if item exists 
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // compare item's 'user' field with the user from the token
    if (item.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // toggle status
    item.status = item.status === 'open' ? 'resolved' : 'open';
    await item.save();

    // send back updated item to frontend
    res.status(200).json(item);
  }
  catch (error) {
    console.error('Resolve Toggle Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
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