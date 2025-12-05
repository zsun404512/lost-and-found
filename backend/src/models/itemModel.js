import mongoose from 'mongoose';

// schema utilizes type, title, description, location, date, lat, lng, user, status, and image
const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], default: 'lost' },
  title: String,
  description: String,
  location: String,
  date: String,
  lat: Number,
  lng: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  image: {
    type: String,
    required: false,
  }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);

export default Item;