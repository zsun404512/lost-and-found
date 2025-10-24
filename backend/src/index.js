const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const morgan = require('morgan');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

// HTTP request logging
app.use(morgan('dev'));
app.use(express.json());
app.use(cors()); // enable CORS for dev

// Simple Mongoose schema for lost and found items
const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], default: 'lost' },
  title: String,
  description: String,
  location: String,
  date: String
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

// Try to connect to MongoDB if MONGODB_URI is provided
const mongoUri = process.env.MONGODB_URI;
let useDb = false;
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

// In-memory fallback (loads sample data.json if present)
let inMemoryItems = [];
try {
  inMemoryItems = require('./data.json');
} catch (e) {
  inMemoryItems = [];
}

app.get('/api/ping', (req, res) => {
  console.log('[GET] /api/ping');
  res.json({ message: 'pong', time: new Date().toISOString() });
});

// Basic API status route for quick checks
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the Lost and Found API!' });
});

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

app.post('/api/items', async (req, res) => {
  const payload = req.body;
  console.log('[POST] /api/items - payload:', payload);
  if (!payload || !payload.title) return res.status(400).json({ error: 'Missing item title' });

  if (useDb && mongoose.connection.readyState === 1) {
    try {
      const doc = await Item.create(payload);
      console.log('Created item in DB:', doc._id);
      return res.status(201).json(doc);
    } catch (e) {
      console.error('DB create error:', e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // In-memory fallback
  payload.id = inMemoryItems.length ? Math.max(...inMemoryItems.map(i => i.id || 0)) + 1 : 1;
  inMemoryItems.unshift(payload);
  console.log('Stored item in-memory:', payload.id);
  return res.status(201).json(payload);
});

// Optional: get single item
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

// Serve static files from frontend build (if you build the frontend into ../frontend/build)
app.use(express.static(path.join(__dirname, '../../frontend/build')));
app.get('*', (req, res) => {
  // If request starts with /api, skip and return 404
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
