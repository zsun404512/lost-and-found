import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import authRoutes from './routes/authRoutes.js';
import Item from './models/itemModel.js';
import Image from './models/imageModel.js';
import { protect } from './middleware/authMiddleware.js';
import uploadRoutes from './routes/uploadRoutes.js';
import messagesRoutes from './routes/messagesRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

dotenv.config();

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', protect, messagesRoutes);
app.use('/api/images', imageRoutes);

const mongoUri = process.env.MONGODB_URI;
let useDb = false;

if (mongoUri) {
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      useDb = true;
    })
    .catch((err) => {
      useDb = false;
    });
} 

// in memory fallback
let inMemoryItems = [];
try {
  inMemoryItems = require('./data.json');
} 
catch (e) {
  inMemoryItems = [];
}

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', time: new Date().toISOString() });
});
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the Lost and Found API!' });
});
app.get('/api/protected-example', protect, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/items 
app.get('/api/items', async (req, res) => {
  const { search, type, status } = req.query;
  const filter = {};

  if (!status || status === 'open') {
    filter.status = 'open';
  } 
  else if (status === 'resolved') {
    filter.status = 'resolved';
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (type && type !== 'all') {
    filter.type = type;
  }

  // populate items
  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const docs = await Item.find(filter)
        .sort({ createdAt: -1 })
        .populate('user', 'email')
        .lean();

      const itemsWithEmail = docs.map((doc) => {
        const userField = doc.user;
        let userId = userField;
        let userEmail = null;

        if (userField && typeof userField === 'object') {
          userId = userField._id || userField.id || userField;
          userEmail = userField.email || null;
        }

        return {
          ...doc,
          user: userId ? String(userId) : undefined,
          userEmail,
        };
      });

      return res.json(itemsWithEmail);
    } 
    catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.json(inMemoryItems);
});

// POST /api/items (Protected)
app.post('/api/items', protect, async (req, res) => {
  const { title, type, description, location, date, image, lat, lng } = req.body;
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
        lat,
        lng,
        user: req.user.userId 
      });
      
      return res.status(201).json(doc);
    } 
    catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // in memory fallback
  const payload = {
    title,
    type,
    description,
    location,
    date,
    image,
    lat,
    lng,
    status: 'open',
    user: req.user ? req.user.userId : undefined,
  };
  payload.id = inMemoryItems.length ? Math.max(...inMemoryItems.map((i) => i.id || 0)) + 1 : 1;

  inMemoryItems.unshift(payload);
  return res.status(201).json(payload);
});

// GET /api/items/:id
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

// DELETE /api/items/:id (Protected)
app.delete('/api/items/:id', protect, async (req, res) => {
  if (!useDb || mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const imageId = item.image;

    if (imageId && typeof imageId === 'string' && !imageId.startsWith('/uploads')) {
      await Image.deleteOne({ _id: imageId });
    }

    await Item.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Item removed successfully' });
  } 
  catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/items/:id
app.put('/api/items/:id', protect, async (req, res) => {
  if (!useDb || mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  const { title, type, description, location, date, image, lat, lng } = req.body;

  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (title !== undefined) {
      item.title = title;
    }
    if (type !== undefined) {
      item.type = type;
    }
    if (description !== undefined) {
      item.description = description;
    }
    if (location !== undefined) {
      item.location = location;
    }
    if (date !== undefined) {
      item.date = date;
    }
    if (image !== undefined) {
      item.image = image;
    }
    if (lat !== undefined) {
      item.lat = lat;
    }
    if (lng !== undefined) {
      item.lng = lng;
    }

    const updatedItem = await item.save();
    res.status(200).json(updatedItem);
  } 
  catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/items/:id/toggle-resolve
app.put('/api/items/:id/toggle-resolve', protect, async (req, res) => {
  if (!useDb || mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }

  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.user.toString() !== req.user.userId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    item.status = item.status === 'open' ? 'resolved' : 'open';
    await item.save();
    res.status(200).json(item);
  }
  catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// static files serving
app.use(express.static(path.join(__dirname, '../../frontend/build')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
